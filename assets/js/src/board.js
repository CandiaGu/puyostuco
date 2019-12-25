import Cell from './cell.js';
import Chainsim from './chainsim.js';
import Controller from './controller.js';

const colorCount = 4;
const height = 14;
const width = 6;
const axisSpawnX = 2;
const axisSpawnY = 2; // spawn axis puyo in 12th row
const garbageRate = 70;

class Board extends React.Component {
  static randomColor() {
    return Math.floor(Math.random() * colorCount) + 1;
  }

  constructor(props) {
    super(props);
    // state:
    //   boardData (elems have x, y, color)
    //   currPuyo1 { x, y, color }
    //   currPuyo2 (axis puyo)
    //   isOffset  (currPuyo offset half space up)
    //   score
    //   nextColors1 { color1, color2 }
    //   nextColors2
    this.gravityOn = true;
    this.gravityTimeout = null;
    this.rowsHeldDownIn = new Set();
    this.createTiming();
    const pixelsPerCell = 16.0;
    this.splitPuyo = {
      x: -1,
      velocity: 1 / pixelsPerCell,
      acceleration: 3.0 / 16 / pixelsPerCell,
      onAnimationEnd: this.onAnimationEnd.bind(this),
    };
    this.createController();
    this.reset(false);
  }

  onAnimationEnd() {
    const { boardData: data } = this.state;
    const {
      x,
      y,
      color,
      distance,
    } = this.splitPuyo;
    Object.assign(data[y][x], { color: 0, state: 'none' });
    Object.assign(data[y + distance][x], { color, state: 'fell' });
    this.setState({ boardData: data });
    this.splitPuyo.x = -1;
    const delay = this.timing.startChainDelay + this.timing.fallenPuyoDelay;
    setTimeout(() => { this.handleLink(); }, delay);
  }

  createTiming() {
    const framesPerSec = 60.0;
    const msPerSec = 1000.0;
    const msPerFrame = msPerSec / framesPerSec;
    this.timing = {
      framesPerSec,
      leftRightDelay: 10 * msPerFrame,
      leftRightRepeat: 2 * msPerFrame,
      downRepeat: 1 * msPerFrame,
      gravityRepeat: 13 * msPerFrame,
      lockDelay: 31 * msPerFrame,
      pieceSpawnDelay: 10 * msPerFrame,
      fallenPuyoDelay: 6 * msPerFrame,
      startChainDelay: 16 * msPerFrame,
      startPopDelay: 7 * msPerFrame,
      blinkRepeat: 2 * msPerFrame,
      startDropDelay: 47 * msPerFrame,
      dropRepeat: 1 * msPerFrame,
      nextLinkDelay: 24 * msPerFrame,
    };
  }

  reset(isMounted) {
    // state: none, landed, offset, blinked, falling, fell (from splitting or chaining)
    const data = Array.from({ length: height }, (_, y) => Array.from({ length: width }, (_, x) => ({
      x,
      y,
      color: 0,
      state: 'none',
    })));
    const state = {
      boardData: data,
      currPuyo1: { x: -1, y: -1 },
      currPuyo2: { x: -1, y: -1 },
      isOffset: false,
      score: 0,
      nextColors1: { color1: Board.randomColor(), color2: Board.randomColor() },
      nextColors2: { color1: Board.randomColor(), color2: Board.randomColor() },
    };
    if (isMounted) {
      this.setState(state);
    } else {
      this.state = state;
    }
    this.chainsim = new Chainsim();
    setTimeout(() => { this.spawnPuyo(); }, this.timing.pieceSpawnDelay);
  }

  createController() {
    const that = this;
    const controls = {
      left: {
        f: () => { that.moveLeftRight.bind(that)(-1); },
        delay: this.timing.leftRightDelay,
        repeat: this.timing.leftRightRepeat,
      },
      right: {
        f: () => { that.moveLeftRight.bind(that)(1); },
        delay: this.timing.leftRightDelay,
        repeat: this.timing.leftRightRepeat,
      },
      down: { f: () => { that.moveDown.bind(that)(); }, delay: 0, repeat: this.timing.downRepeat },
      counterclockwise: { f: () => { that.rotatePuyo.bind(that)(-1); }, delay: 0, repeat: 0 },
      clockwise: { f: () => { that.rotatePuyo.bind(that)(1); }, delay: 0, repeat: 0 },
      gravity: { f: () => { that.toggleGravity.bind(that)(); }, delay: 0, repeat: 0 },
    };
    const keys = {
      ArrowLeft: 'left',
      ArrowRight: 'right',
      ArrowDown: 'down',
      z: 'counterclockwise',
      x: 'clockwise',
      d: 'counterclockwise',
      f: 'clockwise',
      g: 'gravity',
    };
    this.controller = new Controller(controls, keys);
  }

  spawnPuyo() {
    this.setState(({ nextColors1, nextColors2 }) => ({
      currPuyo1: { x: axisSpawnX, y: axisSpawnY - 1, color: nextColors1.color1 },
      currPuyo2: { x: axisSpawnX, y: axisSpawnY, color: nextColors1.color2 },
      isOffset: true,
      nextColors1: { color1: nextColors2.color1, color2: nextColors2.color2 },
      nextColors2: { color1: Board.randomColor(), color2: Board.randomColor() },
    }));
    this.lockTimeout = null;
    this.failedRotate = false;
    this.controller.locked = false;
    if (this.gravityOn) {
      this.gravityTimeout = setTimeout(() => { this.applyGravity(); }, this.timing.gravityRepeat);
    }
    this.rowsHeldDownIn.clear();
  }

  startLockTimeout() {
    if (!this.lockTimeout) {
      this.lockTimeout = setTimeout(this.puyoLockFunctions.bind(this), this.timing.lockDelay);
    }
  }

  applyGravity() {
    if (this.controller.locked || !this.gravityOn) return;
    const { currPuyo1, currPuyo2, isOffset } = this.state;
    const atLowestPosition = this.atLowestPosition(currPuyo1, currPuyo2);
    if (isOffset) {
      this.setState({ isOffset: false });
      if (atLowestPosition) {
        this.startLockTimeout();
      }
    } else if (!atLowestPosition) {
      currPuyo1.y++;
      currPuyo2.y++;
      this.setState({ currPuyo1, currPuyo2, isOffset: true });
    }
    this.gravityTimeout = setTimeout(() => { this.applyGravity(); }, this.timing.gravityRepeat);
  }

  toggleGravity() {
    if (this.gravityOn) {
      this.gravityOn = false;
      clearTimeout(this.gravityTimeout);
    } else {
      this.gravityOn = true;
      this.gravityTimeout = setTimeout(() => { this.applyGravity(); }, this.timing.gravityRepeat);
    }
  }

  checkIfLegalMove(puyo1, puyo2) {
    const { boardData: data } = this.state;
    return Chainsim.checkIfValidLoc(puyo1)
      && Chainsim.checkIfValidLoc(puyo2)
      && data[puyo1.y][puyo1.x].color === 0
      && data[puyo2.y][puyo2.x].color === 0
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
    clearInterval(this.gravityInterval);
    const placedPuyo1 = { ...puyo1 };
    const placedPuyo2 = { ...puyo2 };
    let state1 = 'landed';
    let state2 = 'landed';
    if (puyo1.x !== puyo2.x) {
      if (!atLowestPosition1) {
        Object.assign(this.splitPuyo, puyo1);
        this.splitPuyo.distance = lowestPosition1 - puyo1.y;
        placedPuyo1.y = lowestPosition1;
        state1 = 'falling';
      } else if (!atLowestPosition2) {
        Object.assign(this.splitPuyo, puyo2);
        this.splitPuyo.distance = lowestPosition2 - puyo2.y;
        placedPuyo2.y = lowestPosition2;
        state2 = 'falling';
      }
    }
    Object.assign(data[puyo1.y][puyo1.x], { color: puyo1.color, state: state1 });
    Object.assign(data[puyo2.y][puyo2.x], { color: puyo2.color, state: state2 });
    this.setState({
      boardData: data,
      currPuyo1: { x: -1, y: -1 },
      currPuyo2: { x: -1, y: -1 },
    });
    this.chainsim.placePuyo(placedPuyo1, placedPuyo2);
    if (this.splitPuyo.x === -1) {
      setTimeout(() => { this.handleLink(); }, this.timing.startChainDelay);
    }
  }

  handleLink() {
    const poppedDroppedScore = this.chainsim.computeLink();
    if (poppedDroppedScore) {
      const { popped, dropped, score: chainScore } = poppedDroppedScore;
      this.puyosToPop = popped;
      this.puyosToDrop = dropped;
      setTimeout(() => { this.blinkPopped(0, chainScore); }, this.timing.startPopDelay);
    } else {
      if (this.chainsim.board[axisSpawnY][axisSpawnX] !== 0) {
        this.handleDeath();
        return;
      }
      if (this.checkAllClear()) {
        this.setState(({ score }) => ({ score: score + 30 * garbageRate }));
        console.log('All Clear!');
      }
      setTimeout(() => { this.spawnPuyo(); }, this.timing.pieceSpawnDelay);
    }
  }

  blinkPopped(step, chainScore) {
    const { boardData: data } = this.state;
    for (const { x, y } of this.puyosToPop) {
      data[y][x].state = data[y][x].state === 'blinked' ? 'none' : 'blinked';
    }
    this.setState({ boardData: data });
    const blinks = 12;
    if (step === blinks) {
      setTimeout(() => {
        this.popPopped();
        this.setState(({ score }) => ({ score: score + chainScore }));
        this.dropDroppedHalfCell(0);
      }, this.timing.startDropDelay - blinks * this.timing.blinkRepeat);
    } else {
      setTimeout(() => { this.blinkPopped(step + 1, chainScore); }, this.timing.blinkRepeat);
    }
  }

  popPopped() {
    const { boardData: data } = this.state;
    for (const { x, y } of this.puyosToPop) {
      Object.assign(data[y][x], { color: 0, state: 'none' });
    }
    this.setState({ boardData: data });
  }

  dropDroppedHalfCell(step) {
    const { boardData: data } = this.state;
    let canDrop = false;
    this.puyosToDrop.forEach(({ puyo: { x, y }, dist }, i) => {
      if (dist > 0) {
        const puyo = data[y][x];
        if (step === 0) {
          Object.assign(data[y + 1][x], { color: puyo.color, state: 'offset' });
          Object.assign(puyo, { color: 0, state: 'none' });
          this.puyosToDrop[i].puyo.y++;
        } else {
          if (dist === 1) {
            puyo.state = 'fell';
          } else {
            puyo.state = 'none';
            canDrop = true;
          }
          this.puyosToDrop[i].dist--;
        }
      }
    });
    this.setState({ boardData: data });
    if (step === 0) {
      setTimeout(() => { this.dropDroppedHalfCell(1); }, this.timing.dropRepeat);
    } else if (canDrop) {
      setTimeout(() => { this.dropDroppedHalfCell(0); }, this.timing.dropRepeat);
    } else {
      let delay = this.timing.nextLinkDelay;
      if (this.puyosToDrop.length > 0) {
        delay += this.timing.fallenPuyoDelay;
      }
      setTimeout(() => { this.handleLink(); }, delay);
    }
  }

  checkAllClear() {
    const { boardData: data } = this.state;
    // exclude 14th row from all clear check
    return data.slice(1).every((row) => row.every((puyo) => puyo.color === 0));
  }

  handleDeath() {
    this.reset(true);
  }

  findLowestPosition(col) {
    const { boardData: data } = this.state;
    for (let i = height - 1; i >= 0; i--) {
      if (data[i][col].color === 0) {
        return i;
      }
    }
    return -1;
  }

  atLowestPosition(puyo1, puyo2) {
    return puyo1.y === this.findLowestPosition(puyo1.x)
      || puyo2.y === this.findLowestPosition(puyo2.x);
  }

  tryMove(puyo1, puyo2) {
    if (this.checkIfLegalMove(puyo1, puyo2)) {
      this.setState({ currPuyo1: puyo1, currPuyo2: puyo2 });
      const { isOffset } = this.state;
      if (this.atLowestPosition(puyo1, puyo2) && !isOffset) {
        this.startLockTimeout();
      } else {
        clearTimeout(this.lockTimeout);
        this.lockTimeout = null;
      }
      return true;
    }
    return false;
  }

  moveLeftRight(dx) {
    if (this.controller.locked) return;
    const { currPuyo1, currPuyo2 } = this.state;
    const newPuyo1 = { ...currPuyo1 };
    newPuyo1.x += dx;
    const newPuyo2 = { ...currPuyo2 };
    newPuyo2.x += dx;
    this.tryMove(newPuyo1, newPuyo2);
  }

  moveDown() {
    if (this.controller.locked) return;
    const { currPuyo1, currPuyo2, isOffset } = this.state;
    if (!this.rowsHeldDownIn.has(currPuyo2.y)) {
      this.setState(({ score }) => ({ score: score + 1 }));
      this.rowsHeldDownIn.add(currPuyo2.y);
    }
    if (this.atLowestPosition(currPuyo1, currPuyo2)) {
      if (isOffset) {
        this.setState({ isOffset: false });
      }
      this.setState(({ score }) => ({ score: score + 1 }));
      this.puyoLockFunctions();
    } else if (isOffset) {
      this.setState({ isOffset: false });
    } else {
      currPuyo1.y++;
      currPuyo2.y++;
      this.setState({ currPuyo1, currPuyo2, isOffset: true });
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
    newPuyo1.color = currPuyo1.color;
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
          this.tryMove(newPuyo1, { ...currPuyo1, color: currPuyo2.color });
          this.failedRotate = false;
        } else {
          this.failedRotate = true;
        }
      }
    }
  }

  renderCell(dataitem) {
    const { currPuyo1, currPuyo2, isOffset } = this.state;
    let puyo = dataitem;
    let isActive = true;
    if (dataitem.x === currPuyo1.x && dataitem.y === currPuyo1.y) {
      puyo = currPuyo1;
    } else if (dataitem.x === currPuyo2.x && dataitem.y === currPuyo2.y) {
      puyo = currPuyo2;
    } else {
      isActive = false;
    }
    const classList = [];
    if (isActive) {
      classList.push('active');
      if (isOffset) {
        classList.push('offset');
      }
    } else {
      classList.push(dataitem.state);
    }
    if (this.splitPuyo.x === puyo.x && this.splitPuyo.y === puyo.y) {
      classList.push('falling');
      const {
        velocity: v0,
        acceleration: a,
        onAnimationEnd,
        distance: d,
      } = this.splitPuyo;
      const v = Math.sqrt(v0 * v0 + 2 * a * d);
      return (
        <Cell {...{
          color: puyo.color,
          classList,
          style: {
            '--d': d,
            '--t': (2.0 * d) / (v + v0) / this.timing.framesPerSec,
            '--y': v0 / 3.0,
          },
          onAnimationEnd,
        }}
        />
      );
    }
    return <Cell {...{ color: puyo.color, classList }} />;
  }

  renderBoard() {
    const { boardData: data } = this.state;
    return data.map((datarow) => datarow.map((dataitem) => (
      <div key={dataitem.x * datarow.length + dataitem.y}>
        { this.renderCell(dataitem) }
        { dataitem.x === datarow.length - 1 && <div className="clear" /> }
      </div>
    )));
  }

  render() {
    const { score, nextColors1, nextColors2 } = this.state;
    return (
      <div className="board">
        <div id="preview">
          <Cell color={nextColors1.color1} classList={[]} />
          <Cell color={nextColors1.color2} classList={[]} />
          <Cell color={0} classList={[]} />
          <Cell color={nextColors2.color1} classList={[]} />
          <Cell color={nextColors2.color2} classList={[]} />
        </div>
        <div className="clear" />
        { this.renderBoard() }
        <div id="score">
          <h1>{ score }</h1>
        </div>
      </div>
    );
  }
}

export default Board;
