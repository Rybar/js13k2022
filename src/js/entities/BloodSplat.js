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
    
    r.pat = r.DTH[15- Math.floor( (this.life/this.lifeMax) * 15)]
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

export default BloodSplat;