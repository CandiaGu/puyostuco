

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
    currPuyo1: [2, 0], //[x,y]
    currPuyo2: [2, 1]
};

constructor(props){
    super(props);
    this.moveCurrPuyo = this.moveCurrPuyo.bind(this);
    this.keyControlsFunction = this.keyControlsFunction.bind(this);
    this.spawnPuyo = this.spawnPuyo.bind(this);
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

    dropCurrPuyo(){

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
        if(newPuyo1[0] < 0|| newPuyo1[0] > this.props.width-1 ||
            newPuyo1[1] < 0|| newPuyo1[1] > this.findLowestPosition(newPuyo1[0]) ||
            newPuyo2[0] < 0|| newPuyo2[0] > this.props.width-1 ||
            newPuyo2[1] < 0|| newPuyo2[1] > this.findLowestPosition(newPuyo1[0])
            )
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
            setTimeout(this.spawnNewPuyo.bind(this), 2000);


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

    // get number of neighbouring mines for each board cell
    getNeighbours(data, height, width) {
        let updatedData = data, index = 0;

        for (let i = 0; i < height; i++) {
            for (let j = 0; j < width; j++) {
                if (data[i][j].isMine !== true) {
                    let mine = 0;
                    const area = this.traverseBoard(data[i][j].x, data[i][j].y, data);
                    area.map(value => {
                        if (value.isMine) {
                            mine++;
                        }
                    });
                    if (mine === 0) {
                        updatedData[i][j].isEmpty = true;
                    }
                    updatedData[i][j].neighbour = mine;
                }
            }
        }

        return (updatedData);
    };

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
        time
        </div>
        <div className="margin-auto">
        <div className="game">
        <Board height={height} width={width} mines={mines} />
        </div>
        </div>
        <div >
        preview
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

