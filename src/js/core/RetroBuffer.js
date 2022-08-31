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
    let mask = this.pat & Math.pow(2, px)
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
              let cx = 0;
              let cy = 0;
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

export default RetroBuffer;
