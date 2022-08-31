import { inView, randInt } from '../core/utils';
class Map{
  constructor(w,h, x, y){
    this.types = {
        EMPTY: 0,
        WALL: 1,
        DECOR: 2
    }
    this.customDithers = [
      0b1000100010001000,
      0b0100010001000100,
      0b0010001000100010,
      0b0001000100010001,
    ];

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
        alive: randInt(0,100) > 90 ? true : false,
        F: {
            C1: 0,
            C2: 0,
            DTH: 0,
        },
        flowerColor: randInt(2,63),
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
            r.pat = e .F.DTH;
            r.P2 = e .F.C2;
            r.fillCircle(
                e.x*this.cellSize-view.x,
                e.y*this.cellSize-view.y,
                this.cellSize-e.offset.scale,
                
                e .F.C1
            )
            r.pat = r.DTH[0];
            r.P2 = 64;
        }
      }
    });
    this.cells.forEach(e=>{
      if(inView({x: e.x*this.cellSize, y: e.y*this.cellSize}, 16)){
        if(e.type != this.types.EMPTY){
            if(e.alive){
                r.fillRect(
                    e.x*this.cellSize-view.x + 3,
                    e.y*this.cellSize-view.y + 3,
                    2, 2,
                    e.flowerColor
                )
                r.fillRect(
                  e.x*this.cellSize-view.x + 7,
                  e.y*this.cellSize-view.y + 3,
                  2, 2,
                  e.flowerColor
                )
                r.fillRect(
                  e.x*this.cellSize-view.x + 5,
                  e.y*this.cellSize-view.y + 1,
                  2, 2,
                  e.flowerColor
                )
                r.fillRect(
                  e.x*this.cellSize-view.x + 5,
                  e.y*this.cellSize-view.y + 5,
                  2, 2,
                  e.flowerColor
                )
            }
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
    return count;
  }

    getNeighbors(){
      let neighbors = [];
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
          neighbors.push(this.cells[neighborX+neighborY*this.w]);
        }
      }
      return neighbors;
    }

    getCell(x,y){
      return this.cells[x+y*this.w];
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
    this.setFills();
  }

  setFills(){
    this.cells.forEach(e=>{
      //set all walls to blue-green
      if(e.type == this.types.WALL){
        e .F.C1 = 15;
        e .F.C2 = 16;
        e .F.DTH = r.DTH[randInt(0,15)]
        e.offset.scale = randInt(1,3);
      }
      //don't want to attempt to set cells at edge of map
      if(e.x > 0 && e.y > 0 && e.x < this.w && e.y < this.h){
        //light up the top edge tiles
        let topNeighbor = this.getCell(e.x, e.y-1);
        if(topNeighbor.type == this.types.EMPTY){
          e.fill = {
            C1: 13,
            C2: 14,
            DTH: r.DTH[randInt(0,15)]
          }
          
          
        }
        //darken bottom edge tiles
        let bottomNeighbor = this.getCell(e.x, e.y+1);
        if(bottomNeighbor != undefined && bottomNeighbor.type == this.types.EMPTY){
          e .F.C1 = 13;
          e .F.C2 = 14;
          e .F.DTH = r.DTH[randInt(0,15)]
        }

      }
    });
  }
}


export default Map;