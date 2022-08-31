W = window;
import { Vert, Splat, shapes, shape, DD, project3D,  } from './core/threedee.js';
import { playSound, Key, lerp, randInt, randFloat, choice, scaleNumber, clamp } from './core/utils.js';
import RetroBuffer from './core/RetroBuffer.js';
import MusicPlayer from './musicplayer.js';
import Player from './entities/player.js';

//sound assets
import cellComplete from './sounds/cellComplete.js';
import tada from './sounds/tada.js';
import rocksmash1 from './sounds/rocksmash1.js';
import wind1 from './sounds/wind1.js';
import windlooprush from './sounds/windloop-with-rushes.js.js';





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

W.camera = {};
W.view = {x: 0, y: 0};
W.cursor = { x: 0, y: 0, isDown: false };
W.then = 0; W.elapsed = 0; W.now = 0;
W.framesPerSecond = 60;
W.fpsInterval = 1000 / framesPerSecond;

W.t = 1;
splodes = [];
splatShapes = [];
staticSplats = [];
worldSplatShapes = [];
obstacles = [];
gamestate=0;
paused = false;
debug = false;
started=false;
sounds = {};
soundsReady = 0;
totalSounds = 2;
audioTxt = "";
debugText = "";


window.PRELOAD= 0;
window.GAME = 1;
window.TITLESCREEN = 2;
window.WELL = 3;
window.PURGATORY = 4;
window.HELL = 5;
window.HEAVEN = 6;


window.SCREENCENTERX= w/2; 
window.SCREENCENTERY= h/2;

window.fallspeed = 7;
window.deaths = 0;
window.worldZ = 0;
window.deathText = "";
window.worldLength = 10000;

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
  window.player = new Player(0,5,90);
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
    worldZ+=fallspeed;
  let i = 0;let shapelen = splatShapes.length;
  while(i < shapelen){
    let s = splatShapes[i];
    let j = 0; let splatlen = s.splats.length;
    while(j < splatlen){
      let splat = s.splats[j];
      splat.vert.z-=fallspeed;
      if(splat.vert.z < -10){
        splat.vert.z = DD;
      }
      j++;
    }
    i++;
  }
  i = 0; shapelen = worldSplatShapes.length;
  while(i < shapelen){
    let s = worldSplatShapes[i];
    let j = 0; let splatlen = s.splats.length;
    while(j < splatlen){
      let splat = s.splats[j];
      splat.vert.z-=fallspeed;
      if(splat.vert.z < -10){
        splat.vert.z = worldLength;
      }
      j++;
    }
    i++;
  }

  splodes.forEach(e=>{e.update();});

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



  player.update();

} else{
    let debugZ = camera.camZ < 0 ? "NEG " + camera.camZ : camera.camZ;
    debugText = `X ${camera.camX.toFixed(3)}\nY ${camera.camY}\nZ ${debugZ}\nPITCH ${camera.pitch}\nYAW ${camera.yaw}\n${player.acc.x.toFixed(3)}`;

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

  pruneDead(splodes);
}

function draw_well(){
  r.clr(0, r.SCREEN)
  r.pat=r.DTH[14];
  r.P2 = 0;
  r.fillRect(0,0,w,h, 1, 9999);
  r.P2 = 64;
  r.pat = r.DTH[0];
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
  i = 0; shapelen = worldSplatShapes.length;
  while(i < shapelen){
    let s = worldSplatShapes[i];
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

  splodes.forEach(e=>{e.draw();});
  r.render();
}

function resetGame(){
  gamestate = TITLESCREEN;
  window.t = 1;
  splodes = [];
  splatShapes = [];
  player.alive = true;
  debug = false;
  fallspeed = 7;
  initGameData();
}

function restartLevel(){

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
  t++;
  cursor.isDown = false;
  r.clr(0, r.SCREEN)
  let interval = 600, frames = 5;
  let flip = t % interval < interval-frames;
  let text = flip ? "THE WELL" : "THE LOOP";
  let color = flip ? 22 : 19;
  if(!flip){
    let x = randInt(0, w);
    let y = randInt(0, h);
    r.line(0, y, w, y, 19);
    r.line(x, 0, x, h, 19);
  }
  r.text([text, w/2-2, 100, 2, 3, 'center', 'top', 3, color]);
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
  let ringCount = DD/80;

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
        shape: shapes.TRI,
        F:{
          C1: 0, C2:  choice[0,1], pattern: r.DTH[randInt(0,8)]
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
    let z = DD/60 * randInt(0,60)
     + randInt(0,20);
    let point = new Vert(x, y, z);
    let splat = new Splat(
      point.x, point.y, point.z,
    {
      F: { C1: choice([1,31]), C2: choice([1,31]), pattern: r.DTH[choice([7,8])] },
      shape: shapes.CIR,
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
      break;

      case GAMEOVER: 
  }
}
onclick=e=>{ onWindowInteraction(e); }
ontouchstart=e=>{ onWindowInteraction(e);}

