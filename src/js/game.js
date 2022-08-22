import RetroBuffer from './core/RetroBuffer.js';
import MusicPlayer from './musicplayer.js';
import Player from './entities/player.js';
import Fan from './entities/fan.js';

//sound assets
import cellComplete from './sounds/cellComplete.js';
import tada from './sounds/tada.js';

import { playSound, Key, lerp, randInt, randFloat, choice } from './core/utils.js';
import Splode from './splode.js';
import Map from './entities/map.js';
import { matrix_rotate, project3D, Vert, Splat, shapes } from './core/threedee.js';

if(innerWidth < 800){
  screenFactor = 2;
  w = innerWidth/2;
  h = innerHeight/2;
}
else {
  screenFactor = 3;
  w = Math.floor(innerWidth/3);
  h = Math.floor(innerHeight/3);
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
fans = [];
splats = [];
window.player = new Player(100, 100);
screenCenterX = w/2; screenCenterY = h/2;
gamestate=0;
paused = false;
started=false;
sounds = {};
soundsReady = 0;
totalSounds = 2;
audioTxt = "";
debugText = "";

const PRELOAD = 0;
const GAME = 1;
const TITLESCREEN = 2;

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
//map generation, pre-drawing, etc would go here
  
  for(let i = 0; i < 8000; i++){
    let spread = 90;
    let color1 = randInt(0, 63);
    let color2 = color1++
    let splat = new Splat(randFloat(-spread, spread), randFloat(-spread,spread), randFloat(0, spread), 
    {
      fill: { color1: color1, color2: color2, pattern: r.dither[8] },
      size: 20,
      shape: randInt(0, 1)
    });
    splats.push( splat );
  }
  splats.sort(function(a,b){ return a.vert.z - b.vert.z; });
  //camX, camY, camZ, cx, cy, and scale.
  camera = {
    camX: 0,
    camY: 0,
    camZ: -1,
    pitch: 0,
    yaw: 0,
    cx: screenCenterX,
    cy: screenCenterY,
    scale: 200
  }
}

function initAudio(){
  audioCtx = new AudioContext;
  audioMaster = audioCtx.createGain();
  compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-60, audioCtx.currentTime);
    compressor.knee.setValueAtTime(40, audioCtx.currentTime); 
    compressor.ratio.setValueAtTime(12, audioCtx.currentTime);
    compressor.attack.setValueAtTime(0, audioCtx.currentTime);
    compressor.release.setValueAtTime(0.25, audioCtx.currentTime);

  audioMaster.connect(compressor);
  compressor.connect(audioCtx.destination);

  sndData = [
    {name:'cellComplete', data: cellComplete},
    {name:'tada', data: tada},

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

function updateGame(){
  t+=1;
  splodes.forEach(e=>e.update());
  splats.forEach(e=>{
    // newPoint = matrix_rotate(e, 0, 0.01, 0 )
    // e.x = newPoint.x;
    // e.y = newPoint.y;
    // e.z = newPoint.z;
  })

  pruneDead(splodes);

  player.update();

  viewTarget.x = player.x - screenCenterX;
  viewTarget.y = player.y - screenCenterY;
  view.x = lerp(view.x, viewTarget.x, 0.1);
  view.y = lerp(view.y, viewTarget.y, 0.1);
  camera.camX = view.x / 5;
  camera.camY = view.y / 5;
  
  if(Key.justReleased(Key.r)){
    resetGame();
  }
  if(Key.isDown(Key.w)){ camera.camZ += 0.1; }
  if(Key.isDown(Key.s)){ camera.camZ -= 0.1; }
  if(Key.isDown(Key.q)){ camera.yaw += 0.01; }
  let debugZ = camera.camZ < 0 ? "NEG " + camera.camZ : camera.camZ;
  debugtxt = `X ${camera.camX.toFixed(3)}\nY ${camera.camY}\nZ ${debugZ}\nPITCH ${camera.pitch}\nYAW ${camera.yaw}`;
}

function drawGame(){
  r.clr(1, r.SCREEN)

  player.draw();
  splats.forEach(e=>e.draw(camera));
  r.text([debugtxt, 10, 10, 1, 3, 'left', 'top', 1, 22]);
  r.render();
}

function resetGame(){
  window.t = 1;
  splodes = [];
  initGameData();
  gamestate = GAME;
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

  // if(Key.justReleased(Key.UP) || Key.justReleased(Key.w) || Key.justReleased(Key.z)){
  //     //playSound(sounds.tada);
  //     gamestate = GAME
    
  // }; 
  if(cursor.isDown && soundsReady == totalSounds){
    gamestate = GAME;
  }

  r.render();
}

function titlescreen(){
  if(Key.justReleased(Key.UP) || Key.justReleased(Key.w) || Key.justReleased(Key.z)){
    gamestate = 1;
  }

  r.clr(14, r.SCREEN)
  let cols = Math.ceil(w/32), rows = Math.ceil(h/32);
  let col = 32, row = 32;
  for(let i = 0; i < cols; i++){
    r.line(i * col, 0, i * col, r.HEIGHT, 2);
  }
  for(let i = 0; i < rows; i++){
    r.line(0, i * row, r.WIDTH, i * row, 2);
  }
  let text = "TITLE SCREEN"
  r.text([text, w/2-2, 100, 2, 3, 'center', 'top', 3, 22]);
  text = "CLICK TO BEGIN";
  r.text([text, w/2-2, 120, 1, 3, 'center', 'top', 1, 22]);


  r.render();
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
  if(cursor.isDown){handleInput(event)};
} , false);
window.addEventListener('mousedown', function (event) {
  cursor.isDown = true;
  handleInput(event);
} , false);
window.addEventListener('mouseup', function (event) {
  cursor.isDown = false;
  handleInput(event);
} , false);

window.addEventListener('touchstart', function (event) {
  
  if(gamestate == PRELOAD){
    onWindowInteraction(event); 
  } else {
    cursor.isDown = true;
    handleInput(event);
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
          started = true;
        }
      break;

      case TITLESCREEN: 
      break;

      case GAME:
        
      break;

      case GAMEOVER: 
  }
}

onclick=e=>{ onWindowInteraction(e); }
ontouchstart=e=>{ onWindowInteraction(e);}

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
      case GAME: 
        updateGame();
        drawGame();
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

      // Get ready for next frame by setting then=now, but also adjust for your
      // specified fpsInterval not being a multiple of RAF's interval (16.7ms) <--used to be pretty normal
      //to expect 60fps.  nowadays, it could be 120fps or even 240fps.  So, we need to adjust for that.
      then = now - (elapsed % fpsInterval);

      // Put your drawing code here
      gameLoop();
  }
  Key.update();
}

function handleInput(e){
  let screenX = Math.floor(e.pageX / screenFactor);
  let screenY = Math.floor(e.pageY / screenFactor);
  let worldY = screenY + view.y;
  let worldX = screenX + view.x;
  if(!cursor.isDown){
    player.move(worldX, worldY);
  }
  else{
    splodes.push(new Splode(worldX, worldY, randInt(5, 10), randInt(0,63)));
  }
}