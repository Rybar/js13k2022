import { inView } from '../core/utils';
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
      this.cells[i] = {
        x: (i%this.w),
        y: Math.floor(i/this.w),
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
      if(inView({x: e.x*this.cellSize, y: e.y*this.cellSize}, 16)){
        if(e.type != this.types.EMPTY){
            r.pat = e.fill.dither;
            r.cursorColor2 = e.fill.color2;
            r.fillRect(
                e.x*this.cellSize-view.x,
                e.y*this.cellSize-view.y,
                this.cellSize,
                this.cellSize,
                e.fill.color1
            )
            r.pat = r.dither[0];
            r.cursorColor2 = 64;
        }
      }
    });
  }
  update(){
    this.cells.forEach(e=>{

    });
  }

  countAliveNeighbors(x,y){
    let count = 0;
    for(let i = -1; i < 2; i++){
      for(let j = -1; j < 2; j++){
        if(i == 0 && j == 0){
          continue;
        }
        let neighborX = x+i;
        let neighborY = y+j;
        if(neighborX < 0 || neighborX >= this.w || neighborY < 0 || neighborY >= this.h){
          continue;
        }
        if(this.cells[neighborX+neighborY*this.w].type != this.types.EMPTY){
          count++;
        }
      }
    }
    //console.log(count);
    return count;
  }

  doSimulationStep(birthLimit, deathLimit){
    let newCells = this.cells.map((x) => x);
    for(let i = 0; i < this.cells.length; i++){
      let cell = this.cells[i];
      let neighbors = this.countAliveNeighbors(cell.x, cell.y);
      if(cell.type == this.types.WALL){
        if(neighbors < deathLimit){
          newCells[i].type = this.types.EMPTY;
        }
        else { 
          newCells[i].type = this.types.WALL;
        }
      }
      else {
        if(neighbors > birthLimit){
          newCells[i].type = this.types.WALL;
        }
        else {
          newCells[i].type = this.types.EMPTY;
        }
      }
    }
    this.cells = newCells;
  }
}

export default Map;