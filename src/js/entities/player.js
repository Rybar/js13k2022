class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 8;
        this.height = 16;
        this.speed = {
            x: 2,
            y: 2
        }
        this.velocity = {
            x: 0,
            y: 0
        }
        this.drag = {
            x: 0.8,
            y: 0.8
        }
        this.alive = true;
    }

    draw(){
        r.fillRect(this.x - view.x, this.y - view.y, this.width, this.height, 22);
    }

    update(){
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.velocity.x *= this.drag.x;
        this.velocity.y *= this.drag.y;
        return 0;
    }

    move(targetX, targetY){
        let xDelta = targetX - this.x;
        let yDelta = targetY - this.y;
        let direction = Math.atan2(yDelta, xDelta);
        this.velocity.x = Math.cos(direction) * this.speed.x;
        this.velocity.y = Math.sin(direction) * this.speed.y;
    }
}

export default Player;