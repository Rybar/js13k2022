import Splode from "../splode.js";
import { randInt, clamp, randFloat } from "../core/utils.js";
import { shape, Splat, shapes, project3D } from "../core/threedee.js";
import BloodSplat from "./BloodSplat.js";
class Player {
    constructor(x, y, z) {
        this.pos = { x: x, y: y, z: z };
        this.prev = { x: x, y: y, z: z };
        this.pd = { x: 0, y: 0, z: 0 };
        this.acc = {x: 0, y: 0}
        this.Macc = {x: 0.1, y: 0.1}
        this.macc = {x: -0.1, y: -0.1}
        this.v = {x: 0, y: 0}
        this.MV = {x: 2, y: 2}
        this.mV = {x: -2, y: -2}
        this.drag = {x: 0.9, y: 0.9}
        this.accD = {x: 0.5, y: 0.5}
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
           
        }else{
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
        let splats = []
        //head
        splats.push(
            new Splat(0,0,5, {
            shape: shapes.CIR,
            F: { C1: 21, C2: 0, stroke: 1, pattern: r.DTH[0] },
            size: 14 
            })
        )
        //body
        for(let i = 0; i < 12; i++){
            splats.push(
                new Splat(0,0,4-i, {
                    shape: shapes.CIR,
                    F: { C1: 21, C2: 0, stroke: 1, pattern: r.DTH[0] },
                    size: 10
                    })
            )
        }
        //armspan/shoulders?
        for(let i = 0; i < 9; i++){
            splats.push(
                new Splat(-4+i,0,2, {
                    shape: shapes.CIR,
                    F: { C1: 21, C2: 0, stroke: 1, pattern: r.DTH[0] },
                    size: 8
                    })
            )
        }
        //hips
        for(let i = 0; i < 7; i++){
            splats.push(
                new Splat(-2+i,0,-1, {
                    shape: shapes.CIR,
                    F: { C1: 21, C2: 0, stroke: 1, pattern: r.DTH[0] },
                    size: 8
                    })
            )
        }

        return new shape(this.pos.x, this.pos.y, this.pos.z, splats);
    }

    collideWithCylinderWall(radius){
        let x = this.pos.x 
        let y = this.pos.y 
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
            let randAngle = Math.random() * Math.PI * 2;
            bloodPuddleSplats.push(
                new Splat(
                    Math.sin(this.a) * Math.random() * 30,
                    Math.cos(this.a) * Math.random() * 30,
                    randFloat(0, 100), {
                    shape: shapes.CIR,
                    F: { C1: 3, C2: 2, pattern: r.DTH[8] },
                    size: randInt(7, 15)
                    })
            )
        }
        worldSplatShapes.push(new shape(this.pos.x, this.pos.y, this.pos.z, bloodPuddleSplats));
        console.log(this.pos.z);
        let { px, py, pz } = this.pos;

        let screenPosition = project3D(px, py, pz, camera);
        console.log(screenPosition)
        splodes.push(new BloodSplat(screenPosition.x, screenPosition.y, 30));
       // splodes.push(new BloodSplat(randInt(0,w), randInt(0,h), 30));


    }
}

export default Player;