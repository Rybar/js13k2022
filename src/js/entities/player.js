import Splode from "../splode.js";
import { randInt, clamp } from "../core/utils.js";
import { shape, Splat, shapes } from "../core/threedee.js";
class Player {
    constructor(x, y, z) {
        this.position = { x: x, y: y, z: z };
        this.previousPosition = { x: x, y: y, z: z };
        this.positionDelta = { x: 0, y: 0, z: 0 };
        this.accelleration = {x: 0, y: 0}
        this.maxAccelleration = {x: 0.1, y: 0.1}
        this.minAccelleration = {x: -0.1, y: -0.1}
        this.velocity = {x: 0, y: 0}
        this.maxVelocity = {x: 2, y: 2}
        this.minVelocity = {x: -2, y: -2}
        this.drag = {x: 0.9, y: 0.9}
        this.accellDrag = {x: 0.5, y: 0.5}
        this.alive = true;
        this.previousAngle = 0;
        this.angle = Math.atan2(this.position.y, this.position.x);
        this.angleDelta = 0;
        this.sprite = this.initializeShape();
        
        //temp rotation to face front while I build character
        //this.sprite.rotate(0,-Math.PI/2,0)
    }
    draw(){
       this.sprite.splats.forEach(splat => splat.draw(camera));
    }
sa
    update(){
        
        this.previousPosition.x = this.position.x;
        this.previousPosition.y = this.position.y;
        this.previousAngle = this.angle;
        this.velocity.x += this.accelleration.x; 
        this.velocity.y += this.accelleration.y;
        this.velocity.x *= this.drag.x;
        this.velocity.y *= this.drag.y;
        this.velocity.x =  clamp(this.velocity.x, this.minVelocity.x, this.maxVelocity.x);
        this.velocity.y =  clamp(this.velocity.y, this.minVelocity.y, this.maxVelocity.y);
        this.accelleration.x *= this.accellDrag.x;
        this.accelleration.y *= this.accellDrag.y;
        this.accelleration.x = clamp(this.accelleration.x, this.minAccelleration.x, this.maxAccelleration.x);
        this.accelleration.y = clamp(this.accelleration.y, this.minAccelleration.y, this.maxAccelleration.y);


        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        this.angle = Math.atan2(this.position.y, this.position.x);

        this.positionDelta.x = this.position.x - this.previousPosition.x;
        this.positionDelta.y = this.position.y - this.previousPosition.y;
        this.positionDelta.z = this.position.z - this.previousPosition.z;
        this.angleDelta = this.angle - this.previousAngle;
        this.sprite.updatePosition(this.positionDelta.x, this.positionDelta.y, this.positionDelta.z);
        this.sprite.rotate(this.angleDelta, 0, 0);
    }

    move(x,y){
        this.accelleration.x += x;
        this.accelleration.y += y;

        
    }
    initializeShape(){
        let splats = []
        //head
        splats.push(
            new Splat(0,0,5, {
            shape: shapes.CIRCLE,
            fill: { color1: 21, color2: 0, stroke: 1, pattern: r.dither[0] },
            size: 7 
            })
        )
        //body
        for(let i = 0; i < 12; i++){
            splats.push(
                new Splat(0,0,4-i/2, {
                    shape: shapes.CIRCLE,
                    fill: { color1: 21, color2: 0, stroke: 1, pattern: r.dither[0] },
                    size: 5
                    })
            )
        }
        //armspan/shoulders?
        for(let i = 0; i < 9; i++){
            splats.push(
                new Splat(-2+i/2,0,2, {
                    shape: shapes.CIRCLE,
                    fill: { color1: 21, color2: 0, stroke: 1, pattern: r.dither[0] },
                    size: 4
                    })
            )
        }
        //hips
        for(let i = 0; i < 7; i++){
            splats.push(
                new Splat(-1+i/3,0,-1, {
                    shape: shapes.CIRCLE,
                    fill: { color1: 21, color2: 0, stroke: 1, pattern: r.dither[0] },
                    size: 4
                    })
            )
        }

        return new shape(this.position.x, this.position.y, this.position.z, splats);
    }
}

export default Player;