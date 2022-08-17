class Map{
  constructor(w,h, x, y){
    this.types = {
        EMPTY: 0,
        WALL: 1,
    }
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.cellSize = 8;
    this.cells = [];
    this.cells.length = w*h;
    for( let i = 0; i < this.cells.length; i++){
      this.cells[i] ={
        x: i%w*this.cellSize,
        y: Math.floor(i/w)*this.cellSize,
        type: 0,
        vined: false,
        fill: {
            color1: 0,
            color2: 0,
            dither: 0
        },
        offset: {
            x: 0,
            y: 0,
            scale: 0
        }
      }   
    }
  }
  draw(){
    this.cells.forEach(e=>{
        if(e.type != this.types.EMPTY){
            r.pat = e.fill.dither;
            r.cursorColor2 = e.fill.color2;
            r.fillRect(
                e.x-view.x,
                e.y-view.y,
                this.cellSize,
                this.cellSize,
                e.fill.color1
            )
            r.pat = r.dither[0];
            r.cursorColor2 = 64;
        }
    });
  }
  update(){
    this.cells.forEach(e=>{

    });
  }
}

export default Map;