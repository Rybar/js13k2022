import Splode from "../splode.js";
import { randInt } from "../core/utils.js";
class Player {
    constructor(x, y, z=0) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.width = 8;
        this.height = 8;
        this.speed = {x: 2, y: 2}
        this.velocity = {x: 0, y: 0}
        this.drag = {x: 0.8, y: 0.8}
        this.target = {x: 0,y: 0, distance: 0}
        this.alive = true;
    }

    draw(){
        r.fillCircle(
            this.x - view.x,
            this.y - view.y + Math.sin(t/10)*5, this.width/2,
            22);
    }

    update(){
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        let xDelta = this.target.x - this.x;
        let yDelta = this.target.y - this.y;

        this.target.distance = Math.sqrt(xDelta * xDelta + yDelta * yDelta);
        
        if(this.target.distance < 5){
            this.velocity.x *= this.drag.x;
            this.velocity.y *= this.drag.y;
        }

        splodes.push(new Splode(this.x, this.y+Math.sin(t/10)*7, randInt(5, 10), randInt(18, 22)));
        return 0;
    }

    move(targetX, targetY){
        this.target.x = targetX;
        this.target.y = targetY;
        let xDelta = this.target.x - this.x;
        let yDelta = this.target.y - this.y;
        let direction = Math.atan2(yDelta, xDelta);
        this.velocity.x = Math.cos(direction) * this.speed.x;
        this.velocity.y = Math.sin(direction) * this.speed.y;
    }
}

export default Player;