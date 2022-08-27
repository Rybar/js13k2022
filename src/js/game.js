import RetroBuffer from './core/RetroBuffer.js';
import MusicPlayer from './musicplayer.js';
import Player from './entities/player.js';

//sound assets
import cellComplete from './sounds/cellComplete.js';
import tada from './sounds/tada.js';
import rocksmash1 from './sounds/rocksmash1.js';
import wind1 from './sounds/wind1.js';
import windlooprush from './sounds/windloop-with-rushes.js.js';


import { playSound, Key, lerp, randInt, randFloat, choice, scaleNumber } from './core/utils.js';
import Splode from './splode.js';
import Map from './entities/map.js';
import { Vert, Splat, shapes, randomSpherePoint, shape, DRAWDISTANCE, Line3d } from './core/threedee.js';

if(innerWidth < 800){
  screenFactor = 2;
  w = innerWidth/2;
  h = innerHeight/2;
}
else {
  screenFactor = 4;
  w = Math.floor(innerWidth/4);
  h = Math.floor(innerHeight/4);
}

view = { x: 0, y: 0, z: 0 };
camera = {};
cursor = { x: 0, y: 0, isDown: false };
viewTarget = { x: 0, y: 0 };
then = 0; elapsed = 0; now = 0;
framesPerSecond = 60;
fpsInterval = 1000 / framesPerSecond;

window.t = 1;
splodes = [];
splatShapes = [];
window.lines = [];
gamestate=0;
paused = false;
debug = false;
started=false;
sounds = {};
soundsReady = 0;
totalSounds = 2;
audioTxt = "";
debugText = "";

const PRELOAD = 0;
const GAME = 1;
const TITLESCREEN = 2;
const WELL = 3;
const PURGATORY = 4;
const HELL = 5;
const HEAVEN = 6;

const SCREENCENTERX = w/2; 
const SCREENCENTERY = h/2;
const FALLSPEED = 7;

const styleSheet = document.createElement("style")
styleSheet.type = "text/css"
styleSheet.innerText = `
  canvas {display: inline-block; height:100%; width:100%;  image-rendering: pixelated;
    image-rendering: crisp-edges; background-color: black;}

  * {
    overflow: hidden;
    background-color: black;
    margin: 0;
    }
`
document.head.appendChild(styleSheet)


const atlasURL = 'DATAURL:src/img/palette.webp';
atlasImage = new Image();
atlasImage.src = atlasURL;

atlasImage.onload = function(){ 
  let c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  let ctx = c.getContext('2d');
  ctx.drawImage(this, 0, 0);
  atlas = new Uint32Array( ctx.getImageData(0,0,64, 64).data.buffer );
  window.r = new RetroBuffer(w, h, atlas, 10);
  gameInit();
};

function gameInit(){
  window.playSound = playSound;
  gamebox = document.getElementById("game");
  gamebox.appendChild(r.c);
  mainLoop();
}

function initGameData(){
  window.player = new Player(0,5,20);
  prepareWellData();
  preparePurgatoryData();
  prepareHellData();
  prepareHeavenData();
    //camX, camY, camZ, cx, cy, and scale.
  camera = {
    camX: 0,
    camY: 0,
    camZ: -10,
    pitch: 0,
    yaw: 0,
    cx: SCREENCENTERX,
    cy: SCREENCENTERY,
    scale: 300
  }
}

function initAudio(){
  audioCtx = new AudioContext;
  audioMaster = audioCtx.createGain();
  compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-50, audioCtx.currentTime);
    compressor.knee.setValueAtTime(40, audioCtx.currentTime); 
    compressor.ratio.setValueAtTime(12, audioCtx.currentTime);
    compressor.attack.setValueAtTime(0, audioCtx.currentTime);
    compressor.release.setValueAtTime(0.25, audioCtx.currentTime);

  audioMaster.connect(compressor);
  compressor.connect(audioCtx.destination);

  sndData = [
    {name:'cellComplete', data: cellComplete},
    {name:'tada', data: tada},
    {name:'rocksmash1', data: rocksmash1},
    {name:'windrush', data: windlooprush}

  ]
  totalSounds = sndData.length;
  soundsReady = 0;
  sndData.forEach(function(o){
    const sndGenerator = new MusicPlayer();
    sndGenerator.init(o.data);
    let done = false;
    setInterval(function () {
      if (done) {
        return;
      }
      done = sndGenerator.generate() == 1;
      soundsReady+=done;
      if(done){
        let wave = sndGenerator.createWave().buffer;
        audioCtx.decodeAudioData(wave, function(buffer) {
          sounds[o.name] = buffer;
        })
      }
    },0)
  })
}

function update_well(){


  if(!debug){
    t+=1;
  let i = 0;let shapelen = splatShapes.length;
  while(i < shapelen){
    let s = splatShapes[i];
    let j = 0; let splatlen = s.splats.length;
    while(j < splatlen){
      let splat = s.splats[j];
      splat.vert.z-=FALLSPEED;
      if(splat.vert.z < -10){
        splat.vert.z = DRAWDISTANCE;
      }
      j++;
    }
    i++;
  }

  let move = 0.05;
  if(Key.isDown(Key.w) || Key.isDown(Key.z) || Key.isDown(Key.UP)){
    player.move(0, -move);
  }
  if(Key.isDown(Key.s) || Key.isDown(Key.DOWN)){
    player.move(0, move);
  }
  if(Key.isDown(Key.a) || Key.isDown(Key.q) || Key.isDown(Key.LEFT)){
    player.move(-move, 0);
  }
  if(Key.isDown(Key.d) || Key.isDown(Key.RIGHT)){
    player.move(move, 0);
  }

  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', function(event) {
      player.move(event.gamma * 0.1, event.beta * 0.1);
    }, false);
  }

  player.update();

} else{
    let debugZ = camera.camZ < 0 ? "NEG " + camera.camZ : camera.camZ;
    debugText = `X ${camera.camX.toFixed(3)}\nY ${camera.camY}\nZ ${debugZ}\nPITCH ${camera.pitch}\nYAW ${camera.yaw}\n${player.accelleration.x.toFixed(3)}`;

    if(Key.isDown(Key.w)){
    let camVel = 1
    camera.camX += Math.sin(camera.yaw)*Math.cos(camera.pitch)*camVel;
    camera.camZ += Math.cos(camera.yaw)*Math.cos(camera.pitch)*camVel;
    camera.camY += Math.sin(camera.pitch)*camVel;
   }
  
  if(Key.isDown(Key.s)){
    let camVel = 1
    camera.camX -= Math.sin(camera.yaw)*Math.cos(camera.pitch)*camVel;
    camera.camZ -= Math.cos(camera.yaw)*Math.cos(camera.pitch)*camVel;
    camera.camY -= Math.sin(camera.pitch)*camVel;
  }

  if(Key.isDown(Key.a)){
    let camVel = 1
    camera.camX -= Math.cos(-camera.yaw)*Math.cos(0)*camVel;
    camera.camZ -= Math.sin(-camera.yaw)*Math.cos(0)*camVel;
    camera.camY -= Math.sin(0)*camVel;
  }

  if(Key.isDown(Key.d)){
    let camVel = 1
    camera.camX += Math.cos(-camera.yaw)*Math.cos(0)*camVel;
    camera.camZ += Math.sin(-camera.yaw)*Math.cos(0)*camVel;
    camera.camY += Math.sin(0)*camVel;
  }

  if(Key.isDown(Key.UP)){ camera.pitch += 0.01; }
  if(Key.isDown(Key.DOWN)){ camera.pitch -= 0.01; }
  if(Key.isDown(Key.LEFT)){ camera.yaw -= 0.01; }
  if(Key.isDown(Key.RIGHT)){ camera.yaw += 0.01; }

  }//debug

}

function draw_well(){
  r.clr(0, r.SCREEN)
  r.pat=r.dither[14];
  r.cursorColor2 = 0;
  r.fillRect(0,0,w,h, 1, 9999);
  r.cursorColor2 = 64;
  r.pat = r.dither[0];
  player.draw();
  let i = 0;let shapelen = splatShapes.length;
  while(i < shapelen){
    let s = splatShapes[i];
    let j = 0; let splatlen = s.splats.length;
    while(j < splatlen){
      let splat = s.splats[j];
      splat.draw(camera);
      j++;
    }
    i++;
  }
  if(debug){
    r.text([debugText, 10, 10, 1, 3, 'left', 'top', 1, 22]);
  }
  r.render();
}

function resetGame(){
  gamestate = TITLESCREEN;
  window.t = 1;
  splodes = [];
  splatShapes = [];
  player.alive = true;
  debug = false;
  initGameData();
}

function preload(){
  r.clr(0, r.SCREEN)

  r.text([audioTxt, w/2-2, 100, 1, 3, 'center', 'top', 1, 22]);
 
  audioTxt = "CLICK TO INITIALIZE\nGENERATION SEQUENCE";
  if(soundsReady == totalSounds){
    audioTxt="ALL SOUNDS RENDERED.\nTAP OR CLICK TO CONTINUE";
  } else if (started){
    audioTxt = "SOUNDS RENDERING... " + soundsReady;
  } else {
    audioTxt = "CLICK TO INITIALIZE\nGENERATION SEQUENCE";
  }

  if(soundsReady == totalSounds){
    gamestate = TITLESCREEN;
    cursor.isDown = false;
  }

  r.render();
}

function titlescreen(){
  cursor.isDown = false;
  r.clr(0, r.SCREEN)
  let text = "THE WELL"
  r.text([text, w/2-2, 100, 2, 3, 'center', 'top', 3, 22]);
  text = "CLICK TO BEGIN";
  r.text([text, w/2-2, 120, 1, 3, 'center', 'top', 1, 22]);
  r.render();
}



function pruneDead(entitiesArray){
  for(let i = 0; i < entitiesArray.length; i++){
    let e = entitiesArray[i];
    if(!e.alive){
      entitiesArray.splice(i,1);
    }
  }
}

function pruneScreen(entitiesArray){
  for(let i = 0; i < entitiesArray.length; i++){
    let e = entitiesArray[i];
    if(!inView(e)){
      entitiesArray.splice(i,1);
    }
  }
}

function gameLoop(){
  if(1==1){
    switch(gamestate){
      case PRELOAD: 
        preload();
        break;
      case WELL: 
        update_well();
        draw_well();
        break;
      case TITLESCREEN: 
        titlescreen();
        break;
    }
  }
}

function mainLoop(){

  requestAnimationFrame(mainLoop);

  // calc elapsed time since last loop
  now = Date.now();
  elapsed = (now - then);

  // if enough time has elapsed, draw the next frame
  if (elapsed > fpsInterval) {
      then = now - (elapsed % fpsInterval);
      gameLoop();
  }
  if(Key.justReleased(Key.r)){ resetGame(); }
  if(Key.justReleased(Key.ZERO)){debug=!debug;}

  Key.update();
}

function prepareWellData(){
  let stoneCount = 24;
  let ringCount = DRAWDISTANCE/80;

  for(let j = 0; j < ringCount; j++){
    let wellStones = [];
    for(let i = 0; i < stoneCount; i++){
      let radius = 42;
      let tau = Math.PI*2;
      let increment = tau/stoneCount;
      let stoneColor = choice([1,31,32])
      //let positionOffset = {x:}
      let stone = new Splat(
        Math.sin( increment * i )*radius,
        Math.cos( increment * i )*radius,
        i %2 == 0 ? 0 : 40,
        {
        size: 7.6,
        shape: shapes.TRIANGLES,
        fill:{
          color1: 0, color2:  choice[0,1], pattern: r.dither[randInt(0,8)]
        },
        angle: (Math.PI*2* -(i/stoneCount)),
        triangles: [
          { points: [ {x: -1, y: -1, z: 0}, {x: 1, y: -1, z: 0}, {x: -1.6, y: 1, z: 0}], color: stoneColor },
          { points: [ {x: -1.6, y: 1, z: 0}, {x: 1, y: -1, z: 0}, {x: 1.6, y: 1, z: 0}], color: stoneColor },
        ]
      });
      wellStones.push(stone);
    }
    splatShapes.push(new shape(0,0,80*j,wellStones));
  }
  

  let chunks = [];
  for(let i = 0; i < 1000; i++){
    let rad = randFloat(0, Math.PI*2);
    let radius = 44;
    let x = Math.sin(rad) * radius;
    let y = Math.cos(rad) * radius;
    let z = DRAWDISTANCE/60 * randInt(0,60)
     + randInt(0,20);
    let point = new Vert(x, y, z);
    let splat = new Splat(
      point.x, point.y, point.z,
    {
      fill: { color1: choice([1,31]), color2: choice([1,31]), pattern: r.dither[choice([7,8])] },
      shape: shapes.CIRCLE,
      size: randInt(15,30),
    });
    
    chunks.push( splat )
  }
  splatShapes.push(new shape(0,0,0, chunks));

}

function prepareHellData(){

}

function preparePurgatoryData(){

}

function prepareHeavenData(){

}

//initialize  event listeners--------------------------
window.addEventListener('keyup', function (event) {
  Key.onKeyup(event);
}, false);
window.addEventListener('keydown', function (event) {
  Key.onKeydown(event);
}, false);
window.addEventListener('blur', function (event) {
  paused = true;
}, false);
window.addEventListener('focus', function (event) {
  paused = false;
}, false);

window.addEventListener('mousemove', function (event) {
} , false);
window.addEventListener('mousedown', function (event) {
  cursor.isDown = true;
} , false);
window.addEventListener('mouseup', function (event) {
  cursor.isDown = false;
} , false);

window.addEventListener('touchstart', function (event) {
  if(gamestate == PRELOAD){
    onWindowInteraction(event); 
  } else {
    cursor.isDown = true;
  }
}, false);

window.addEventListener('touchend', function (event) {
  cursor.isDown = false;
} , false);

onWindowInteraction = function(e){
  x=e.pageX;y=e.pageY;
  paused = false;
  switch(gamestate){
      case PRELOAD: 
        if(soundsReady == 0 && !started){
          initGameData();
          initAudio();
          started = true

        }
      break;

      case TITLESCREEN:
      gamestate = WELL;
      playSound(sounds.windrush, 1, 0, 0.6, true);
      setTimeout(function(){
        playSound(sounds.windrush, 1, 0, 0.6, true);
      }, 9000);
      break;

      case WELL:
        let pan = scaleNumber(
          player.position.x, -40, 40, -1, 1
        )
        playSound(sounds.rocksmash1, 1, pan, 0.7, false)
      break;

      case GAMEOVER: 
  }
}
onclick=e=>{ onWindowInteraction(e); }
ontouchstart=e=>{ onWindowInteraction(e);}