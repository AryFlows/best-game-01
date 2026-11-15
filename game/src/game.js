import { BLOOMS, FIELD } from './config.js';
import { createRng } from './random.js';
import { Input, createButtonList } from './input.js';
import { AudioEngine } from './audio.js';
import { Particles } from './particles.js';
import { createPlayer, updatePlayer, updateEnemies, updateBullets, updatePollen, updateBulbs } from './entities.js';
import { startWave, spawnTick, waveCleared } from './waves.js';
import { rollChoices, applyUpgrade } from './upgrades.js';
import { drawGame } from './render.js';

const STEP=1/60;
export function createGame(canvas,opts={}){
 const rng=createRng(opts.seed??7), fx=new Particles(), audio=new AudioEngine(), buttons=createButtonList();
 const state={screen:'title',wave:0,score:0,combo:1,comboTimer:0,pollenCount:0,pollen:[],best:Number(localStorage.getItem('glowmoth-best')||0),player:createPlayer(),enemies:[],bullets:[],enemyBullets:[],pollenOrbs:[],bulbs:[],blooms:BLOOMS.map(b=>({...b,lit:true})),waveQueue:[],spawnTimer:0,boss:null,stats:{kills:0,bloomsSaved:0,shotsFired:0,timePlayed:0},choices:[],rng};
 const input=new Input(canvas,buttons.buttons); const shotMode=!!opts.shotMode; let raf=0,last=0,acc=0,destroyed=false,ambient=0;
 function reset(){const best=state.best;Object.assign(state,{screen:'title',wave:0,score:0,combo:1,comboTimer:0,pollenCount:0,pollen:[],best,player:createPlayer(),enemies:[],bullets:[],enemyBullets:[],pollenOrbs:[],bulbs:[],blooms:BLOOMS.map(b=>({...b,lit:true})),waveQueue:[],boss:null,stats:{kills:0,bloomsSaved:0,shotsFired:0,timePlayed:0},choices:[]});}
 function begin(){state.screen='play';startWave(state,1);audio.unlock();audio.waveHorn();}
 function pick(i){const u=state.choices[i];if(!u)return;applyUpgrade(state,u.id);audio.upgradePick();state.choices=[];if(state.wave>=10){state.screen='victory';audio.victory();}else{state.screen='play';startWave(state,state.wave+1);audio.waveHorn();}}
 input.onClick=()=>{if(state.screen==='title'||state.screen==='over'||state.screen==='victory') state.screen==='title'?begin():reset(); else if(state.screen==='upgrade')pick(0);};
 function update(dt){if(state.screen==='title'){ambient+=dt;return;}if(state.screen!=='play')return;state.stats.timePlayed+=dt;
   updatePlayer(state.player,state,state.driver||input,dt,rng,audio,fx);
   updateEnemies(state,dt,rng,audio,fx);spawnTick(state,dt,rng);updateBullets(state,dt,rng,audio,fx);updatePollen(state,dt,rng,audio,fx);updateBulbs(state,dt,rng,audio);fx.update(dt);
   for(const b of state.blooms){if(b.hp<=0)b.lit=false;else if(Math.hypot(state.player.x-b.x,state.player.y-b.y)<34&&state.pollenCount>=10&&b.hp<60){state.pollenCount-=10;b.hp=Math.min(60,b.hp+30);audio.bloomMend();fx.pollenBurst(b.x,b.y,12);}}
   state.comboTimer-=dt;if(state.comboTimer<=0)state.combo=1;state.boss=state.enemies.find(e=>e.kind==='Queen'||e.kind==='Gloomwing')||null;
   if(state.player.hp<=0||state.blooms.every(b=>!b.lit)){state.screen='over';audio.gameOver();state.best=Math.max(state.best,state.score);localStorage.setItem('glowmoth-best',String(state.best));}
   else if(waveCleared(state)){if(state.wave>=10){state.screen='victory';state.stats.bloomsSaved=state.blooms.filter(b=>b.lit).length;state.best=Math.max(state.best,state.score);localStorage.setItem('glowmoth-best',String(state.best));audio.victory();}else{state.choices=rollChoices(rng,state.player.upgrades);state.screen='upgrade';}}
 }
 function keyUpdate(){if(state.driver)return;if(input.consumePressed('Enter')){if(state.screen==='title')begin();else if(state.screen==='over'||state.screen==='victory')reset();}if(input.consumePressed('KeyP')||input.consumePressed('Escape')){if(state.screen==='play')state.screen='pause';else if(state.screen==='pause')state.screen='play';}if(input.consumePressed('KeyM'))audio.toggleMute();if(input.consumePressed('KeyR')&&(state.screen==='over'||state.screen==='victory'||state.screen==='pause'))reset();if(state.screen==='upgrade')for(let i=0;i<3;i++)if(input.consumePressed(`Digit${i+1}`))pick(i);}
 function frame(now){if(destroyed)return;const dt=Math.min(.1,(now-last)/1000||0);last=now;keyUpdate();acc+=dt;while(acc>=STEP){update(STEP);acc-=STEP;}if(now-ambient*1000>0){};if(!shotMode){const lit=state.blooms.filter(b=>b.lit).length;window.__gameState={screen:state.screen,wave:state.wave,score:state.score,hp:state.player.hp,bloomsLit:lit,enemies:state.enemies.length,pollen:state.pollenCount};}draw(dt);raf=requestAnimationFrame(frame);}
 function draw(){drawGame(canvas.getContext('2d'),state,fx,state.stats.timePlayed+ambient);}
 return {state,setDriver(driver){state.driver=driver;},start(){if(!raf){last=performance.now();raf=requestAnimationFrame(frame);}},destroy(){destroyed=true;cancelAnimationFrame(raf);input.destroy();audio.stopMusic();},_step:update,_pick:pick,_render(){draw();}};
}
