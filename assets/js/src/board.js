import Cell from './cell.js';
import Chainsim from './chainsim.js';

const puyoColorCount = 4;
const height = 14;
const width = 6;

class Board extends React.Component {
  static createEmptyArray() {
    return Array.from({ length: height }, (_, i) => Array.from({ length: width }, (_, j) => ({
      x: i,
      y: j,
      isEmpty: false,
      puyoColor: 0,
    })));
  }

  constructor(props) {
    super(props);
    this.state = {
      boardData: Board.createEmptyArray(),
      locked: 0,
    };

    this.moveCurrPuyo = this.moveCurrPuyo.bind(this);
    this.keyControlsFunction = this.keyControlsFunction.bind(this);
    this.puyoLockFunctions = this.puyoLockFunctions.bind(this);

    this.chainsim = new Chainsim();
  }

  componentDidMount() {
    document.addEventListener('keydown', this.keyControlsFunction, false);

    this.spawnPuyo();
  }

  puyoLockFunctions() {
    const {
      currPuyo1: puyo1,
      currPuyo2: puyo2,
      boardData: data,
    } = this.state;
    const color1 = data[puyo1[1]][puyo1[0]].puyoColor;
    const color2 = data[puyo2[1]][puyo2[0]].puyoColor;
    console.log('colors: ' + color1 + ' ' + color2);
    // check if puyo still at lowest pos
    if (
      puyo1[1] < this.findLowestPosition(puyo1[0])
      && puyo2[1] < this.findLowestPosition(puyo2[0])
    ) {
      return;
    }

    this.setState({ locked: 1 });

    this.chainsim.placePuyo(puyo1, color1, puyo2, color2);
    data.forEach((row, i) => row.forEach((elem, j) => {
      elem.puyoColor = this.chainsim.board[i][j];
    }));

    this.setState({ boardData: data });

    this.spawnPuyo();
  }

  spawnPuyo() {
    const { boardData: data } = this.state;
    data[0][2].puyoColor = Math.floor(Math.random() * puyoColorCount) + 1;
    data[1][2].puyoColor = Math.floor(Math.random() * puyoColorCount) + 1;

    this.setState({
      boardData: data,
      currPuyo1: [2, 0], // [x, y]
      currPuyo2: [2, 1],
    });
  }

  findLowestPosition(col) {
    const { boardData: data } = this.state;
    for (let i = height - 1; i > 0; i--) {
      if (data[i][col].puyoColor === 0) {
        return i;
      }
    }
    return -1;
  }

  // move relatively
  moveCurrPuyo(x, y) {
    const { currPuyo1, currPuyo2 } = this.state;
    const newPuyo1 = [currPuyo1[0] + x, currPuyo1[1] + y];
    const newPuyo2 = [currPuyo2[0] + x, currPuyo2[1] + y];

    // check if legal move
    if (
      !Chainsim.checkIfValidLoc(newPuyo1[0], newPuyo1[1])
      || !Chainsim.checkIfValidLoc(newPuyo2[0], newPuyo2[1])
      || newPuyo1[1] > this.findLowestPosition(newPuyo1[0])
      || newPuyo2[1] > this.findLowestPosition(newPuyo1[0])
    ) {
      return;
    }

    console.log(currPuyo1 + ' ' + currPuyo2);
    console.log(newPuyo1 + ' ' + newPuyo2);

    const { boardData: data } = this.state;

    const color1 = data[currPuyo1[1]][currPuyo1[0]].puyoColor;
    const color2 = data[currPuyo2[1]][currPuyo2[0]].puyoColor;
    data[currPuyo1[1]][currPuyo1[0]].puyoColor = 0;
    data[currPuyo2[1]][currPuyo2[0]].puyoColor = 0;
    data[newPuyo1[1]][newPuyo1[0]].puyoColor = color1;
    data[newPuyo2[1]][newPuyo2[0]].puyoColor = color2;

    this.setState({
      currPuyo1: [newPuyo1[0], newPuyo1[1]],
      currPuyo2: [newPuyo2[0], newPuyo2[1]],
      boardData: data,
    });

    // if at bottom start timer
    if (
      newPuyo1[1] >= this.findLowestPosition(newPuyo1[0])
      || newPuyo2[1] >= this.findLowestPosition(newPuyo2[0])
    ) {
      setTimeout(this.puyoLockFunctions.bind(this), 1000);
    }
  }

  keyControlsFunction(event) {
    if (event.key === 'ArrowUp') {
      this.dropCurrPuyo();
    } else if (event.key === 'ArrowLeft') {
      this.moveCurrPuyo(-1, 0);
    } else if (event.key === 'ArrowRight') {
      this.moveCurrPuyo(1, 0);
    } else if (event.key === 'ArrowDown') {
      this.moveCurrPuyo(0, 1);
    }
  }

  rotatePuyo() {
  }

  renderBoard() {
    const { boardData: data } = this.state;
    return data.map((datarow) => datarow.map((dataitem) => (
      <div key={dataitem.x * datarow.length + dataitem.y}>
        <Cell value={dataitem} />
        { (datarow[datarow.length - 1] === dataitem) ? <div className="clear" /> : '' }
      </div>
    )));
  }

  render() {
    return (
      <div className="board">
        {
          this.renderBoard()
        }
      </div>
    );
  }
}

export default Board;
