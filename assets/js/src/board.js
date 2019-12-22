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
  static randomColor() {
    return Math.floor(Math.random() * puyoColorCount) + 1;
  }

  constructor(props) {
    super(props);
    // state:
    //   boardData (elems have x, y, puyoColor)
    //   currPuyo1 (x, y, puyoColor)
    //   currPuyo2 (axis puyo)
    //   isOffset  (currPuyo offset half space up)
    this.createController();
    this.reset(false);
  }

  reset(isMounted) {
    const data = Array.from({ length: height }, (_, y) => Array.from({ length: width }, (_, x) => (
      { x, y, puyoColor: 0 }
    )));
    if (isMounted) {
      this.setState({ boardData: data });
    } else {
      this.state = { boardData: data };
    }
    this.chainsim = new Chainsim();
    this.score = 0;
    this.spawnPuyo(isMounted);
  }

  createController() {
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
  }

  spawnPuyo(isMounted) {
    const state = {
      currPuyo1: { x: axisSpawnX, y: axisSpawnY - 1, puyoColor: Board.randomColor() },
      currPuyo2: { x: axisSpawnX, y: axisSpawnY, puyoColor: Board.randomColor() },
      isOffset: true,
    };
    if (isMounted) {
      this.setState(state);
    } else {
      this.state = { ...this.state, ...state };
    }
    this.lockTimer = null;
    this.failedRotate = false;
    this.controller.locked = false;
    console.log('score: ' + this.score);
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
      boardData: data,
      currPuyo1: puyo1,
      currPuyo2: puyo2,
      isOffset,
    } = this.state;
    if (isOffset) {
      return;
    }
    const lowestPosition1 = this.findLowestPosition(puyo1.x);
    const lowestPosition2 = this.findLowestPosition(puyo2.x);
    const atLowestPosition1 = puyo1.y === lowestPosition1;
    const atLowestPosition2 = puyo2.y === lowestPosition2;
    // check if puyo still at lowest pos
    if (!atLowestPosition1 && !atLowestPosition2) {
      return;
    }
    this.controller.locked = true;
    const placedPuyo1 = { ...puyo1 };
    const placedPuyo2 = { ...puyo2 };
    if (puyo1.x !== puyo2.x) {
      if (!atLowestPosition1) {
        placedPuyo1.y = lowestPosition1;
      } else if (!atLowestPosition2) {
        placedPuyo2.y = lowestPosition2;
      }
    }
    data[placedPuyo1.y][placedPuyo1.x].puyoColor = placedPuyo1.puyoColor;
    data[placedPuyo2.y][placedPuyo2.x].puyoColor = placedPuyo2.puyoColor;
    this.setState({
      boardData: data,
      currPuyo1: { x: -1, y: -1 },
      currPuyo2: { x: -1, y: -1 },
    });
    this.chainsim.placePuyo(placedPuyo1, placedPuyo2);
    // delay between piece place and chain/next piece
    setTimeout(() => { this.handleLink(); }, 500);
  }

  handleLink() {
    const poppedDroppedScore = this.chainsim.computeLink();
    if (poppedDroppedScore) {
      const { popped, dropped, score } = poppedDroppedScore;
      this.pop(popped);
      this.drop(dropped);
      this.score += score;
      setTimeout(() => { this.handleLink(); }, 500);
    } else {
      if (this.chainsim.board[axisSpawnY][axisSpawnX] !== 0) {
        this.handleDeath();
        return;
      }
      if (this.checkAllClear()) {
        this.score += 30 * garbageRate;
        console.log('All Clear!');
      }
      this.spawnPuyo(true);
    }
  }

  pop(popped) {
    const { boardData: data } = this.state;
    for (const { x, y } of popped) {
      data[y][x].puyoColor = 0;
    }
    this.setState({ boardData: data });
  }

  drop(dropped) {
    const { boardData: data } = this.state;
    for (const { puyo: { x, y }, dist } of dropped) {
      data[y + dist][x].puyoColor = data[y][x].puyoColor;
      data[y][x].puyoColor = 0;
    }
    this.setState({ boardData: data });
  }

  checkAllClear() {
    const { boardData: data } = this.state;
    // exclude 14th row from all clear check
    return data.slice(1).every((row) => row.every((puyo) => puyo.puyoColor === 0));
  }

  handleDeath() {
    this.reset(true);
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

  tryMove(puyo1, puyo2) {
    if (this.checkIfLegalMove(puyo1, puyo2)) {
      this.setState({ currPuyo1: puyo1, currPuyo2: puyo2 });
      const isLow1 = puyo1.y === this.findLowestPosition(puyo1.x);
      const isLow2 = puyo2.y === this.findLowestPosition(puyo2.x);
      const { isOffset } = this.state;
      if ((isLow1 || isLow2) && !isOffset) {
        this.lockTimer = setTimeout(this.puyoLockFunctions.bind(this), 500);
      } else {
        clearTimeout(this.lockTimer);
      }
      return true;
    }
    return false;
  }

  // move relatively
  moveCurrPuyo(dx, dy) {
    if (this.controller.locked) return;
    const { currPuyo1, currPuyo2, isOffset } = this.state;
    const newPuyo1 = { ...currPuyo1 };
    newPuyo1.x += dx;
    newPuyo1.y += dy;
    const newPuyo2 = { ...currPuyo2 };
    newPuyo2.x += dx;
    newPuyo2.y += dy;
    const didMove = this.tryMove(newPuyo1, newPuyo2);
    if (dy === 1) {
      // pressed down
      if (didMove) {
        this.score++;
      } else {
        if (isOffset) {
          this.setState({ isOffset: false });
          this.score++;
        }
        this.score++;
        this.puyoLockFunctions();
      }
    }
  }

  rotatePuyo(direction) {
    if (this.controller.locked) return;
    const { currPuyo1, currPuyo2 } = this.state;
    const dx = -direction * (currPuyo1.y - currPuyo2.y);
    const dy = direction * (currPuyo1.x - currPuyo2.x);
    const newPuyo1 = { ...currPuyo2 };
    newPuyo1.x += dx;
    newPuyo1.y += dy;
    newPuyo1.puyoColor = currPuyo1.puyoColor;
    if (!this.tryMove(newPuyo1, currPuyo2)) {
      // kick
      newPuyo1.x -= dx;
      newPuyo1.y -= dy;
      const newPuyo2 = { ...currPuyo2 };
      newPuyo2.x -= dx;
      newPuyo2.y -= dy;
      if (!this.tryMove(newPuyo1, newPuyo2) && currPuyo1.x === currPuyo2.x) {
        // quick turn
        if (this.failedRotate) {
          this.tryMove(newPuyo1, { ...currPuyo1, puyoColor: currPuyo2.puyoColor });
          this.failedRotate = false;
        } else {
          this.failedRotate = true;
        }
      }
    }
  }

  renderBoard() {
    const {
      boardData: data,
      currPuyo1,
      currPuyo2,
      isOffset,
    } = this.state;
    return data.map((datarow) => datarow.map((dataitem) => (
      <div key={dataitem.x * datarow.length + dataitem.y}>
        <Cell {...{
          dataitem,
          currPuyo1,
          currPuyo2,
          isOffset,
        }}
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
