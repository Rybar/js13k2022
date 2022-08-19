class Fan{
    constructor(x, y){
        this.x = x;
        this.y = y;
        this.size = 47;
    }
    draw(){
        r.fillRect(this.x - view.x, this.y - view.y, this.size, this.size, 30);
        r.fillCircle(
            this.x + Math.floor(this.size/2) - view.x,
            this.y + Math.floor(this.size/2)- view.y, this.size/2 - 3,
            0);
        r.fillCircle(
            this.x + Math.floor(this.size/2) - view.x,
            this.y + Math.floor(this.size/2)- view.y, this.size/7,
            30);
    }
    update(){

    }
}

export default Fan;