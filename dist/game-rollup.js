(function () {

  function randInt(min, max) {
    return Math.floor(Math.random() * (max + 1 - min) + min);
  }
  function randFloat(min, max) {
    return Math.random() * (max - min) + min;
  }

  function choice(values) {
    return values[randInt(0, values.length - 1)];
  }
  function inView(o, padding=0){
    return o.x - view.x + padding > 0 &&
           o.y - view.y + padding > 0 &&
           o.x - view.x - padding < w &&
           o.y - view.y - padding < h
  }

  function playSound(buffer, playbackRate = 1, pan = 0, volume = .5, loop = false) {

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

  const Key = {

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

  const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

  //All 3D projection code is based on the following tutorial by my friend, Scott McGann:

  function matrix_rotate(vert, roll, pitch, yaw) {
  	
  	var {cos, sin} = Math;

  	var cosa = cos(roll);
  	var sina = sin(roll);
  	var cosb = cos(yaw);
  	var sinb = sin(yaw);
  	var cosc = cos(-pitch);
  	var sinc = sin(-pitch);

  	var xx = cosa*cosb;
  	var xy = cosa*sinb*sinc - sina*cosc;
  	var xz = cosa*sinb*cosc + sina*sinc;
  	var yx = sina*cosb;
  	var yy = sina*sinb*sinc + cosa*cosc;
  	var yz = sina*sinb*cosc - cosa*sinc;
  	var zx = -sinb;
  	var zy = cosb*sinc;
  	var zz = cosb*cosc;

  	var px = xx*vert.x + xy*vert.y + xz*vert.z;
  	var py = yx*vert.x + yy*vert.y + yz*vert.z;
  	var pz = zx*vert.x + zy*vert.y + zz*vert.z;
  	
  	return {x:px, y:py, z:pz};
  }

  /*
  You may notice that the function accepts 4 parameters:
  x, y, z, and vars. The vars parameter will be an object with at least 6 members:
  camX, camY, camZ, cx, cy, and scale.
  cx & cy are just the center of the screen. The value of scale determines how much
  "perspective" is seen in the output. a large scale will result in more isomorphic
  rendering, whereas a small scale will cause objects in the distance to shrink rapidly.

  The function returns one of two possible objects, depending on whether the vertex is
  in front of the camera or not. If in front, the function returns the projected positions
  x and y on a 2D plane in front of the camera, as well as d, the distance to the vertex,
  which is useful for say, adjusting line weights, as will be shown. If the vertex is behind
  the camera, the function simply returns d = -1. So to render a scene, we need only check
  that d != -1 for each vertex, then connect them.

  */
  function project3D(x, y, z, vars){

      var p,d;
      var {cos, sin, sqrt, atan2} = Math;
      
      // apply camera position
      x -= vars.camX;
      y -= vars.camY;
      z -= vars.camZ;
      
      // apply camera rotation
      p = atan2(x,z);
      d = sqrt(x*x+z*z);
      x = sin(p-vars.yaw)*d;
      z = cos(p-vars.yaw)*d;
      p = atan2(y,z);
      d = sqrt(y*y+z*z);
      y = sin(p-vars.pitch)*d;
      z = cos(p-vars.pitch)*d;
      
      // create invisible horizontal line in front of camera
      var x1 = -100,y1=1,x2=100,y2=1;
      
      // create invisible line from camera to to vertex
      var x3 = 0,y3 = 0,x4 = x,y4 = z;
      
      // find intersection between the two lines, if any
      var uc = (y4-y3)*(x2-x1)-(x4-x3)*(y2-y1);
      var ua = ((x4-x3)*(y1-y3)-(y4-y3)*(x1-x3))/uc;
      var ub = ((x2-x1)*(y1-y3)-(y2-y1)*(x1-x3))/uc;
      
      // if intersection occurs within both line segments...
      // return the 2D projected coordinates,
      // or else the vertex is outside of the field of vision
      if(ua>0&&ua<1&&ub>0&&ub<1){
        return {
          x:vars.cx+(x1+ua*(x2-x1))*vars.scale,
          y:vars.cy+y/z*vars.scale,
          d:sqrt(x*x+y*y+z*z)
        };
      }else {
        return {
          d:-1
        };
      }
  }

  function Vert(x,y,z){
      this.x = x;
      this.y = y;
      this.z = z;
  }
  const shapes = {
      CIR: 0,
      SQ: 1,
      PT: 2,
      TRI: 3,
      SPRITE: 4,
  };

  const DD = 2000;
  const SCALEFACTOR = 40;

  class Splat{
      constructor(x,y,z, opt={
          F: {
              C1: 22,
              C2: 0,
              pattern: r.DTH[0]
          },
          shape: shapes.point,
          size: 1,
          angle: 0,
          triangles: [],
      }){
          this.vert = new Vert(x,y,z);
          this.size = opt.size; 
          this.shape = opt.shape;
          this.F = opt.F;
          this.triangles = opt.triangles;
          this.angle = opt.angle;
      }
      draw(camera){
          let screenPosition = project3D(this.vert.x, this.vert.y, this.vert.z, camera);
          if(screenPosition.d != -1 && screenPosition.d < DD && inView(screenPosition, 100)){
              let {x,y} = screenPosition;
              let size = this.size;
              let shape = this.shape;
              let F = this.F; 
              let {C1, C2, pattern} = F;
              let scale =  SCALEFACTOR/screenPosition.d;
              let screenSize = size * scale;
              if(screenSize < 1 && shape !=shapes.TRI) return;

              r.P2 = C2;
              r.pat = pattern;
              switch(shape){
                  case shapes.CIR:
                      if(screenSize < 1){
                          r.pset(x,y,this .F.stroke? this .F.stroke : C1, screenPosition.d);
                      }else {
                          r.fillCircle(x,y,screenSize, C1, screenPosition.d);
                          r.pat = r.DTH[0];
                          if(this .F.stroke){
                              r.circle(x,y,screenSize, this .F.stroke, screenPosition.d);
                          }
                      }
                  break;

                  case shapes.SQ:
                      r.fillRect(
                          x-screenSize/2,y-screenSize/2,
                          screenSize, screenSize,
                          C1,
                          screenPosition.d
                          );
                      if(this .F.stroke){
                          r.rect(
                              x-screenSize/2, y-screenSize/2,
                              screenSize, screenSize,
                              this .F.stroke,
                              screenPosition.d
                              );
                      }
                  break;

                  case shapes.PT:
                      r.pset(x,y,C1, screenPosition.d);
                  break;

                  case shapes.TRI:
                      let screenTriangles = [];
                      for(let i = 0; i < this.triangles.length; i++){
                          let triangle = this.triangles[i];
                          let location = this.vert;
                          let screenTriangle = [];
                          for(let j = 0; j < triangle.points.length; j++){
                              let vert = triangle.points[j];
                              vert = matrix_rotate(vert, this.angle, 0, 0);
                              let screenVert = project3D((vert.x*size+location.x), (vert.y*size+location.y), location.z, camera);
                              if(screenVert.d != -1 && screenVert.d < DD){
                                  if(inView(screenVert, 100)){
                                      screenTriangle.push(screenVert);
                                  }
                              }
                          }
                          if(screenTriangle.length == 3){
                              screenTriangle.color = triangle.color;
                              screenTriangles.push(screenTriangle);
                          }
                      }
                      for(let i = 0; i < screenTriangles.length; i++){
                          let tri = screenTriangles[i];
                          r.fillTriangle(
                              tri[0],
                              tri[1],
                              tri[2],
                              tri.color,
                              screenPosition.d);
                      }
                  break;    
              }
              r.P2 = 64;
              r.pat = r.DTH[0];
          }
      }
  }

   class shape{
      constructor(x,y,z, splatArray){
          this.location = new Vert(x,y,z);
          this.splats = splatArray;
          this.splats.forEach(splat => {
              splat.vert.x += this.location.x;
              splat.vert.y += this.location.y;
              splat.vert.z += this.location.z;
          });
      }
      updatePosition(xdelta,ydelta, zdelta){
          this.location.x += xdelta;
          this.location.y += ydelta;
          this.location.z += zdelta;
          this.splats.forEach(splat => {
              splat.vert.x += xdelta; 
              splat.vert.y += ydelta;
              splat.vert.z += zdelta; 
          });
      }
      rotate(roll, pitch, yaw){
          this.splats.forEach(splat => {
              splat.vert.x -= this.location.x;
              splat.vert.y -= this.location.y;
              splat.vert.z -= this.location.z;
              splat.vert = matrix_rotate(splat.vert, roll, pitch, yaw);
              splat.vert.x += this.location.x;
              splat.vert.y += this.location.y;
              splat.vert.z += this.location.z;
          });
      }
  }

  class RetroBuffer {
    constructor(width, height, atlas, pages) {
      this.WIDTH = width;
      this.HEIGHT = height;
      this.PAGESIZE = this.WIDTH * this.HEIGHT;
      this.PAGES = pages;
      this.atlas = atlas;

      this.SCREEN = 0;
      this.PAGE_1 = this.PAGESIZE;
      this.PAGE_2 = this.PAGESIZE * 2;
      this.PAGE_3 = this.PAGESIZE * 3;
      this.PAGE_4 = this.PAGESIZE * 4;

      //relative drawing position and pencolor, for drawing functions that require it.
      this.cursorX = 0;
      this.cursorY = 0;
      this.P1 = 22;
      this.P2 = 64;
      this.stencil = false;
      this.stencilSource = this.PAGE_2;
      this.stencilOffset = 0;

      this.colors = this.atlas.slice(0, 64);

      //default palette index
      this.palDefault = [
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
        21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38,
        39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56,
        57, 58, 59, 60, 61, 62, 63,
      ];

      this.c = document.createElement("canvas");
      this.c.width = this.WIDTH;
      this.c.height = this.HEIGHT;
      this.ctx = this.c.getContext("2d");
      this.renderTarget = 0x00000;
      this.renderSource = this.PAGESIZE; //buffer is ahead one screen's worth of pixels

      this.fontString = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890_!@#.'\"?/<()";

      this.fontBitmap =
        "11111100011111110001100011111010001111101000111110111111000010000100000111111100100101000110001111101111110000111001000011111111111000" +
        "0111001000010000111111000010111100011111110001100011111110001100011111100100001000010011111111110001000010100101111010001100101110010010100011000" +
        "0100001000010000111111000111011101011000110001100011100110101100111000101110100011000110001011101111010001100101110010000011101000110001100100111" +
        "1111101000111110100011000101111100000111000001111101111100100001000010000100100011000110001100010111010001100011000101010001001000110001101011010" +
        "1011101000101010001000101010001100010101000100001000010011111000100010001000111110010001100001000010001110011101000100010001001111111110000010011" +
        "0000011111010010100101111100010000101111110000111100000111110011111000011110100010111011111000010001000100001000111010001011101000101110011101000" +
        "1011110000101110011101000110001100010111000000000000000000000111110010000100001000000000100111111000110111101011011101010111110101011111010100000" +
        "000000000000000000100001100001000100000000000011011010011001000000000000111010001001100000000100000010001000100010001000000010001000100000100000100001000100001000010000010";

      this.pal = [
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
        21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38,
        39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56,
        57, 58, 59, 60, 61, 62, 63, 64,
      ];

      this.DTH = [
        0b1111111111111111, 0b1111111111110111, 0b1111110111110111,
        0b1111110111110101, 0b1111010111110101, 0b1111010110110101,
        0b1110010110110101, 0b1110010110100101, 0b1010010110100101,
        0b1010010110100001, 0b1010010010100001, 0b1010010010100000,
        0b1010000010100000, 0b1010000000100000, 0b1000000000100000,
        0b1000000000000000, 0b0000000000000000, 0b1111100110011111,
        0b0000011001100000, 0b1111100010001000,
      ];

      this.pat = 0b1111111111111111;

      this.ctx.imageSmoothingEnabled = false;

      this.imageData = this.ctx.getImageData(0, 0, this.WIDTH, this.HEIGHT),
        this.buf = new ArrayBuffer(this.imageData.data.length),
        this.buf8 = new Uint8Array(this.buf),
        this.data = new Uint32Array(this.buf),
        this.ram = new Uint8Array(this.WIDTH * this.HEIGHT * this.PAGES);
        this.zbuf = new Float64Array(this.WIDTH * this.HEIGHT);

      //Brightness LUT
      // this.brightness = [];
      // for (let i = 0; i < 6; i++) {
      //   for (let j = 0; j < 64; j++) {
      //     this.brightness[i * 64 + j] = this.colors.indexOf(
      //       this.atlas[i * 64 + j]
      //     );
      //   }
        //ram[address + i] = colors.indexOf(data[i]);
      //}
    }

    //--------------graphics functions----------------

    setPen(color, C2, DTH = 0) {
      this.P1 = color;
      this.P2 = C2;
      this.pat = DTH;
    }

    clr(color, page) {
      this.ram.fill(color, page, page + this.PAGESIZE);
      this.zbuf.fill(9999999999, 0, this.WIDTH * this.HEIGHT);
    }

    pset(x, y, color, z = 0) {
      if ((x < 0) | (x > this.WIDTH - 1)) return;
      if ((y < 0) | (y > this.HEIGHT - 1)) return;
      if(this.zbuf[y * this.WIDTH + x] < z) return;
      x = x | 0;
      y = y | 0;
      // color = this.stencil
      //   ? this.pget(x, y, this.stencilSource) + this.stencilOffset
      //   : (color | 0) % 64;
        
      let px = (y % 4) * 4 + (x % 4);
      let mask = this.pat & Math.pow(2, px);
      let pcolor = mask ? color : this.P2;
      if (pcolor == 64) return;
      this.ram[this.renderTarget + y * this.WIDTH + x] = pcolor;
      this.zbuf[y * this.WIDTH + x] = z;
    }

    pget(x, y, page = 0) {
      x = x | 0;
      y = y | 0;
      return this.ram[page + x + y * this.WIDTH];
    }

    //span draws a horizontal line
    span(x, y, length, color, z) {
      x = x | 0;
      y = y | 0;
      color = color | 0;
      for (let i = 0; i < length; i++) {
        this.pset(x + i, y, color, z);
      }
    }

    //span2 takes two points on a horizontal line and draws a line between them
    span2(x1, y1, x2, y2, color, z) {
      x1 = x1 | 0;
      y1 = y1 | 0;
      x2 = x2 | 0;
      y2 = y2 | 0;
      color = color | 0;
      let length = Math.abs(x2 - x1) + 1;
      let x = x1 < x2 ? x1 : x2;
      let y = y1 < y2 ? y1 : y2;
      for (let i = 0; i < length; i++) {
        this.pset(x + i, y, color, z);
      }
    }




    line(x1, y1, x2, y2, color, z=0) {
      (x1 = x1 | 0), (x2 = x2 | 0), (y1 = y1 | 0), (y2 = y2 | 0);

      var dy = y2 - y1;
      var dx = x2 - x1;
      var stepx, stepy;

      if (dy < 0) {
        dy = -dy;
        stepy = -1;
      } else {
        stepy = 1;
      }
      if (dx < 0) {
        dx = -dx;
        stepx = -1;
      } else {
        stepx = 1;
      }
      dy <<= 1; // dy is now 2*dy
      dx <<= 1; // dx is now 2*dx

      this.pset(x1, y1, color, z);
      if (dx > dy) {
        var fraction = dy - (dx >> 1); // same as 2*dy - dx
        while (x1 != x2) {
          if (fraction >= 0) {
            y1 += stepy;
            fraction -= dx; // same as fraction -= 2*dx
          }
          x1 += stepx;
          fraction += dy; // same as fraction -= 2*dy
          this.pset(x1, y1, color, z);
        }
      } else {
        fraction = dx - (dy >> 1);
        while (y1 != y2) {
          if (fraction >= 0) {
            x1 += stepx;
            fraction -= dy;
          }
          y1 += stepy;
          fraction += dx;
          this.pset(x1, y1, color, z);
        }
      }
    }

    line3d(x1, y1, z1, x2, y2, z2, color) {
      (x1 = x1 | 0), (x2 = x2 | 0), (y1 = y1 | 0), (y2 = y2 | 0);

      var dy = y2 - y1;
      var dx = x2 - x1;
      var dz = z2 - z1;
      var stepx, stepy, stepz;
      var points = [];
      if (dy < 0) {
        dy = -dy;
        stepy = -1;
      } else {
        stepy = 1;
      }
      if (dx < 0) {
        dx = -dx;
        stepx = -1;
      } else {
        stepx = 1;
      }
      dy <<= 1; // dy is now 2*dy
      dx <<= 1; // dx is now 2*dx

      this.pset(x1, y1, color, z1);
      if (dx > dy) {
        var fraction = dy - (dx >> 1); // same as 2*dy - dx
        while (x1 != x2) {
          if (fraction >= 0) {
            y1 += stepy;
            fraction -= dx; // same as fraction -= 2*dx
          }
          x1 += stepx;
          fraction += dy; // same as fraction -= 2*dy
          points.push({x: x1, y: y1});
        }
      } else {
        fraction = dx - (dy >> 1);
        while (y1 != y2) {
          if (fraction >= 0) {
            x1 += stepx;
            fraction -= dy;
          }
          y1 += stepy;
          fraction += dx;
          points.push({x: x1, y: y1});
        }
      }
      stepz = dz / points.length;
      for (let i = 0; i < points.length; i++) {
        this.pset(points[i].x, points[i].y, color, stepz * i + z1);
      }
    }

    tline(x1, y1, x2, y2, offsetX = 0, offsetY = 0, colorOffset = 0, z=0) {
      (x1 = x1 | 0), (x2 = x2 | 0), (y1 = y1 | 0), (y2 = y2 | 0);

      var dy = y2 - y1;
      var dx = x2 - x1;
      var stepx, stepy;

      if (dy < 0) {
        dy = -dy;
        stepy = -1;
      } else {
        stepy = 1;
      }
      if (dx < 0) {
        dx = -dx;
        stepx = -1;
      } else {
        stepx = 1;
      }
      dy <<= 1; // dy is now 2*dy
      dx <<= 1; // dx is now 2*dx

      var x = x1,
        y = y1;
      var fraction = dy - (dx >> 1); // same as 2*dy - dx
      while (x != x2) {
        if (fraction >= 0) {
          y += stepy;
          fraction -= dx; // same as fraction -= 2*dx
        }
        x += stepx;
        fraction += dy; // same as fraction -= 2*dy
        this.pset(
          x,
          y,
          this.pget(x - offsetX, y - offsetY, this.renderSource) + colorOffset
        );
      }
    }

    circle(xm, ym, r, color, z=0) {
      xm = xm | 0;
      ym = ym | 0;
      r = r | 0;
      color = color | 0;
      for(let y=-r; y<=r; y++){
        for(let x=-r; x<=r; x++){
          if(x*x+y*y>=r*r-r && x*x+y*y<=r*r+r){
            this.pset(xm+x, ym+y, color, z);
          }
        }
      }
    }

    fillCircle(xm, ym, r, color, z=0) {
      xm = xm | 0;
      ym = ym | 0;
      r = r | 0;
      color = color | 0;
      for(let y=-r; y<=r; y++){
        for(let x=-r; x<=r; x++){
          if(x*x+y*y<=r*r){
            this.pset(xm+x, ym+y, color, z);
          }
        }
      }
        
    }

    tfillCircle(xm, ym, r, colorOffset = 0, z=0) {
      xm = xm | 0;
      ym = ym | 0;
      r = r | 0;
      offX = xm - mw; //+ r;
      offY = ym - mh; //+ r;
      if (r < 0) return;
      xm = xm | 0;
      (ym = ym | 0), (r = r | 0);
      var x = -r,
        y = 0,
        err = 2 - 2 * r;
      /* II. Quadrant */
      do {
        this.tline(xm - x, ym - y, xm + x, ym - y, offX, offY, colorOffset, z);
        this.tline(xm - x, ym + y, xm + x, ym + y, offX, offY, colorOffset, z);
        r = err;
        if (r <= y) err += ++y * 2 + 1;
        if (r > x || err > y) err += ++x * 2 + 1;
      } while (x < 0);
    }

    rect(x, y, w, h, color, z=0) {
      let x1 = x | 0,
        y1 = y | 0,
        x2 = (x + w) | 0,
        y2 = (y + h) | 0;

      this.line(x1, y1, x2, y1, color, z);
      this.line(x2, y1, x2, y2, color, z);
      this.line(x1, y2, x2, y2, color, z);
      this.line(x1, y1, x1, y2, color, z);
    }

    fillRect(x, y, w, h, color, z=0) {
      let x1 = x | 0,
        y1 = y | 0,
        boxWidth = w | 0,
        y2 = ((y + h) | 0) - 1;
      color = color;

      var i = Math.abs(y2 - y1);
      this.span(x1, y1, boxWidth, color, z);

      if (i > 0) {
        while (--i) {
          this.span(x1, y1 + i, boxWidth, color, z);
        }
      }
      this.span(x1, y2, boxWidth, color, z);
    }

    sspr(
      sx = 0,
      sy = 0,
      sw = 16,
      sh = 16,
      x = 0,
      y = 0,
      dw = 32,
      dh = 32,
      flipx = false,
      flipy = false,
      z=0
    ) {
      var xratio = sw / dw;
      var yratio = sh / dh;
      this.pat = this.DTH[0]; //reset pattern
      for (var i = 0; i < dh; i++) {
        for (var j = 0; j < dw; j++) {
          px = (j * xratio) | 0;
          py = (i * yratio) | 0;
          sy = flipy ? sh - py - i : sy;
          sx = flipx ? sw - px - j : sx;
          source = this.pget(sx + px, sy + py, this.renderSource);
          if (source > 0) {
            this.pset(x + j, y + i, source);
          }
        }
      }
    }

    outline(renderSource, renderTarget, color, C2, color3, color4) {
      for (let i = 0; i <= this.WIDTH; i++) {
        for (let j = 0; j <= this.HEIGHT; j++) {
          let left = i - 1 + j * this.WIDTH;
          let right = i + 1 + j * this.WIDTH;
          let bottom = i + (j + 1) * this.WIDTH;
          let top = i + (j - 1) * this.WIDTH;
          let current = i + j * this.WIDTH;

          if (this.ram[this.renderSource + current]) {
            if (this.ram[this.renderSource + left] == 64) {
              this.ram[this.renderTarget + left] = color;
            }
            if (this.ram[this.renderSource + right] == 64) {
              this.ram[this.renderTarget + right] = color3;
            }
            if (this.ram[this.renderSource + top] == 64) {
              this.ram[this.renderTarget + top] = C2;
            }
            if (this.ram[this.renderSource + bottom] == 64) {
              this.ram[this.renderTarget + bottom] = color4;
            }
          }
        }
      }
    }

    triangle(p1, p2, p3, color, z=0) {
      this.line(p1.x, p1.y, p2.x, p2.y, color);
      this.line(p2.x, p2.y, p3.x, p3.y, color);
      this.line(p3.x, p3.y, p1.x, p1.y, color);
    }

    strokePolygon(x, y, r, sides, rotation = 0, color = "white") {
      sides = sides || Math.floor(120 * (r * 2)) + 16;

      for (let i = 0; i < sides; i++) {
        let j = (i / sides) * 6.283185; //tau radians
        let j2 = ((i + 1) / sides) * 6.283185; //tau radians

        var sx = x + Math.cos(j + rotation) * r;
        var sy = y + Math.sin(j + rotation) * r;

        let px = x + Math.cos(j2 + rotation) * r;
        let py = y + Math.sin(j2 + rotation) * r;

        this.line(sx, sy, px, py, color);
      }
    }

    //from https://www-users.mat.uni.torun.pl//~wrona/3d_tutor/tri_fillers.html
    fillTriangle(p1, p2, p3, color, z) {
      //sort vertices by y, top first

      let P = [
        Object.assign({}, p1),
        Object.assign({}, p2),
        Object.assign({}, p3),
      ].sort((a, b) => a.y - b.y);
      let A = P[0],
        B = P[1],
        C = P[2],
        dx1 = 0,
        dx2 = 0,
        dx3 = 0,
        S = {},
        E = {};

      if (B.y - A.y > 0) dx1 = (B.x - A.x) / (B.y - A.y);
      if (C.y - A.y > 0) dx2 = (C.x - A.x) / (C.y - A.y);
      if (C.y - B.y > 0) dx3 = (C.x - B.x) / (C.y - B.y);

      Object.assign(S, A);
      Object.assign(E, A);
      if (dx1 > dx2) {
        for (; S.y <= B.y; S.y++, E.y++, S.x += dx2, E.x += dx1) {
          this.span2(S.x, S.y, E.x, S.y, color, z);
        }
        E = B;
        for (; S.y <= C.y; S.y++, E.y++, S.x += dx2, E.x += dx3)
          this.span2(S.x, S.y, E.x, S.y, color, z);
      } else {
        for (; S.y <= B.y; S.y++, E.y++, S.x += dx1, E.x += dx2) {
          this.span2(S.x, S.y, E.x, S.y, color, z);
        }
        S = B;
        for (; S.y <= C.y; S.y++, E.y++, S.x += dx3, E.x += dx2) {
          this.span2(S.x, S.y, E.x, S.y, color, z);
        }
      }
    }

    imageToRam(image, address) {
      //var image = E.smallcanvas.toDataURL("image/png");
      let tempCanvas = document.createElement("canvas");
      tempCanvas.width = WIDTH;
      tempCanvas.height = HEIGHT;
      let context = tempCanvas.getContext("2d");
      //draw image to canvas
      context.drawImage(image, 0, 0);

      //get image data
      var imageData = context.getImageData(0, 0, WIDTH, HEIGHT);

      //set up 32bit view of buffer
      let data = new Uint32Array(imageData.data.buffer);

      //compare buffer to palette (loop)
      let i = 0; len = data.length;
      while(i < len) {
        ram[address + i] = colors.indexOf(data[i]);
        i++;
      }
    }

    render() {
      let i = 0, len = this.PAGESIZE;
      while (i < len) {
        /*
        data is 32bit view of final screen buffer
        for each pixel on screen, we look up it's color and assign it
        */
        this.data[i] = this.colors[this.pal[this.ram[i]]];
        i++;
      }

      this.imageData.data.set(this.buf8);
      this.c.width = this.c.width;
      this.ctx.putImageData(this.imageData, 0, 0);
    }

    //o is an array of options with the following structure:
    /* [textstring, x, y, hspacing, vspacing, halign, valign, scale, color, offset, delay, frequency]
  0: text
  1: x
  2: y
  3: hspacing
  4: vspacing
  5: halign
  6: valign
  7: scale
  8: color
  //options 9-11 are for animating the text per-character. just sin motion
  9: per character offset
  10: delay, higher is slower
  11: frequency
  */
    textLine(o) {
      let textLength = o[0].length,
        size = 5;

      for (var i = 0; i < textLength; i++) {
        let letter = this.getCharacter(o[0].charAt(i));

        for (var y = 0; y < size; y++) {
          for (var x = 0; x < size; x++) {
            if (letter[y * size + x] == 1) {
              if (o[4] == 1) {
                this.pset(
                  o[1] + x * o[4] + (size * o[4] + o[3]) * i,
                  (o[2] + y * o[4]) | 0,
                  o[5]
                );
              } else {
                let cx = o[1] + x * o[4] + (size * o[4] + o[3]) * i;
                let cy = (o[2] + y * o[4]) | 0;
                this.fillRect(cx, cy, o[4], o[4], o[5]);
              }
            } //end draw routine
          } //end x loop
        } //end y loop
      } //end text loop
    }

    text(o) {
      let size = 5,
        letterSize = size * o[7],
        lines = o[0].split("\n"),
        linesCopy = lines.slice(0),
        lineCount = lines.length,
        longestLine = linesCopy.sort(function (a, b) {
          return b.length - a.length;
        })[0],
        textWidth =
          longestLine.length * letterSize + (longestLine.length - 1) * o[3],
        textHeight = lineCount * letterSize + (lineCount - 1) * o[4];

      if (!o[5]) o[5] = "left";
      if (!o[6]) o[6] = "bottom";

      var sx = o[1],
        sy = o[2],
        ex = o[1] + textWidth,
        ey = o[2] + textHeight;

      if (o[5] == "center") {
        sx = o[1] - textWidth / 2;
        ex = o[1] + textWidth / 2;
      } else if (o[5] == "right") {
        sx = o[1] - textWidth;
        ex = o[1];
      }

      if (o[6] == "center") {
        sy = o[2] - textHeight / 2;
        ey = o[2] + textHeight / 2;
      } else if (o[6] == "bottom") {
        sy = o[2] - textHeight;
        ey = o[2];
      }

      var cx = sx + textWidth / 2,
        cy = sy + textHeight / 2;

      for (var i = 0; i < lineCount; i++) {
        let line = lines[i],
          lineWidth = line.length * letterSize + (line.length - 1) * o[3],
          x = o[1],
          y = o[2] + (letterSize + o[4]) * i;

        if (o[5] == "center") {
          x = o[1] - lineWidth / 2;
        } else if (o[5] == "right") {
          x = o[1] - lineWidth;
        }

        if (o[6] == "center") {
          y = y - textHeight / 2;
        } else if (o[6] == "bottom") {
          y = y - textHeight;
        }

        this.textLine([line, x, y, o[3], o[7], o[8]]);
      }

      return {
        sx: sx,
        sy: sy,
        cx: cx,
        cy: cy,
        ex: ex,
        ey: ey,
        width: textWidth,
        height: textHeight,
      };
    }

    getCharacter(char) {
      let index = this.fontString.indexOf(char);
      return this.fontBitmap.substring(index * 25, index * 25 + 25).split("");
    }
  }

  /* -*- mode: javascript; tab-width: 4; indent-tabs-mode: nil; -*-
  *
  * Copyright (c) 2011-2013 Marcus Geelnard
  *
  * This software is provided 'as-is', without any express or implied
  * warranty. In no event will the authors be held liable for any damages
  * arising from the use of this software.
  *
  * Permission is granted to anyone to use this software for any purpose,
  * including commercial applications, and to alter it and redistribute it
  * freely, subject to the following restrictions:
  *
  * 1. The origin of this software must not be misrepresented; you must not
  *    claim that you wrote the original software. If you use this software
  *    in a product, an acknowledgment in the product documentation would be
  *    appreciated but is not required.
  *
  * 2. Altered source versions must be plainly marked as such, and must not be
  *    misrepresented as being the original software.
  *
  * 3. This notice may not be removed or altered from any source
  *    distribution.
  *
  */

  //"use strict";

  // Some general notes and recommendations:
  //  * This code uses modern ECMAScript features, such as ** instead of
  //    Math.pow(). You may have to modify the code to make it work on older
  //    browsers.
  //  * If you're not using all the functionality (e.g. not all oscillator types,
  //    or certain effects), you can reduce the size of the player routine even
  //    further by deleting the code.


  var MusicPlayer = function() {

      //--------------------------------------------------------------------------
      // Private methods
      //--------------------------------------------------------------------------

      // Oscillators
      var osc_sin = function (value) {
          return Math.sin(value * 6.283184);
      };

      var osc_saw = function (value) {
          return 2 * (value % 1) - 1;
      };

      var osc_square = function (value) {
          return (value % 1) < 0.5 ? 1 : -1;
      };

      var osc_tri = function (value) {
          var v2 = (value % 1) * 4;
          if(v2 < 2) return v2 - 1;
          return 3 - v2;
      };

      var getnotefreq = function (n) {
          // 174.61.. / 44100 = 0.003959503758 (F3)
          return 0.003959503758 * (2 ** ((n - 128) / 12));
      };

      var createNote = function (instr, n, rowLen) {
          var osc1 = mOscillators[instr.i[0]],
              o1vol = instr.i[1],
              o1xenv = instr.i[3]/32,
              osc2 = mOscillators[instr.i[4]],
              o2vol = instr.i[5],
              o2xenv = instr.i[8]/32,
              noiseVol = instr.i[9],
              attack = instr.i[10] * instr.i[10] * 4,
              sustain = instr.i[11] * instr.i[11] * 4,
              release = instr.i[12] * instr.i[12] * 4,
              releaseInv = 1 / release,
              expDecay = -instr.i[13]/16,
              arp = instr.i[14],
              arpInterval = rowLen * (2 **(2 - instr.i[15]));

          var noteBuf = new Int32Array(attack + sustain + release);

          // Re-trig oscillators
          var c1 = 0, c2 = 0;

          // Local variables.
          var j, j2, e, rsample, o1t, o2t;

          // Generate one note (attack + sustain + release)
          for (j = 0, j2 = 0; j < attack + sustain + release; j++, j2++) {
              if (j2 >= 0) {
                  // Switch arpeggio note.
                  arp = (arp >> 8) | ((arp & 255) << 4);
                  j2 -= arpInterval;

                  // Calculate note frequencies for the oscillators
                  o1t = getnotefreq(n + (arp & 15) + instr.i[2] - 128);
                  o2t = getnotefreq(n + (arp & 15) + instr.i[6] - 128) * (1 + 0.0008 * instr.i[7]);
              }

              // Envelope
              e = 1;
              if (j < attack) {
                  e = j / attack;
              } else if (j >= attack + sustain) {
                  e = (j - attack - sustain) * releaseInv;
                  e = (1 - e) * (3 ** (expDecay * e));
              }

              // Oscillator 1
              c1 += o1t * e ** o1xenv;
              rsample = osc1(c1) * o1vol;

              // Oscillator 2
              c2 += o2t * e ** o2xenv;
              rsample += osc2(c2) * o2vol;

              // Noise oscillator
              if (noiseVol) {
                  rsample += (2 * Math.random() - 1) * noiseVol;
              }

              // Add to (mono) channel buffer
              noteBuf[j] = (80 * rsample * e) | 0;
          }

          return noteBuf;
      };


      //--------------------------------------------------------------------------
      // Private members
      //--------------------------------------------------------------------------

      // Array of oscillator functions
      var mOscillators = [
          osc_sin,
          osc_square,
          osc_saw,
          osc_tri
      ];

      // Private variables set up by init()
      var mSong, mLastRow, mCurrentCol, mNumWords, mMixBuf;


      //--------------------------------------------------------------------------
      // Initialization
      //--------------------------------------------------------------------------

      this.init = function (song) {
          // Define the song
          mSong = song;

          // Init iteration state variables
          mLastRow = song.endPattern;
          mCurrentCol = 0;

          // Prepare song info
          mNumWords =  song.rowLen * song.patternLen * (mLastRow + 1) * 2;

          // Create work buffer (initially cleared)
          mMixBuf = new Int32Array(mNumWords);
      };


      //--------------------------------------------------------------------------
      // Public methods
      //--------------------------------------------------------------------------

      // Generate audio data for a single track
      this.generate = function () {
          // Local variables
          var i, j, p, row, col, n, cp,
              k, t, rsample, rowStartSample, f;

          // Put performance critical items in local variables
          var chnBuf = new Int32Array(mNumWords),
              instr = mSong.songData[mCurrentCol],
              rowLen = mSong.rowLen,
              patternLen = mSong.patternLen;

          // Clear effect state
          var low = 0, band = 0, high;
          var lsample, filterActive = false;

          // Clear note cache.
          var noteCache = [];

           // Patterns
           for (p = 0; p <= mLastRow; ++p) {
              cp = instr.p[p];

              // Pattern rows
              for (row = 0; row < patternLen; ++row) {
                  // Execute effect command.
                  var cmdNo = cp ? instr.c[cp - 1].f[row] : 0;
                  if (cmdNo) {
                      instr.i[cmdNo - 1] = instr.c[cp - 1].f[row + patternLen] || 0;

                      // Clear the note cache since the instrument has changed.
                      if (cmdNo < 17) {
                          noteCache = [];
                      }
                  }

                  // Put performance critical instrument properties in local variables
                  var oscLFO = mOscillators[instr.i[16]],
                      lfoAmt = instr.i[17] / 512,
                      lfoFreq = (2 ** (instr.i[18] - 9)) / rowLen,
                      fxLFO = instr.i[19],
                      fxFilter = instr.i[20],
                      fxFreq = instr.i[21] * 43.23529 * 3.141592 / 44100,
                      q = 1 - instr.i[22] / 255,
                      dist = instr.i[23] * 1e-5,
                      drive = instr.i[24] / 32,
                      panAmt = instr.i[25] / 512,
                      panFreq = 6.283184 * (2 ** (instr.i[26] - 9)) / rowLen,
                      dlyAmt = instr.i[27] / 255,
                      dly = instr.i[28] * rowLen & ~1;  // Must be an even number

                  // Calculate start sample number for this row in the pattern
                  rowStartSample = (p * patternLen + row) * rowLen;

                  // Generate notes for this pattern row
                  for (col = 0; col < 4; ++col) {
                      n = cp ? instr.c[cp - 1].n[row + col * patternLen] : 0;
                      if (n) {
                          if (!noteCache[n]) {
                              noteCache[n] = createNote(instr, n, rowLen);
                          }

                          // Copy note from the note cache
                          var noteBuf = noteCache[n];
                          for (j = 0, i = rowStartSample * 2; j < noteBuf.length; j++, i += 2) {
                            chnBuf[i] += noteBuf[j];
                          }
                      }
                  }

                  // Perform effects for this pattern row
                  for (j = 0; j < rowLen; j++) {
                      // Dry mono-sample
                      k = (rowStartSample + j) * 2;
                      rsample = chnBuf[k];

                      // We only do effects if we have some sound input
                      if (rsample || filterActive) {
                          // State variable filter
                          f = fxFreq;
                          if (fxLFO) {
                              f *= oscLFO(lfoFreq * k) * lfoAmt + 0.5;
                          }
                          f = 1.5 * Math.sin(f);
                          low += f * band;
                          high = q * (rsample - band) - low;
                          band += f * high;
                          rsample = fxFilter == 3 ? band : fxFilter == 1 ? high : low;

                          // Distortion
                          if (dist) {
                              rsample *= dist;
                              rsample = rsample < 1 ? rsample > -1 ? osc_sin(rsample*.25) : -1 : 1;
                              rsample /= dist;
                          }

                          // Drive
                          rsample *= drive;

                          // Is the filter active (i.e. still audiable)?
                          filterActive = rsample * rsample > 1e-5;

                          // Panning
                          t = Math.sin(panFreq * k) * panAmt + 0.5;
                          lsample = rsample * (1 - t);
                          rsample *= t;
                      } else {
                          lsample = 0;
                      }

                      // Delay is always done, since it does not need sound input
                      if (k >= dly) {
                          // Left channel = left + right[-p] * t
                          lsample += chnBuf[k-dly+1] * dlyAmt;

                          // Right channel = right + left[-p] * t
                          rsample += chnBuf[k-dly] * dlyAmt;
                      }

                      // Store in stereo channel buffer (needed for the delay effect)
                      chnBuf[k] = lsample | 0;
                      chnBuf[k+1] = rsample | 0;

                      // ...and add to stereo mix buffer
                      mMixBuf[k] += lsample | 0;
                      mMixBuf[k+1] += rsample | 0;
                  }
              }
          }

          // Next iteration. Return progress (1.0 == done!).
          mCurrentCol++;
          return mCurrentCol / mSong.numChannels;
      };

      // Create a AudioBuffer from the generated audio data
      this.createAudioBuffer = function(context) {
          var buffer = context.createBuffer(2, mNumWords / 2, 44100);
          for (var i = 0; i < 2; i ++) {
              var data = buffer.getChannelData(i);
              for (var j = i; j < mNumWords; j += 2) {
                  data[j >> 1] = mMixBuf[j] / 65536;
              }
          }
          return buffer;
      };
      
      // Create a WAVE formatted Uint8Array from the generated audio data
      this.createWave = function() {
          // Create WAVE header
          var headerLen = 44;
          var l1 = headerLen + mNumWords * 2 - 8;
          var l2 = l1 - 36;
          var wave = new Uint8Array(headerLen + mNumWords * 2);
          wave.set(
              [82,73,70,70,
               l1 & 255,(l1 >> 8) & 255,(l1 >> 16) & 255,(l1 >> 24) & 255,
               87,65,86,69,102,109,116,32,16,0,0,0,1,0,2,0,
               68,172,0,0,16,177,2,0,4,0,16,0,100,97,116,97,
               l2 & 255,(l2 >> 8) & 255,(l2 >> 16) & 255,(l2 >> 24) & 255]
          );

          // Append actual wave data
          for (var i = 0, idx = headerLen; i < mNumWords; ++i) {
              // Note: We clamp here
              var y = mMixBuf[i];
              y = y < -32767 ? -32767 : (y > 32767 ? 32767 : y);
              wave[idx++] = y & 255;
              wave[idx++] = (y >> 8) & 255;
          }

          // Return the WAVE formatted typed array
          return wave;
      };

      // Get n samples of wave data at time t [s]. Wave data in range [-2,2].
      this.getData = function(t, n) {
          var i = 2 * Math.floor(t * 44100);
          var d = new Array(n);
          for (var j = 0; j < 2*n; j += 1) {
              var k = i + j;
              d[j] = t > 0 && k < mMixBuf.length ? mMixBuf[k] / 32768 : 0;
          }
          return d;
      };
  };

  class BloodSplat{
      constructor(x,y,life){
      this.x = x;
      this.y = y;
      this.lifeMax = life;
      this.life = life;
      this.alive = true;
      this.color = 3;
  }
  draw(){
      
      r.pat = r.DTH[15- Math.floor( (this.life/this.lifeMax) * 15)];
      for(let i = Math.floor(this.life/10); i > 0; i--){
          r.fillCircle(this.x, this.y, this.lifeMax-this.life-i, this.color,0);
      }r.fillCircle(this.x, this.y, this.lifeMax-this.life, this.color, 0);
      r.pat = r.DTH[0];
  }
  update(){
      if(!this.alive){
          return
      }
      if(this.life > 0){
          this.life-=1;
      }
      else {
          this.alive = false;
      }
  }
  }

  class Player {
      constructor(x, y, z) {
          this.pos = { x: x, y: y, z: z };
          this.prev = { x: x, y: y, z: z };
          this.pd = { x: 0, y: 0, z: 0 };
          this.acc = {x: 0, y: 0};
          this.Macc = {x: 0.1, y: 0.1};
          this.macc = {x: -0.1, y: -0.1};
          this.v = {x: 0, y: 0};
          this.MV = {x: 2, y: 2};
          this.mV = {x: -2, y: -2};
          this.drag = {x: 0.9, y: 0.9};
          this.accD = {x: 0.5, y: 0.5};
          this.alive = true;
          this.pA = 0;
          this.a = Math.atan2(this.pos.y, this.pos.x);
          this.aD = 0;
          this.sprite = this.initializeShape();
          
          //temp rotation to face front while I build character
          //this.sprite.rotate(0,-Math.PI/2,0)
      }
      draw(){
          if(this.alive){
              this.sprite.splats.forEach(splat => splat.draw(camera));
          }
         
      }

      update(){
          if(this.alive){
              this.prev.x = this.pos.x;
              this.prev.y = this.pos.y;
              this.pA = this.a;
              this.v.x += this.acc.x; 
              this.v.y += this.acc.y;
              this.v.x *= this.drag.x;
              this.v.y *= this.drag.y;
              this.v.x =  clamp(this.v.x, this.mV.x, this.MV.x);
              this.v.y =  clamp(this.v.y, this.mV.y, this.MV.y);
              this.acc.x *= this.accD.x;
              this.acc.y *= this.accD.y;
              this.acc.x = clamp(this.acc.x, this.macc.x, this.Macc.x);
              this.acc.y = clamp(this.acc.y, this.macc.y, this.Macc.y);
      
      
              this.pos.x += this.v.x;
              this.pos.y += this.v.y;
              this.a = Math.atan2(this.pos.y, this.pos.x);
      
              this.pd.x = this.pos.x - this.prev.x;
              this.pd.y = this.pos.y - this.prev.y;
              this.pd.z = this.pos.z - this.prev.z;
              this.aD = this.a - this.pA;
              
              switch(gamestate){
                  case WELL:
                      //console.log('in well gamestate')
                      if(this.collideWithCylinderWall(30)){
                          r.fillRect(0,0,w, 10, 4);
                          this.death();
                      }               
                  break;
              }
             
          }else {
              this.pd = { x: 0, y: 0, z: 0 };
              this.aD = 0;
          }


          this.sprite.updatePosition(this.pd.x, this.pd.y, this.pd.z);
          this.sprite.rotate(this.aD, 0, 0);
      }

      move(x,y){
          this.acc.x += x;
          this.acc.y += y;

          
      }

      initializeShape(){
          let splats = [];
          //head
          splats.push(
              new Splat(0,0,5, {
              shape: shapes.CIR,
              F: { C1: 21, C2: 0, stroke: 1, pattern: r.DTH[0] },
              size: 14 
              })
          );
          //body
          for(let i = 0; i < 12; i++){
              splats.push(
                  new Splat(0,0,4-i, {
                      shape: shapes.CIR,
                      F: { C1: 21, C2: 0, stroke: 1, pattern: r.DTH[0] },
                      size: 10
                      })
              );
          }
          //armspan/shoulders?
          for(let i = 0; i < 9; i++){
              splats.push(
                  new Splat(-4+i,0,2, {
                      shape: shapes.CIR,
                      F: { C1: 21, C2: 0, stroke: 1, pattern: r.DTH[0] },
                      size: 8
                      })
              );
          }
          //hips
          for(let i = 0; i < 7; i++){
              splats.push(
                  new Splat(-2+i,0,-1, {
                      shape: shapes.CIR,
                      F: { C1: 21, C2: 0, stroke: 1, pattern: r.DTH[0] },
                      size: 8
                      })
              );
          }

          return new shape(this.pos.x, this.pos.y, this.pos.z, splats);
      }

      collideWithCylinderWall(radius){
          let x = this.pos.x; 
          let y = this.pos.y; 
          //let z = this.position.z 
          let distance = Math.sqrt(x*x + y*y);
          return distance > radius;
      }

      death(){
          deaths++;
          fallspeed = -0.08;
          this.alive = false;
          this.splatter();
      }

      splatter(){
          let bloodPuddleSplats = [];
          for(let i = 0; i < 40; i++){
              bloodPuddleSplats.push(
                  new Splat(
                      Math.sin(this.a) * Math.random() * 30,
                      Math.cos(this.a) * Math.random() * 30,
                      randFloat(0, 100), {
                      shape: shapes.CIR,
                      F: { C1: 3, C2: 2, pattern: r.DTH[8] },
                      size: randInt(7, 15)
                      })
              );
          }
          worldSplatShapes.push(new shape(this.pos.x, this.pos.y, this.pos.z, bloodPuddleSplats));
          console.log(this.pos.z);
          let { px, py, pz } = this.pos;

          let screenPosition = project3D(px, py, pz, camera);
          console.log(screenPosition);
          splodes.push(new BloodSplat(screenPosition.x, screenPosition.y, 30));
         // splodes.push(new BloodSplat(randInt(0,w), randInt(0,h), 30));


      }
  }

  // This music has been exported by SoundBox. You can use it with
      // http://sb.bitsnbites.eu/player-small.js in your own product.

      // See http://sb.bitsnbites.eu/demo.html for an example of how to
      // use it in a demo.

      // Song data
      var cellComplete = {
        songData: [
          { // Instrument 0
            i: [
            2, // OSC1_WAVEFORM
            100, // OSC1_VOL
            128, // OSC1_SEMI
            0, // OSC1_XENV
            3, // OSC2_WAVEFORM
            201, // OSC2_VOL
            128, // OSC2_SEMI
            0, // OSC2_DETUNE
            0, // OSC2_XENV
            0, // NOISE_VOL
            5, // ENV_ATTACK
            6, // ENV_SUSTAIN
            58, // ENV_RELEASE
            0, // ENV_EXP_DECAY
            0, // ARP_CHORD
            0, // ARP_SPEED
            0, // LFO_WAVEFORM
            195, // LFO_AMT
            6, // LFO_FREQ
            1, // LFO_FX_FREQ
            2, // FX_FILTER
            135, // FX_FREQ
            0, // FX_RESONANCE
            0, // FX_DIST
            32, // FX_DRIVE
            147, // FX_PAN_AMT
            6, // FX_PAN_FREQ
            28, // FX_DELAY_AMT
            6 // FX_DELAY_TIME
            ],
            // Patterns
            p: [1],
            // Columns
            c: [
              {n: [147,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,152,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,154],
               f: []}
            ]
          },
        ],
        rowLen: 5088,   // In sample lengths
        patternLen: 32,  // Rows per pattern
        endPattern: 0,  // End pattern
        numChannels: 1  // Number of channels
      };

  // This music has been exported by SoundBox. You can use it with
      // http://sb.bitsnbites.eu/player-small.js in your own product.

      // See http://sb.bitsnbites.eu/demo.html for an example of how to
      // use it in a demo.

      // Song data
      var tada = {
        songData: [
          { // Instrument 0
            i: [
            2, // OSC1_WAVEFORM
            100, // OSC1_VOL
            128, // OSC1_SEMI
            0, // OSC1_XENV
            3, // OSC2_WAVEFORM
            201, // OSC2_VOL
            128, // OSC2_SEMI
            0, // OSC2_DETUNE
            0, // OSC2_XENV
            0, // NOISE_VOL
            5, // ENV_ATTACK
            6, // ENV_SUSTAIN
            58, // ENV_RELEASE
            0, // ENV_EXP_DECAY
            0, // ARP_CHORD
            0, // ARP_SPEED
            0, // LFO_WAVEFORM
            195, // LFO_AMT
            6, // LFO_FREQ
            1, // LFO_FX_FREQ
            2, // FX_FILTER
            135, // FX_FREQ
            0, // FX_RESONANCE
            0, // FX_DIST
            32, // FX_DRIVE
            147, // FX_PAN_AMT
            6, // FX_PAN_FREQ
            55, // FX_DELAY_AMT
            6 // FX_DELAY_TIME
            ],
            // Patterns
            p: [1],
            // Columns
            c: [
              {n: [151,151,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,154,154,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,159,159,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,135,135],
               f: []}
            ]
          },
        ],
        rowLen: 6014,   // In sample lengths
        patternLen: 32,  // Rows per pattern
        endPattern: 0,  // End pattern
        numChannels: 1  // Number of channels
      };

  // This music has been exported by SoundBox. You can use it with
      // http://sb.bitsnbites.eu/player-small.js in your own product.

      // See http://sb.bitsnbites.eu/demo.html for an example of how to
      // use it in a demo.

      // Song data
      var rocksmash1 = {
        songData: [
          { // Instrument 0
            i: [
            3, // OSC1_WAVEFORM
            0, // OSC1_VOL
            102, // OSC1_SEMI
            0, // OSC1_XENV
            3, // OSC2_WAVEFORM
            0, // OSC2_VOL
            140, // OSC2_SEMI
            0, // OSC2_DETUNE
            0, // OSC2_XENV
            61, // NOISE_VOL
            2, // ENV_ATTACK
            2, // ENV_SUSTAIN
            47, // ENV_RELEASE
            61, // ENV_EXP_DECAY
            0, // ARP_CHORD
            0, // ARP_SPEED
            0, // LFO_WAVEFORM
            96, // LFO_AMT
            3, // LFO_FREQ
            1, // LFO_FX_FREQ
            3, // FX_FILTER
            94, // FX_FREQ
            79, // FX_RESONANCE
            0, // FX_DIST
            32, // FX_DRIVE
            84, // FX_PAN_AMT
            2, // FX_PAN_FREQ
            12, // FX_DELAY_AMT
            4 // FX_DELAY_TIME
            ],
            // Patterns
            p: [1],
            // Columns
            c: [
              {n: [147,,,,,147,,,,,,,,147,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,147,,147,,,,,135,,,,135,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,135],
               f: []}
            ]
          },
          { // Instrument 1
            i: [
            0, // OSC1_WAVEFORM
            214, // OSC1_VOL
            104, // OSC1_SEMI
            64, // OSC1_XENV
            0, // OSC2_WAVEFORM
            204, // OSC2_VOL
            104, // OSC2_SEMI
            0, // OSC2_DETUNE
            64, // OSC2_XENV
            229, // NOISE_VOL
            4, // ENV_ATTACK
            40, // ENV_SUSTAIN
            43, // ENV_RELEASE
            51, // ENV_EXP_DECAY
            0, // ARP_CHORD
            0, // ARP_SPEED
            0, // LFO_WAVEFORM
            231, // LFO_AMT
            6, // LFO_FREQ
            1, // LFO_FX_FREQ
            3, // FX_FILTER
            23, // FX_FREQ
            13, // FX_RESONANCE
            0, // FX_DIST
            32, // FX_DRIVE
            232, // FX_PAN_AMT
            4, // FX_PAN_FREQ
            7, // FX_DELAY_AMT
            6 // FX_DELAY_TIME
            ],
            // Patterns
            p: [1],
            // Columns
            c: [
              {n: [147],
               f: []}
            ]
          },
          { // Instrument 2
            i: [
            0, // OSC1_WAVEFORM
            13, // OSC1_VOL
            140, // OSC1_SEMI
            0, // OSC1_XENV
            0, // OSC2_WAVEFORM
            0, // OSC2_VOL
            140, // OSC2_SEMI
            0, // OSC2_DETUNE
            0, // OSC2_XENV
            24, // NOISE_VOL
            4, // ENV_ATTACK
            10, // ENV_SUSTAIN
            47, // ENV_RELEASE
            55, // ENV_EXP_DECAY
            0, // ARP_CHORD
            0, // ARP_SPEED
            0, // LFO_WAVEFORM
            187, // LFO_AMT
            5, // LFO_FREQ
            0, // LFO_FX_FREQ
            2, // FX_FILTER
            39, // FX_FREQ
            44, // FX_RESONANCE
            0, // FX_DIST
            32, // FX_DRIVE
            108, // FX_PAN_AMT
            2, // FX_PAN_FREQ
            16, // FX_DELAY_AMT
            4 // FX_DELAY_TIME
            ],
            // Patterns
            p: [1],
            // Columns
            c: [
              {n: [123,,,,,,120,,,,,125,,,,,,123,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,124,,,,,,,,,,,,,,128,,,,,112],
               f: []}
            ]
          },
          { // Instrument 3
            i: [
            0, // OSC1_WAVEFORM
            255, // OSC1_VOL
            116, // OSC1_SEMI
            79, // OSC1_XENV
            0, // OSC2_WAVEFORM
            111, // OSC2_VOL
            116, // OSC2_SEMI
            0, // OSC2_DETUNE
            83, // OSC2_XENV
            0, // NOISE_VOL
            4, // ENV_ATTACK
            6, // ENV_SUSTAIN
            69, // ENV_RELEASE
            52, // ENV_EXP_DECAY
            0, // ARP_CHORD
            0, // ARP_SPEED
            0, // LFO_WAVEFORM
            0, // LFO_AMT
            0, // LFO_FREQ
            0, // LFO_FX_FREQ
            2, // FX_FILTER
            14, // FX_FREQ
            0, // FX_RESONANCE
            0, // FX_DIST
            32, // FX_DRIVE
            0, // FX_PAN_AMT
            0, // FX_PAN_FREQ
            0, // FX_DELAY_AMT
            0 // FX_DELAY_TIME
            ],
            // Patterns
            p: [1],
            // Columns
            c: [
              {n: [123,125,,125,,,,123,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,130],
               f: []}
            ]
          },
        ],
        rowLen: 1323,   // In sample lengths
        patternLen: 128,  // Rows per pattern
        endPattern: 0,  // End pattern
        numChannels: 4  // Number of channels
      };

  // This music has been exported by SoundBox. You can use it with
      // http://sb.bitsnbites.eu/player-small.js in your own product.

      // See http://sb.bitsnbites.eu/demo.html for an example of how to
      // use it in a demo.

      // Song data
      var windlooprush = {
        songData: [
          { // Instrument 0
            i: [
            0, // OSC1_WAVEFORM
            0, // OSC1_VOL
            140, // OSC1_SEMI
            0, // OSC1_XENV
            0, // OSC2_WAVEFORM
            0, // OSC2_VOL
            140, // OSC2_SEMI
            0, // OSC2_DETUNE
            0, // OSC2_XENV
            130, // NOISE_VOL
            255, // ENV_ATTACK
            158, // ENV_SUSTAIN
            220, // ENV_RELEASE
            0, // ENV_EXP_DECAY
            0, // ARP_CHORD
            0, // ARP_SPEED
            0, // LFO_WAVEFORM
            51, // LFO_AMT
            1, // LFO_FREQ
            1, // LFO_FX_FREQ
            2, // FX_FILTER
            58, // FX_FREQ
            165, // FX_RESONANCE
            0, // FX_DIST
            32, // FX_DRIVE
            88, // FX_PAN_AMT
            1, // FX_PAN_FREQ
            157, // FX_DELAY_AMT
            2 // FX_DELAY_TIME
            ],
            // Patterns
            p: [1],
            // Columns
            c: [
              {n: [135],
               f: []}
            ]
          },
          { // Instrument 1
            i: [
            0, // OSC1_WAVEFORM
            0, // OSC1_VOL
            140, // OSC1_SEMI
            0, // OSC1_XENV
            0, // OSC2_WAVEFORM
            0, // OSC2_VOL
            140, // OSC2_SEMI
            0, // OSC2_DETUNE
            0, // OSC2_XENV
            255, // NOISE_VOL
            35, // ENV_ATTACK
            9, // ENV_SUSTAIN
            65, // ENV_RELEASE
            0, // ENV_EXP_DECAY
            0, // ARP_CHORD
            0, // ARP_SPEED
            0, // LFO_WAVEFORM
            51, // LFO_AMT
            2, // LFO_FREQ
            1, // LFO_FX_FREQ
            2, // FX_FILTER
            17, // FX_FREQ
            239, // FX_RESONANCE
            0, // FX_DIST
            32, // FX_DRIVE
            88, // FX_PAN_AMT
            1, // FX_PAN_FREQ
            85, // FX_DELAY_AMT
            2 // FX_DELAY_TIME
            ],
            // Patterns
            p: [1],
            // Columns
            c: [
              {n: [,135,,135,,,,,,135,,,,,,,,,,135,,,,,,,,,135,,135,,,,,,,,,,,,135,,,,,,,,,135,135,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,135,,,,,,,,,,,,,,,,135,,,,,,,,,135,,,,,,,,,,,,,,,,,,,,,,,,,,137,,,,,,,137,,137,,,,137,,,,,,137,,,,,137,,,,,,,,135,,,,,,,,,,,,,,,,,,,,135,,,,,,,,,,,,,,,,,,,,,,,,,,135,,,,,,,,,135,,,,,,135,,,,,135,,,,,,135,,,,,,,,,,,,,,,,,,,,,,,,,,,,,137,,,,,,,,,,,,,,,,,,,,,137,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,135,,,,,,,,,,,,,,135],
               f: []}
            ]
          },
        ],
        rowLen: 5513,   // In sample lengths
        patternLen: 128,  // Rows per pattern
        endPattern: 0,  // End pattern
        numChannels: 2  // Number of channels
      };

  W = window;





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

  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = `
  canvas {display: inline-block; height:100%; width:100%;  image-rendering: pixelated;
    image-rendering: crisp-edges; background-color: black;}

  * {
    overflow: hidden;
    background-color: black;
    margin: 0;
    }
`;
  document.head.appendChild(styleSheet);


  const atlasURL = 'data:image/webp;base64,UklGRgYBAABXRUJQVlA4TPkAAAAvPwAAAAmAIPx/e4jof2oBEIT/bw8R/U/BbQAAZBPbrG0bm77naNt2L3FjAQCpfJvZtdk21m7QhbpU769xtW3XZicCAJBRmm1G6wHry3sBv3oJ2TaTzQgMgykOw60sEIPJ/NfmfEb0m+KfSWGWH/i/u8auMllLp0n52cfoLvVtXVYKFAcUZfWj5j87X4mHi8bzX1l8HrX3pPYcTlvOVVr9qo3Lavb/rXmB1LJcpoDHLXpMG3GbpNff9Hvj+WI8GbdW+8mBP7FawBlU3S655I2Sr7TX+Qybu3urf71W96O6lRfDTjcaDs1JZ6CujZezdr8z65838/1hdwAA';
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
    };
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

    ];
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
          });
        }
      },0);
    });
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

  } else {
      let debugZ = camera.camZ < 0 ? "NEG " + camera.camZ : camera.camZ;
      debugText = `X ${camera.camX.toFixed(3)}\nY ${camera.camY}\nZ ${debugZ}\nPITCH ${camera.pitch}\nYAW ${camera.yaw}\n${player.acc.x.toFixed(3)}`;

      if(Key.isDown(Key.w)){
      let camVel = 1;
      camera.camX += Math.sin(camera.yaw)*Math.cos(camera.pitch)*camVel;
      camera.camZ += Math.cos(camera.yaw)*Math.cos(camera.pitch)*camVel;
      camera.camY += Math.sin(camera.pitch)*camVel;
     }
    
    if(Key.isDown(Key.s)){
      let camVel = 1;
      camera.camX -= Math.sin(camera.yaw)*Math.cos(camera.pitch)*camVel;
      camera.camZ -= Math.cos(camera.yaw)*Math.cos(camera.pitch)*camVel;
      camera.camY -= Math.sin(camera.pitch)*camVel;
    }

    if(Key.isDown(Key.a)){
      let camVel = 1;
      camera.camX -= Math.cos(-camera.yaw)*Math.cos(0)*camVel;
      camera.camZ -= Math.sin(-camera.yaw)*Math.cos(0)*camVel;
      camera.camY -= Math.sin(0)*camVel;
    }

    if(Key.isDown(Key.d)){
      let camVel = 1;
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
    r.clr(0, r.SCREEN);
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

  function preload(){
    r.clr(0, r.SCREEN);

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
    r.clr(0, r.SCREEN);
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

  function gameLoop(){
    {
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
        let stoneColor = choice([1,31,32]);
        //let positionOffset = {x:}
        let stone = new Splat(
          Math.sin( increment * i )*radius,
          Math.cos( increment * i )*radius,
          i %2 == 0 ? 0 : 40,
          {
          size: 7.6,
          shape: shapes.TRI,
          F:{
            C1: 0, C2:  choice[1], pattern: r.DTH[randInt(0,8)]
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
      
      chunks.push( splat );
    }
    splatShapes.push(new shape(0,0,0, chunks));

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
            started = true;

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
  };
  onclick=e=>{ onWindowInteraction(e); };
  ontouchstart=e=>{ onWindowInteraction(e);};

})();
