//All 3D projection code is based on the following tutorial by my friend, Scott McGann:
//http://https://cantelope.org/3D/
import { inView } from "./utils";

//global r = RetroBuffer
export function translateShape(x, y, z, shape){
    
    shape.x += x;
    shape.y += y;
    shape.z += z;
}

export function matrix_rotate(vert, roll, pitch, yaw) {
	
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
export function project3D(x, y, z, vars){

    var p,d
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
    }else{
      return {
        d:-1
      };
    }
}

export function Vert(x,y,z){
    this.x = x;
    this.y = y;
    this.z = z;
}
export const shapes = {
    CIR: 0,
    SQ: 1,
    PT: 2,
    TRI: 3,
    SPRITE: 4,
}

export const DD = 500;
export const FADEDISTANCE = 1800;
export const FADEDISTANCE2 = 1975;
export const SCALEFACTOR = 40;

export class Splat{
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
            r.pat = pattern
            switch(shape){
                case shapes.CIR:
                    if(screenSize < 1){
                        r.pset(x,y,this .F.stroke? this .F.stroke : C1, screenPosition.d);
                    }else{
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

export function splatLine(x1,y1,z1,x2,y2,z2){
    this.a = new Vert(x1,y1,z1);
    this.b = new Vert(x2,y2,z2);
    //generate splats along the line
    this.splats = [];
    var dx = this.b.x - this.a.x;
    var dy = this.b.y - this.a.y;
    var dz = this.b.z - this.a.z;
    var d = Math.sqrt(dx*dx+dy*dy+dz*dz);
    var n = Math.floor(d/0.1);
    for(var i=0;i<n;i++){
        var x = this.a.x + dx*i/n;
        var y = this.a.y + dy*i/n;
        var z = this.a.z + dz*i/n;
        this.splats.push(new Splat(x,y,z));
    }
    return splats
}

export function randomSpherePoint(x0,y0,z0,radius){
    var u = Math.random();
    var v = Math.random();
    var theta = 2 * Math.PI * u;
    var phi = Math.acos(2 * v - 1);
    var x = x0 + (radius * Math.sin(phi) * Math.cos(theta));
    var y = y0 + (radius * Math.sin(phi) * Math.sin(theta));
    var z = z0 + (radius * Math.cos(phi));
    return new Vert(x,y,z);
 }

 export class shape{
    constructor(x,y,z, splatArray){
        this.location = new Vert(x,y,z);
        this.splats = splatArray;
        this.splats.forEach(splat => {
            splat.vert.x += this.location.x;
            splat.vert.y += this.location.y;
            splat.vert.z += this.location.z;
        })
    }
    updatePosition(xdelta,ydelta, zdelta){
        this.location.x += xdelta;
        this.location.y += ydelta;
        this.location.z += zdelta;
        this.splats.forEach(splat => {
            splat.vert.x += xdelta; 
            splat.vert.y += ydelta;
            splat.vert.z += zdelta; 
        })
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
        })
    }
}

    

 export class Line3d{
    constructor(x1,y1,z1,x2,y2,z2, color){
        this.a = new Vert(x1,y1,z1);
        this.b = new Vert(x2,y2,z2);
        this.color = color;
    }
    draw(camera){
        let screenPositionA = project3D(this.a.x, this.a.y, this.a.z, camera);
        let screenPositionB = project3D(this.b.x, this.b.y, this.b.z, camera);
        if(screenPositionA.d != -1 && screenPositionB.d != -1 && screenPositionA.d < DD && screenPositionB.d < DD){
            
            r.line3d(screenPositionA.x, screenPositionA.y, screenPositionA.d, screenPositionB.x, screenPositionB.y, screenPositionB.d, this.color);
        }
    }
 }
