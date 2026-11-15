import { createGame } from './game.js';
import { stageShot } from './shots.js';

const canvas=document.getElementById('game');
const params=new URLSearchParams(location.search),shot=params.get('shot'),seed=Number(params.get('seed')||7);
if(shot)window.__shotMode=true;
const game=createGame(canvas,{seed,shotMode:!!shot});
if(shot)stageShot(shot,game);else game.start();
