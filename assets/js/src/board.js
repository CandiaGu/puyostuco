import Cell from './cell.js';
import Chainsim from './chainsim.js';
import Controller from './controller.js';

const puyoColorCount = 4;
const height = 14;
const width = 6;
const axisSpawnX = 2;
const axisSpawnY = 2; // spawn axis puyo in 12th row
const garbageRate = 70;

class Board extends React.Component {
  static createEmptyArray() {
    return Array.from({ length: height }, (_, i) => Array.from({ length: width }, (_, j) => ({
      x: i,
      y: j,
      puyoColor: 0,
    })));
  }

  static randomColor() {
    return Math.floor(Math.random() * puyoColorCount) + 1;
  }

  constructor(props) {
    super(props);
    this.state = {
      boardData: Board.createEmptyArray(),
      currPuyo1: { x: axisSpawnX, y: axisSpawnY - 1, puyoColor: Board.randomColor() },
      currPuyo2: { x: axisSpawnX, y: axisSpawnY, puyoColor: Board.randomColor() }, // axis puyo
    };

    this.chainsim = new Chainsim();
    this.lockTimer = null;

    const that = this;
    const controls = {
      left: { f: () => { that.moveCurrPuyo.bind(that)(-1, 0); }, delay: 100, repeat: 25 },
      right: { f: () => { that.moveCurrPuyo.bind(that)(1, 0); }, delay: 100, repeat: 25 },
      down: { f: () => { that.moveCurrPuyo.bind(that)(0, 1); }, delay: 0, repeat: 75 },
      ccw: { f: () => { that.rotatePuyo.bind(that)(-1); }, delay: 0, repeat: 0 },
      cw: { f: () => { that.rotatePuyo.bind(that)(1); }, delay: 0, repeat: 0 },
    };
    const keys = {
      ArrowLeft: 'left',
      ArrowRight: 'right',
      ArrowDown: 'down',
      z: 'ccw',
      x: 'cw',
      d: 'ccw',
      f: 'cw',
    };
    this.controller = new Controller(controls, keys);
    this.score = 0;
  }

  componentDidMount() {
    this.controller.locked = false;
  }

  checkIfLegalMove(puyo1, puyo2) {
    const { boardData: data } = this.state;
    return Chainsim.checkIfValidLoc(puyo1)
      && Chainsim.checkIfValidLoc(puyo2)
      && data[puyo1.y][puyo1.x].puyoColor === 0
      && data[puyo2.y][puyo2.x].puyoColor === 0
      && puyo2.y > 0; // forbid rotating axis puyo into 14th row
  }

  puyoLockFunctions() {
    if (this.controller.locked) return;
    const {
      currPuyo1: puyo1,
      currPuyo2: puyo2,
    } = this.state;
    const lowestPosition1 = this.findLowestPosition(puyo1.x);
    const lowestPosition2 = this.findLowestPosition(puyo2.x);
    const atLowestPosition1 = puyo1.y === lowestPosition1;
    const atLowestPosition2 = puyo2.y === lowestPosition2;
    // check if puyo still at lowest pos
    if (!atLowestPosition1 && !atLowestPosition2) {
      return;
    }
    this.controller.locked = true;
    console.log('dropped, score: ' + this.score);
    const placedPuyo1 = { ...puyo1 };
    const placedPuyo2 = { ...puyo2 };
    if (puyo1.x !== puyo2.x) {
      if (!atLowestPosition1) {
        placedPuyo1.y = lowestPosition1;
      } else if (!atLowestPosition2) {
        placedPuyo2.y = lowestPosition2;
      }
    }
    const { boardData: data } = this.state;
    data[placedPuyo1.y][placedPuyo1.x].puyoColor = placedPuyo1.puyoColor;
    data[placedPuyo2.y][placedPuyo2.x].puyoColor = placedPuyo2.puyoColor;
    this.setState({
      boardData: data,
      currPuyo1: { x: -1, y: -1 },
      currPuyo2: { x: -1, y: -1 },
    });
    // delay between piece place and chain/next piece
    setTimeout(() => { this.handleChain(placedPuyo1, placedPuyo2); }, 500);
  }

  handleChain(placedPuyo1, placedPuyo2) {
    const poppedDroppedScore = this.chainsim.placePuyo(placedPuyo1, placedPuyo2);
    if (poppedDroppedScore.length > 0) {
      const chainScore = poppedDroppedScore.reduce((acc, cur) => acc + cur.score, 0);
      this.score += chainScore;
      console.log(poppedDroppedScore.length + '-chain: ' + chainScore + ', score: ' + this.score);
    }
    if (this.chainsim.board[axisSpawnY][axisSpawnX] !== 0) {
      this.handleDeath();
      return;
    }
    const { boardData: data } = this.state;
    this.setState({
      boardData: data.map((row, i) => row.map((puyo, j) => ({
        ...puyo,
        puyoColor: this.chainsim.board[i][j],
      }))),
    });
    if (this.checkAllClear()) {
      this.score += 30 * garbageRate;
      console.log('All Clear!, score: ' + this.score);
    }
    this.spawnPuyo();
  }

  checkAllClear() {
    const { boardData: data } = this.state;
    // exclude 14th row from all clear check
    return data.slice(1).every((row) => row.every((puyo) => puyo.puyoColor === 0));
  }

  handleDeath() {
    this.chainsim = new Chainsim();
    this.score = 0;
    this.setState({ boardData: Board.createEmptyArray() });
    this.spawnPuyo();
  }

  spawnPuyo() {
    this.setState({
      currPuyo1: { x: axisSpawnX, y: axisSpawnY - 1, puyoColor: Board.randomColor() },
      currPuyo2: { x: axisSpawnX, y: axisSpawnY, puyoColor: Board.randomColor() }, // axis puyo
    });
    this.failedRotate = false;
    this.controller.locked = false;
  }

  findLowestPosition(col) {
    const { boardData: data } = this.state;
    for (let i = height - 1; i >= 0; i--) {
      if (data[i][col].puyoColor === 0) {
        return i;
      }
    }
    return -1;
  }

  tryMove(puyo1, puyo2, delay, dropped) {
    if (this.checkIfLegalMove(puyo1, puyo2)) {
      this.setState({ currPuyo1: puyo1, currPuyo2: puyo2 });
      if (dropped) {
        this.score++;
      }
      if (
        puyo1.y === this.findLowestPosition(puyo1.x)
        || puyo2.y === this.findLowestPosition(puyo2.x)
      ) {
        this.lockTimer = setTimeout(this.puyoLockFunctions.bind(this), delay);
        if (dropped) {
          this.score++;
        }
      } else {
        clearTimeout(this.lockTimer);
      }
      return true;
    }
    return false;
  }

  // move relatively
  moveCurrPuyo(dx, dy) {
    const { currPuyo1, currPuyo2 } = this.state;
    const newPuyo1 = { ...currPuyo1 };
    newPuyo1.x += dx;
    newPuyo1.y += dy;
    const newPuyo2 = { ...currPuyo2 };
    newPuyo2.x += dx;
    newPuyo2.y += dy;
    this.tryMove(newPuyo1, newPuyo2, dy === 1 ? 0 : 500, dy === 1);
  }

  rotatePuyo(direction) {
    const delay = 500;
    const { currPuyo1, currPuyo2 } = this.state;
    const dx = -direction * (currPuyo1.y - currPuyo2.y);
    const dy = direction * (currPuyo1.x - currPuyo2.x);
    const newPuyo1 = { x: currPuyo2.x + dx, y: currPuyo2.y + dy, puyoColor: currPuyo1.puyoColor };
    if (!this.tryMove(newPuyo1, currPuyo2, delay, false)) {
      // kick
      newPuyo1.x -= dx;
      newPuyo1.y -= dy;
      const newPuyo2 = { ...currPuyo2 };
      newPuyo2.x -= dx;
      newPuyo2.y -= dy;
      if (!this.tryMove(newPuyo1, newPuyo2, delay, false) && currPuyo1.x === currPuyo2.x) {
        // quick turn
        if (this.failedRotate) {
          this.tryMove(newPuyo1, { ...currPuyo1, puyoColor: currPuyo2.puyoColor }, delay);
          this.failedRotate = false;
        } else {
          this.failedRotate = true;
        }
      }
    }
  }

  matchCurrPuyo(x, y, noMatch) {
    const { currPuyo1, currPuyo2 } = this.state;
    if (x === currPuyo1.x && y === currPuyo1.y) {
      return currPuyo1;
    }
    if (x === currPuyo2.x && y === currPuyo2.y) {
      return currPuyo2;
    }
    return noMatch;
  }

  renderBoard() {
    const { boardData: data } = this.state;
    return data.map((datarow, y) => datarow.map((dataitem, x) => (
      <div key={dataitem.x * datarow.length + dataitem.y}>
        <Cell
          value={this.matchCurrPuyo(x, y, dataitem)}
          active={this.matchCurrPuyo(x, y, dataitem) !== dataitem}
        />
        { (datarow[datarow.length - 1] === dataitem) ? <div className="clear" /> : '' }
      </div>
    )));
  }

  render() {
    return (
      <div className="board">
        { this.renderBoard() }
      </div>
    );
  }
}

export default Board;
