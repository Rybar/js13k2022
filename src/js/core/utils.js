export function randInt(min, max) {
  return Math.floor(Math.random() * (max + 1 - min) + min);
};

export function randFloat(min, max) {
  return Math.random() * (max - min) + min;
}

export function choice(values) {
  return values[randInt(0, values.length - 1)];
};
export function lerp(a, b, x){
   return a + (b -a ) * x;
}
export function circleCollison(circleA, circleB){
  let distX = circleA.x - circleB.x,
      distY = circleA.y - circleA.y,
      distance = Math.sqrt( (distX*distX) + (distY*distY) );
  return distance < circleA.field + circleB.field;
}

export function inView(o, padding=0){
  return o.x - view.x + padding > 0 &&
         o.y - view.y + padding > 0 &&
         o.x - view.x - padding < w &&
         o.y - view.y - padding < h
}

export function playSound(buffer, playbackRate = 1, pan = 0, volume = .5, loop = false) {

  var source = window.audioCtx.createBufferSource();
  var gainNode = window.audioCtx.createGain();
  var panNode = window.audioCtx.createStereoPanner();

  source.buffer = buffer;
  source.connect(panNode);
  panNode.connect(gainNode);
  gainNode.connect(audioMaster);

  source.playbackRate.value = playbackRate;
  source.loop = loop;
  gainNode.gain.value = volume;
  panNode.pan.value = pan;
  source.start();
  return {volume: gainNode, sound: source};

}

export const Key = {

  _pressed: {},
  _released: {},

  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  SPACE: 32,
  ZERO: 48,
  ONE: 49,
  TWO: 50,
  THREE: 51,
  FOUR: 52,
  a: 65,
  c: 67,
  w: 87,
  s: 83,
  d: 68,
  z: 90,
  x: 88,
  f: 70,
  p: 80,
  q: 81,
  r: 82,
  m: 77,
  h: 72,

  isDown(keyCode) {
      return this._pressed[keyCode];
  },

  justReleased(keyCode) {
      return this._released[keyCode];
  },

  onKeydown(event) {
      this._pressed[event.keyCode] = true;
  },

  onKeyup(event) {
      this._released[event.keyCode] = true;
      delete this._pressed[event.keyCode];

  },

  update() {
      this._released = {};
  }
};

export function clone(target) {
  if (typeof target === 'object') {
      let cloneTarget = {};
      for (const key in target) {
          cloneTarget[key] = clone(target[key]);
      }
      return cloneTarget;
  } else {
      return target;
  }
};

export const clamp = (num, min, max) => Math.min(Math.max(num, min), max)

export function scaleNumber (number, inMin, inMax, outMin, outMax) {
  return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

export function isPointInsideSphere(point, sphere) {
  // we are using multiplications because is faster than calling Math.pow
  const distance = Math.sqrt((point.x - sphere.x) * (point.x - sphere.x) +
                           (point.y - sphere.y) * (point.y - sphere.y) +
                           (point.z - sphere.z) * (point.z - sphere.z));
  return distance < sphere.radius;
}

function intersect(sphere, other) {
  // we are using multiplications because it's faster than calling Math.pow
  const distance = Math.sqrt((sphere.x - other.x) * (sphere.x - other.x) +
                           (sphere.y - other.y) * (sphere.y - other.y) +
                           (sphere.z - other.z) * (sphere.z - other.z));
  return distance < (sphere.radius + other.radius);
}


