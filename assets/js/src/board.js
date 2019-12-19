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

  static randomColor() {
    return Math.floor(Math.random() * puyoColorCount) + 1;
  }

  constructor(props) {
    super(props);
    const axisSpawnY = 2;
    this.state = {
      boardData: Board.createEmptyArray(),
      locked: 0,
      currPuyo1: { x: 2, y: axisSpawnY - 1, puyoColor: Board.randomColor() },
      currPuyo2: { x: 2, y: axisSpawnY, puyoColor: Board.randomColor() }, // axis puyo
    };

    this.moveCurrPuyo = this.moveCurrPuyo.bind(this);
    this.keyControlsFunction = this.keyControlsFunction.bind(this);
    this.puyoLockFunctions = this.puyoLockFunctions.bind(this);

    this.chainsim = new Chainsim();
  }

  componentDidMount() {
    document.addEventListener('keydown', this.keyControlsFunction, false);
  }

  checkIfLegalMove(puyo1, puyo2) {
    const { boardData: data } = this.state;
    return Chainsim.checkIfValidLoc(puyo1)
      && Chainsim.checkIfValidLoc(puyo2)
      && data[puyo1.y][puyo1.x].puyoColor === 0
      && data[puyo2.y][puyo2.x].puyoColor === 0;
  }

  puyoLockFunctions() {
    const {
      currPuyo1: puyo1,
      currPuyo2: puyo2,
      boardData: data,
    } = this.state;
    // check if puyo still at lowest pos
    if (
      puyo1.y < this.findLowestPosition(puyo1.x)
      && puyo2.y < this.findLowestPosition(puyo2.x)
    ) {
      return;
    }
    this.setState({ locked: 1 });

    this.chainsim.placePuyo(puyo1, puyo2);

    this.setState({
      boardData: data.map((row, i) => row.map((puyo, j) => ({
        ...puyo,
        puyoColor: this.chainsim.board[i][j],
      }))),
    });

    this.spawnPuyo();
  }

  spawnPuyo() {
    // 12th row
    const axisSpawnY = 2;
    this.setState({
      currPuyo1: { x: 2, y: axisSpawnY - 1, puyoColor: Board.randomColor() },
      currPuyo2: { x: 2, y: axisSpawnY, puyoColor: Board.randomColor() }, // axis puyo
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
  moveCurrPuyo(dx, dy) {
    const { currPuyo1, currPuyo2 } = this.state;
    const newPuyo1 = { x: currPuyo1.x + dx, y: currPuyo1.y + dy, puyoColor: currPuyo1.puyoColor };
    const newPuyo2 = { x: currPuyo2.x + dx, y: currPuyo2.y + dy, puyoColor: currPuyo2.puyoColor };

    // check if legal move
    if (!this.checkIfLegalMove(newPuyo1, newPuyo2)) {
      return;
    }

    this.setState({
      currPuyo1: newPuyo1,
      currPuyo2: newPuyo2,
    });

    // if at bottom start timer
    if (
      newPuyo1.y >= this.findLowestPosition(newPuyo1.x)
      || newPuyo2.y >= this.findLowestPosition(newPuyo2.x)
    ) {
      setTimeout(this.puyoLockFunctions.bind(this), 1000);
    }
  }

  keyControlsFunction(event) {
    if (event.key === 'ArrowLeft') {
      this.moveCurrPuyo(-1, 0);
    }
    if (event.key === 'ArrowRight') {
      this.moveCurrPuyo(1, 0);
    }
    if (event.key === 'ArrowDown') {
      this.moveCurrPuyo(0, 1);
    }
  }

  rotatePuyo() {
  }

  renderBoard() {
    const { boardData: data, currPuyo1, currPuyo2 } = this.state;
    return data.map((datarow, y) => datarow.map((dataitem, x) => (
      <div key={dataitem.x * datarow.length + dataitem.y}>
        <Cell value={x === currPuyo1.x && y === currPuyo1.y ? currPuyo1
          : x === currPuyo2.x && y === currPuyo2.y ? currPuyo2 : dataitem}
        />
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
