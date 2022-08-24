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
import { matrix_rotate, project3D, Vert, Splat, shapes, randomSpherePoint, shape, DRAWDISTANCE, Line3d } from './core/threedee.js';

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
splatShapes = [];
window.lines = [];
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
  let stars = [];
  let locations = [
    {x:0, y:0, rad: 100, colors: [16,17,19], quantity: 2000},
  ]
  for(let i=0; i<10; i++){
    let rad = randFloat(0, Math.PI*2);
    let distance = 200 + randFloat(0, 300);
    locations.push({
      x: Math.cos(rad)*distance,
      y: Math.sin(rad)*distance,
      rad: randInt(100,500),
      colors: [30,31,32],
      quantity: randInt(100,200),
    })
  }
  locations.forEach(location=>{
    stars = [];
    for(let i = 0; i < location.quantity; i++){
      let radius = location.rad;
      let color1 = choice(location.colors);
      let color2 = choice(location.colors);
      //random points in a ring on the xy plane
      let rad = randFloat(0, Math.PI*2);
      let x = location.x + Math.sin(rad) * radius;
      let y = location.y + Math.cos(rad) * radius;
      let z = -DRAWDISTANCE/location.quantity * i;
      let point = new Vert(x, y, z);
      let splat = new Splat(
        point.x, point.y, point.z,
      {
        fill: { color1: color1, color2: color2, pattern: r.dither[8] },
        shape: shapes.CIRCLE,
        size: randFloat(7,15),
        
      });
      stars.push( splat )
    }
    splatShapes.push(new shape(0,0,0, stars));
  })

  let chunks = [];
  for(let i = 0; i < 25; i++){
    let rad = randFloat(0, Math.PI*2);
    let radius = 50;
    let x = Math.sin(rad) * radius;
    let y = Math.cos(rad) * radius;
    let z = -DRAWDISTANCE/25 * i;
    let point = new Vert(x, y, z);
    let splat = new Splat(
      point.x, point.y, point.z,
    {
      fill: { color1: 0, color2: 1, stroke: 19, pattern: r.dither[randInt(0,8)] },
      shape: shapes.CIRCLE,
      size: randInt(30, 70),
    });
    if(randFloat(0,1) > 0.9){
      splat.size = 200;
      splat.vert.x = Math.sin(rad) * 150;
      splat.vert.y = Math.cos(rad) * 150;
      splat.fill.stroke = 16;
    }
    chunks.push( splat )
  }
  splatShapes.push(new shape(0,0,0, chunks));

  chunks = [];
  for(let i = 0; i < 900; i++){
    let rad = randFloat(0, Math.PI*2);
    let radius = 50;
    let x = Math.sin(rad) * radius;
    let y = Math.cos(rad) * radius;
    let z = -DRAWDISTANCE/4 * randInt(0,3) + Math.random() * 20;
    let point = new Vert(x, y, z);
    let splat = new Splat(
      point.x, point.y, point.z,
    {
      fill: { color1: choice([0,41,42]), color2: choice([0,41,42]), stroke: 40, pattern: r.dither[randInt(0,8)] },
      shape: shapes.SQUARE,
      size: randInt(5, 15),
    });
    if(randFloat(0,1) > 0.98){
      splat.size = randInt(80, 120);
      
    }
    chunks.push( splat )
  }
  splatShapes.push(new shape(0,0,0, chunks));

  for(let i = 0; i < 50; i++){
    let x = randFloat(-60, 60);
    let y = randFloat(-60, 60);
    let z1 = 0;
    let z2 = 100;
    let color = choice([3,4,5])
    for(let z = -2000; z < DRAWDISTANCE; z+=10){
     lines.push(new Line3d(x, y, z, x, y, z-10, color));
    }
  }

  //camX, camY, camZ, cx, cy, and scale.
  camera = {
    camX: 0,
    camY: 0,
    camZ: -2000,
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
  // splatShapes.forEach(e=>{
  //   e.splats.forEach(e=>{
  //     e.vert.z-=1;
  //     e.vert.z = e.vert.z % DRAWDISTANCE;
  //   })
  // })
  

  pruneDead(splodes);

  //player.update();

  
  
  if(Key.justReleased(Key.r)){
    resetGame();
  }

  /*
  playerVX+=Math.sin(yaw)*Math.cos(pitch)*accel;
		playerVZ+=Math.cos(yaw)*Math.cos(pitch)*accel;
		playerVY+=Math.sin(pitch)*accel;
    */
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

  //mouse movement controls camera yaw and pitch.
  

  let debugZ = camera.camZ < 0 ? "NEG " + camera.camZ : camera.camZ;
  debugtxt = `X ${camera.camX.toFixed(3)}\nY ${camera.camY}\nZ ${debugZ}\nPITCH ${camera.pitch}\nYAW ${camera.yaw}`;

}

function drawGame(){
  r.clr(1, r.SCREEN)

  //player.draw();
  splatShapes.forEach(e=>{
    e.splats.forEach(e=>e.draw(camera));
  })
  lines.forEach(e=>e.draw(camera));
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
  camera.pitch += event.movementY * 0.001;
  camera.yaw += event.movementX * 0.001;
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
    
  }
  else{
    splodes.push(new Splode(worldX, worldY, randInt(5, 10), randInt(0,63)));
  }
}