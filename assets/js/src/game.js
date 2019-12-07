

const puyoColorCount = 4;
// Cell Class
class Cell extends React.Component {
  getValue() {
    const {value} = this.props;
    
    if (!value.isRevealed) {
      return this.props.value.isFlagged ? "🚩" : null;
  }
  if (value.isMine) {
      return "💣";
  }
  if (value.neighbour === 0) {
      return null;
  }
  return value.neighbour;
}

render() {
    const {value, onClick, cMenu} = this.props;
    let className ="cell cell" + value.puyoColor;



    return (
      <div
      className={className}
      onContextMenu={cMenu}
      >
      {this.getValue()}
      </div>
      );
}
}

// Board Class
class Board extends React.Component {
  state = {
    boardData: this.initBoardData(this.props.height, this.props.width),
    gameStatus: "Game in progress",
    mineCount: this.props.mines,
    locked: 0,
    currPuyo1: [2, 0], //[x,y]
    currPuyo2: [2, 1]
};

constructor(props){
    super(props);
    this.moveCurrPuyo = this.moveCurrPuyo.bind(this);
    this.keyControlsFunction = this.keyControlsFunction.bind(this);
    this.spawnPuyo = this.spawnPuyo.bind(this);
    this.puyoLockFunctions = this.puyoLockFunctions.bind(this);
}

/* Helper Functions */
    // Gets initial board data
    initBoardData(height, width) {
        let data = this.spawnPuyo(this.createEmptyArray(height, width));
        return data;
    }

    spawnPuyo(data){
        //spawn puyo
        //third column vertical
        data[0][2].puyoColor = Math.floor(Math.random() * puyoColorCount) + 1;
        data[1][2].puyoColor = Math.floor(Math.random() * puyoColorCount) + 1;
        return data;


    }
    puyoLockFunctions(){
        let puyo1 = this.state.currPuyo1;
        let puyo2 = this.state.currPuyo2;
        let color1 = this.state.boardData[puyo1[1]][puyo1[0]].puyoColor;
        let color2 = this.state.boardData[puyo2[1]][puyo2[0]].puyoColor;
        console.log("colors: " + color1 + " " + color2)
        //check if puyo still at lowest pos
        if(puyo1[1] != Math.max(this.findLowestPosition(puyo1[0]),puyo1[1]) 
            && puyo2[1] != Math.max(this.findLowestPosition(puyo2[0],puyo2[1]))){
            return;
        }
        this.setState({locked:1});

        let puyosToPop1 = this.checkPuyoPop(puyo1[0], puyo1[1]);
        let puyosToPop2 = [];
        if(color1 != color2){
            puyosToPop2 = this.checkPuyoPop(puyo2[0], puyo2[1]);
        }


        //pop puyos
        if(puyosToPop1!=null){
            this.popPuyos(puyosToPop1);
        }
        if(puyosToPop2!=null){
            this.popPuyos(puyosToPop2);
        }

        console.log("Dropping puyo..." + puyosToPop1.size + " " + puyosToPop2.size);
        //drop puyos
        this.dropPuyo([...puyosToPop1, ...puyosToPop2]);

        this.spawnNewPuyo();
    }

    //drop all puyos in the same col above x,y
    dropPuyo(poppedPuyos){
        let data = this.state.boardData;
        let checkedCols = new Set();
        for (let index = 0; index < poppedPuyos.length; index++){
            let val = poppedPuyos[index];
            let valX = val[0];
            let valY = val[1];
            console.log("checking x: "+ valX + " for puyo at " + valX + " " + valY);
            if(checkedCols.has(valX)) continue;
            checkedCols.add(valX);
            console.log("actually checking x: "+ valX);

            //find the puyo above empty space (all the way above the board if no puyo)
            let highY = valY;
            while(highY>=0 && data[highY][valX].puyoColor == 0){
                console.log("Dropping puyo... " + highY + " " + valX);
                highY-=1;
            }

            //find the puyo below empty space (all the way at the bottom of the board if no puyo)
            let lowY = valY;
            while(lowY<this.props.height && data[lowY][valX].puyoColor == 0){
                lowY+=1;
            }
            lowY-=1;

            //find all puyos
            let colorArray = new Array();
            while(highY>=0 && data[highY][valX].puyoColor != 0){
                colorArray.push(data[highY][valX].puyoColor);
                data[highY][valX].puyoColor = 0;
                highY-=1;
                
            }
            console.log("color array length " + colorArray.length);
            console.log("Dropping puyo at col " + valX + "... " + " to " + lowY);
            //bring all the puyos down
            while(colorArray.length>0){
                let currColor = colorArray.shift();
                console.log("current color "+ currColor);
                data[lowY][valX].puyoColor = currColor; 
                lowY-=1;
                
            }

        }
        this.setState({boardData: data});

        

    }

    popPuyos(puyoSet){
        let data = this.state.boardData;

        for (let index = 0; index < puyoSet.length; index++){
            let val = puyoSet[index];
            //remove puyo
            data[val[1]][val[0]].puyoColor = 0;

        }

        this.setState({boardData:data});

    }

    spawnNewPuyo(){

        let data = this.state.boardData;
        data[0][2].puyoColor = Math.floor(Math.random() * puyoColorCount) + 1;
        data[1][2].puyoColor = Math.floor(Math.random() * puyoColorCount) + 1;

        this.setState({boardData:data,
                currPuyo1: [2, 0], //[x,y]
                currPuyo2: [2, 1]});

    }

    createEmptyArray(height, width) {
        let data = [];

        for (let i = 0; i < height; i++) {
            data.push([]);
            for (let j = 0; j < width; j++) {
                data[i][j] = {
                    x: i,
                    y: j,
                    isEmpty: false,
                    puyoColor: 0,
                };
            }
        }
        return data;
    }

    //find all puyos that should pop
    checkPuyoPop(x,y){
        //recursive function
        var checkedLocations = {};
        var sameColorPuyoLoc = [];
        let color = (this.state.boardData)[y][x].puyoColor;

        sameColorPuyoLoc = this.checkPuyoHelper(x,y, checkedLocations, sameColorPuyoLoc, color);

        if(sameColorPuyoLoc.length >= 4)
            return sameColorPuyoLoc;
        else
            return new Set();

    }

    checkPuyoHelper(x,y, checkedLocation, sameColorPuyoLoc, color){

        let data = this.state.boardData;
        //check if current puyo is same color
        console.log("color check at " + x + "," + y + " ? " + color + " " + data[y][x].puyoColor);

        if(data[y][x].puyoColor == color){

            //add given
            if( !(x in checkedLocation)){
                checkedLocation[x] = new Set();
                
            }
            checkedLocation[x].add(y);

            sameColorPuyoLoc.push([x,y]);


            //check neighboring puyo blocks
            
            //up
            if(this.checkIfValidLoc(x,y-1) && !this.checkIfEmpty(x,y-1) && !this.checkIfAlreadyVisited(x,y-1,checkedLocation)){
                console.log("up?");
                sameColorPuyoLoc = this.checkPuyoHelper(x,y-1,checkedLocation, sameColorPuyoLoc, color);
            }

            //down
            if(this.checkIfValidLoc(x,y+1) && !this.checkIfEmpty(x,y+1) && !this.checkIfAlreadyVisited(x,y+1,checkedLocation)){
                sameColorPuyoLoc = this.checkPuyoHelper(x,y+1,checkedLocation, sameColorPuyoLoc, color);
            }

            //left
            if(this.checkIfValidLoc(x-1,y) && !this.checkIfEmpty(x-1,y) && !this.checkIfAlreadyVisited(x-1,y,checkedLocation)){
                sameColorPuyoLoc = this.checkPuyoHelper(x-1,y,checkedLocation, sameColorPuyoLoc, color);
            }

            //right
            if(this.checkIfValidLoc(x+1,y) && !this.checkIfEmpty(x+1,y) && !this.checkIfAlreadyVisited(x+1,y,checkedLocation)){
                sameColorPuyoLoc = this.checkPuyoHelper(x+1,y,checkedLocation, sameColorPuyoLoc, color);
            }

            
        }

        return sameColorPuyoLoc;

    }

    checkIfEmpty(x,y){
        return this.state.boardData[y][x].puyoColor == 0;

    }

    checkIfAlreadyVisited(x,y,checkedLocations){
        if(x in checkedLocations){
            return checkedLocations[x].has(y);
        }
        return false;
    }

    checkIfValidLoc(x,y){

        return x >= 0 && x < this.props.width &&
            y >= 0 && y < this.props.height;

    }

    findLowestPosition(col){
        let data = this.state.boardData;
        for(let i = this.props.height-1; i>0; i-- ){
            if(data[i][col].puyoColor == 0){
                return i;
            }
        }
        return -1;

    }
    //move relatively
    moveCurrPuyo(x,y){

        let currPuyo1 = this.state.currPuyo1;
        let currPuyo2 = this.state.currPuyo2;
        let newPuyo1 = [currPuyo1[0] + x, currPuyo1[1] + y];
        let newPuyo2 = [currPuyo2[0] + x, currPuyo2[1] + y];

        //check if legal move
        if(!this.checkIfValidLoc(newPuyo1[0], newPuyo1[1]) || !this.checkIfValidLoc(newPuyo2[0], newPuyo2[1]) || 
            newPuyo1[1] > this.findLowestPosition(newPuyo1[0]) || newPuyo2[1] > this.findLowestPosition(newPuyo1[0]))
            return;



        console.log(currPuyo1 + " " + currPuyo2);
        console.log(newPuyo1 + " " + newPuyo2);

        let data = this.state.boardData;

        let color1 = data[currPuyo1[1]][currPuyo1[0]].puyoColor;
        let color2 = data[currPuyo2[1]][currPuyo2[0]].puyoColor;
        data[currPuyo1[1]][currPuyo1[0]].puyoColor = 0;
        data[currPuyo2[1]][currPuyo2[0]].puyoColor = 0;
        data[newPuyo1[1]][newPuyo1[0]].puyoColor = color1;
        data[newPuyo2[1]][newPuyo2[0]].puyoColor = color2;


        this.setState({
            currPuyo1: [newPuyo1[0], newPuyo1[1]],
            currPuyo2: [newPuyo2[0], newPuyo2[1]],
            boardData: data
        });

        //if at bottom start timer
        if(newPuyo1[1] == Math.max(this.findLowestPosition(newPuyo1[0]),newPuyo1[1]) 
            || newPuyo2[1] == Math.max(this.findLowestPosition(newPuyo2[0],newPuyo2[1])))
            setTimeout(this.puyoLockFunctions.bind(this), 1000);


    }

    keyControlsFunction(event){

        if(event.key === "ArrowUp") {
            this.dropCurrPuyo();
        }
        else if(event.key === "ArrowLeft"){
            this.moveCurrPuyo(-1,0);
        }
        else if(event.key === "ArrowRight"){
            this.moveCurrPuyo(1,0);
        }
        else if(event.key === "ArrowDown"){
            this.moveCurrPuyo(0,1);

        }
        
    }
    componentDidMount(){
        document.addEventListener("keydown", this.keyControlsFunction, false);
    }



    rotatePuyo(){

    }


    // Handle User Events

    _handleContextMenu(e, x, y) {
        e.preventDefault();
        let updatedData = this.state.boardData;
        let mines = this.state.mineCount;

        // check if already revealed
        if (updatedData[x][y].isRevealed) return;

        if (updatedData[x][y].isFlagged) {
            updatedData[x][y].isFlagged = false;
            mines++;
        } else {
            updatedData[x][y].isFlagged = true;
            mines--;
        }

        if (mines === 0) {
            const mineArray = this.getMines(updatedData);
            const FlagArray = this.getFlags(updatedData);
            if (JSON.stringify(mineArray) === JSON.stringify(FlagArray)) {
                this.setState({mineCount: 0, gameStatus: "You Win."});
                this.revealBoard();
                alert("You Win");
            }
        }

        this.setState({
            boardData: updatedData,
        });
    }

    renderBoard(data) {
        return data.map((datarow) => {
            return datarow.map((dataitem) => {
                return (
                    <div key={dataitem.x * datarow.length + dataitem.y}>
                    <Cell
                    cMenu={(e) => this._handleContextMenu(e, dataitem.x, dataitem.y)}
                        value={dataitem}
                        />
                        {(datarow[datarow.length - 1] === dataitem) ? <div className="clear" /> : ""}
                        </div>);
                })
            });

        }

        render() {
            return (
                <div className="board">

                {
                    this.renderBoard(this.state.boardData)
                }
                </div>
                );
        }
    }

// Game Class
class Game extends React.Component {
  state = {
    height: 12,
    width: 6,
    mines: 0
};


render() {
    const { height, width, mines } = this.state;
    return (
        <div className="game-wrapper">
        <div>
        
        </div>
        <div className="margin-auto">
            <div className="game">
            <Board height={height} width={width} mines={mines} />
            </div>
        </div>
        <div >
       
        </div>
        </div>
        );
}
}

const domContainer = document.querySelector('#game');
ReactDOM.render(<Game />, domContainer);

//disable default for arrow keys
window.addEventListener("keydown", function(e) {
    // space and arrow keys
    if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
        e.preventDefault();
    }
}, false);

