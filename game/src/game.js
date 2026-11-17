import { BLOOMS, FIELD } from './config.js';
import { createRng } from './random.js';
import { Input, createButtonList } from './input.js';
import { AudioEngine } from './audio.js';
import { Particles } from './particles.js';
import { createPlayer, updatePlayer, updateEnemies, updateBullets, updatePollen, updateBulbs } from './entities.js';
import { startWave, spawnTick, waveCleared } from './waves.js';
import { rollChoices, applyUpgrade } from './upgrades.js';
import { createNovaState, updateNova, tryNova } from './abilities.js';
import { drawGame } from './render.js';

const STEP=1/60;
export function createGame(canvas,opts={}){
 const rng=createRng(opts.seed??7), fx=new Particles(), audio=new AudioEngine(), buttons=createButtonList();
 const state={screen:'title',wave:0,score:0,combo:1,comboTimer:0,pollenCount:0,pollen:[],best:Number(localStorage.getItem('glowmoth-best')||0),player:createPlayer(),enemies:[],bullets:[],enemyBullets:[],pollenOrbs:[],bulbs:[],blooms:BLOOMS.map(b=>({...b,lit:true})),waveQueue:[],spawnTimer:0,boss:null,stats:{kills:0,bloomsSaved:0,shotsFired:0,timePlayed:0},choices:[],rng,banner:{text:'',timer:0},nova:createNovaState(),hoverCard:-1};
 const input=new Input(canvas,buttons.buttons); const shotMode=!!opts.shotMode; let raf=0,last=0,acc=0,destroyed=false,ambient=0,fwTimer=0;
 function reset(){const best=state.best;Object.assign(state,{screen:'title',wave:0,score:0,combo:1,comboTimer:0,pollenCount:0,pollen:[],best,player:createPlayer(),enemies:[],bullets:[],enemyBullets:[],pollenOrbs:[],bulbs:[],blooms:BLOOMS.map(b=>({...b,lit:true})),waveQueue:[],boss:null,stats:{kills:0,bloomsSaved:0,shotsFired:0,timePlayed:0},choices:[],banner:{text:'',timer:0},nova:createNovaState(),hoverCard:-1});buttons.buttons.length=0;}
 function begin(){state.screen='play';startWave(state,1);state.banner={text:'WAVE 1',timer:1.6};audio.unlock();audio.waveHorn();}
 function pick(i){const u=state.choices[i];if(!u)return;buttons.buttons.length=0;applyUpgrade(state,u.id);audio.upgradePick();state.choices=[];if(state.wave>=10){state.screen='victory';audio.victory();}else{state.screen='play';startWave(state,state.wave+1);state.banner={text:state.wave===5?'THE GLOOMWING APPROACHES':state.wave===10?'THE GLOOM MOTH QUEEN':'WAVE '+state.wave,timer:1.8};audio.waveHorn();}}
 input.onClick=()=>{if(state.screen==='title'||state.screen==='over'||state.screen==='victory') state.screen==='title'?begin():reset();};
 function update(dt){if(state.screen==='title'){ambient+=dt;return;}if(state.screen!=='play')return;state.stats.timePlayed+=dt;if(state.banner.timer>0)state.banner.timer-=dt;updateNova(state.nova,dt);
   updatePlayer(state.player,state,state.driver||input,dt,rng,audio,fx);
   updateEnemies(state,dt,rng,audio,fx);spawnTick(state,dt,rng);updateBullets(state,dt,rng,audio,fx);updatePollen(state,dt,rng,audio,fx);updateBulbs(state,dt,rng,audio);fx.update(dt);
   for(const b of state.blooms){if(b.hp<=0)b.lit=false;else if(Math.hypot(state.player.x-b.x,state.player.y-b.y)<34&&state.pollenCount>=10&&b.hp<60){state.pollenCount-=10;b.hp=Math.min(60,b.hp+30);audio.bloomMend();fx.pollenBurst(b.x,b.y,12);}}
   state.comboTimer-=dt;if(state.comboTimer<=0)state.combo=1;state.boss=state.enemies.find(e=>e.kind==='Queen'||e.kind==='Gloomwing')||null;
   if(state.player.hp<=0||state.blooms.every(b=>!b.lit)){state.screen='over';audio.gameOver();state.best=Math.max(state.best,state.score);localStorage.setItem('glowmoth-best',String(state.best));}
   else if(waveCleared(state)){if(state.wave>=10){state.screen='victory';state.stats.bloomsSaved=state.blooms.filter(b=>b.lit).length;state.best=Math.max(state.best,state.score);localStorage.setItem('glowmoth-best',String(state.best));audio.victory();}else{state.choices=rollChoices(rng,state.player.upgrades);state.screen='upgrade';buttons.buttons.length=0;state.choices.forEach((u,i)=>buttons.add({x:170+i*315,y:290,w:270,h:220,index:i,onClick:()=>pick(i)}));}}
 }
 function keyUpdate(){if(state.driver)return;if(input.consumePressed('Enter')){if(state.screen==='title')begin();else if(state.screen==='over'||state.screen==='victory')reset();}if(input.consumePressed('KeyP')||input.consumePressed('Escape')){if(state.screen==='play')state.screen='pause';else if(state.screen==='pause')state.screen='play';}if(input.consumePressed('KeyM'))audio.toggleMute();if(input.consumePressed('KeyE')&&state.screen==='play')tryNova(state,audio,fx);if(input.consumePressed('KeyR')&&(state.screen==='over'||state.screen==='victory'||state.screen==='pause'))reset();if(state.screen==='upgrade')for(let i=0;i<3;i++)if(input.consumePressed(`Digit${i+1}`))pick(i);}
 function frame(now){if(destroyed)return;const dt=Math.min(.1,(now-last)/1000||0);last=now;keyUpdate();acc+=dt;while(acc>=STEP){update(STEP);acc-=STEP;}if(state.screen==='victory'&&!shotMode){fwTimer-=dt;if(fwTimer<=0){fwTimer=.45;fx.burst(200+Math.random()*880,120+Math.random()*300,['#ffd77a','#8bd9b2','#b58be8','#f27f9b'][Math.floor(Math.random()*4)],26,190);}}if(!shotMode){const lit=state.blooms.filter(b=>b.lit).length;window.__gameState={screen:state.screen,wave:state.wave,score:state.score,hp:state.player.hp,bloomsLit:lit,enemies:state.enemies.length,pollen:state.pollenCount};}if(state.screen==='upgrade'){const b=buttons.hitTest(input.mouse.x,input.mouse.y);state.hoverCard=b?b.index:-1;}draw(dt);raf=requestAnimationFrame(frame);}
 function draw(){drawGame(canvas.getContext('2d'),state,fx,state.stats.timePlayed+ambient);}
 return {state,setDriver(driver){state.driver=driver;},start(){if(!raf){last=performance.now();raf=requestAnimationFrame(frame);}},destroy(){destroyed=true;cancelAnimationFrame(raf);input.destroy();audio.stopMusic();},_step:update,_pick:pick,_render(){draw();},_nova(){return tryNova(state,audio,fx);},_fireworks(){for(let i=0;i<5;i++)fx.burst(200+Math.random()*880,120+Math.random()*300,['#ffd77a','#8bd9b2','#b58be8','#f27f9b'][i%4],26,190);}};
}
