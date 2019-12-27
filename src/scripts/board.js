import React from 'react';
import Cell from './cell.js';
import Chainsim from './chainsim.js';
import Controller from './controller.js';
import Sequence from './sequence.js';

class Board extends React.Component {
  static locsEqual(loc1, loc2) {
    return loc1.x === loc2.x && loc1.y === loc2.y;
  }

  static matchPuyo(puyo, puyoList) {
    const match = puyoList.find((p) => Board.locsEqual(puyo, p));
    if (match) {
      return { match, found: true };
    }
    return { match: puyo, found: false };
  }

  constructor(props) {
    super(props);
    // state:
    //   boardData (elems have x, y, color)
    //     color: none, red, green, blue, yellow, purple
    //   currPuyo1 { x, y, color }
    //   currPuyo2 (axis puyo)
    //   currState: none, active, offset, falling
    //   score
    //   nextColors1 { color1, color2 }
    //   nextColors2
    this.height = 14;
    this.width = 6;
    this.axisSpawnX = 2;
    this.axisSpawnY = 2; // spawn axis puyo in 12th row
    this.garbageRate = 70;

    this.gravityOn = true;
    this.gravityTimeout = null;
    this.rowsHeldDownIn = new Set();
    this.createTiming();
    const pixelsPerCell = 16.0;
    this.splitPuyo = {
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
    Object.assign(data[y][x], { color: 'none', state: 'none' });
    Object.assign(data[y + distance][x], { color, state: 'fell' });
    this.setState({ boardData: data, currState: 'none' });
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
    // clear timeouts
    for (let id = window.setTimeout(() => {}, 0); id >= 0; id--) {
      window.clearTimeout(id);
    }
    // state: none, landed, offset, blinked, falling, ghost, fell (from splitting or chaining)
    const data = Array.from({ length: this.height }, (_, y) => (
      Array.from({ length: this.width }, (_, x) => ({
        x,
        y,
        color: 'none',
        state: 'none',
      }))
    ));
    const numSeq = 65536;
    this.sequence = new Sequence(Math.floor(Math.random() * numSeq));
    clearTimeout(this.gravityTimeout);
    const state = {
      boardData: data,
      currState: 'none',
      score: 0,
      nextColors1: this.sequence.getColors(),
      nextColors2: this.sequence.getColors(),
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
      reset: { f: () => { that.reset.bind(that)(true); }, delay: 0, repeat: 0 },
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
      Escape: 'reset',
    };
    this.controller = new Controller(controls, keys);
  }

  spawnPuyo() {
    this.setState(({ nextColors1, nextColors2 }) => ({
      currPuyo1: { x: this.axisSpawnX, y: this.axisSpawnY - 1, color: nextColors1.color1 },
      currPuyo2: { x: this.axisSpawnX, y: this.axisSpawnY, color: nextColors1.color2 },
      currState: 'offset',
      nextColors1: nextColors2,
      nextColors2: this.sequence.getColors(),
    }));
    this.lockTimeout = null;
    this.failedRotate = false;
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
    const { currPuyo1, currPuyo2, currState } = this.state;
    if (currState === 'none' || currState === 'falling' || !this.gravityOn) return;
    const atLowestPosition = this.atLowestPosition(currPuyo1, currPuyo2);
    if (currState === 'offset') {
      this.setState({ currState: 'active' });
      if (atLowestPosition) {
        this.startLockTimeout();
      }
    } else if (!atLowestPosition) {
      currPuyo1.y++;
      currPuyo2.y++;
      this.setState({ currPuyo1, currPuyo2, currState: 'offset' });
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
    return this.chainsim.checkIfValidLoc(puyo1)
      && this.chainsim.checkIfValidLoc(puyo2)
      && data[puyo1.y][puyo1.x].color === 'none'
      && data[puyo2.y][puyo2.x].color === 'none'
      && puyo2.y > 0; // forbid rotating axis puyo into 14th row
  }

  puyoLockFunctions() {
    const {
      boardData: data,
      currPuyo1: puyo1,
      currPuyo2: puyo2,
      currState,
    } = this.state;
    if (currState !== 'active') {
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
    this.chainsim.placePuyo(placedPuyo1, placedPuyo2);
    if (state1 === 'falling' || state2 === 'falling') {
      this.setState({ boardData: data, currState: 'falling' });
    } else {
      this.setState({ boardData: data, currState: 'none' });
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
      if (this.chainsim.board[this.axisSpawnY][this.axisSpawnX] !== 0) {
        this.handleDeath();
        return;
      }
      if (this.checkAllClear()) {
        this.setState(({ score }) => ({ score: score + 30 * this.garbageRate }));
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
      Object.assign(data[y][x], { color: 'none', state: 'none' });
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
          Object.assign(puyo, { color: 'none', state: 'none' });
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
    return data.slice(1).every((row) => row.every((puyo) => puyo.color === 'none'));
  }

  handleDeath() {
    this.reset(true);
  }

  findLowestPosition(col) {
    const { boardData: data } = this.state;
    for (let i = this.height - 1; i >= 0; i--) {
      if (data[i][col].color === 'none') {
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
      const { currState } = this.state;
      if (this.atLowestPosition(puyo1, puyo2) && currState === 'active') {
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
    const { currPuyo1, currPuyo2, currState } = this.state;
    if (currState !== 'active' && currState !== 'offset') return;
    const newPuyo1 = { ...currPuyo1 };
    newPuyo1.x += dx;
    const newPuyo2 = { ...currPuyo2 };
    newPuyo2.x += dx;
    this.tryMove(newPuyo1, newPuyo2);
  }

  moveDown() {
    const { currPuyo1, currPuyo2, currState } = this.state;
    if (currState !== 'active' && currState !== 'offset') return;
    if (!this.rowsHeldDownIn.has(currPuyo2.y)) {
      this.setState(({ score }) => ({ score: score + 1 }));
      this.rowsHeldDownIn.add(currPuyo2.y);
    }
    if (this.atLowestPosition(currPuyo1, currPuyo2)) {
      if (currState === 'offset') {
        this.setState({ currState: 'active' });
      }
      this.setState(({ score }) => ({ score: score + 1 }));
      this.puyoLockFunctions();
    } else if (currState === 'offset') {
      this.setState({ currState: 'active' });
    } else {
      currPuyo1.y++;
      currPuyo2.y++;
      this.setState({ currPuyo1, currPuyo2, currState: 'offset' });
    }
  }

  rotatePuyo(direction) {
    const { currPuyo1, currPuyo2, currState } = this.state;
    if (currState !== 'active' && currState !== 'offset') return;
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

  renderSplit() {
    const {
      velocity: v0,
      acceleration: a,
      onAnimationEnd,
      distance: d,
      color,
    } = this.splitPuyo;
    const v = Math.sqrt(v0 * v0 + 2 * a * d);
    return (
      <Cell
        classList={[color, 'falling']}
        style={{
          '--d': d,
          '--t': (2.0 * d) / (v + v0) / this.timing.framesPerSec,
          '--y': v0 / 3.0,
        }}
        onAnimationEnd={onAnimationEnd}
      />
    );
  }

  renderCell(dataitem) {
    // what is this cell doing?
    const { currPuyo1, currPuyo2, currState } = this.state;
    // is it falling?
    if (currState === 'falling' && Board.locsEqual(this.splitPuyo, dataitem)) {
      return this.renderSplit();
    }
    // is it hidden?
    if (dataitem.y < 2) {
      return <Cell classList={['none']} />;
    }
    // do we know for certain it's nothing?
    if (currState === 'none' || currState === 'falling') {
      return <Cell classList={[dataitem.color, dataitem.state]} />;
    }
    // is it active?
    const { match: currPuyo, found: isActive } = Board.matchPuyo(dataitem, [currPuyo1, currPuyo2]);
    if (isActive) {
      return <Cell classList={[currPuyo.color, currPuyo.state, currState]} />;
    }
    // is it a ghost?
    const ghostPuyo1 = { ...currPuyo1, y: this.findLowestPosition(currPuyo1.x) };
    const ghostPuyo2 = { ...currPuyo2, y: this.findLowestPosition(currPuyo2.x) };
    // if ghost puyo overlap, stack them
    if (currPuyo1.x === currPuyo2.x) {
      if (currPuyo1.y < currPuyo2.y) {
        ghostPuyo1.y--;
      } else {
        ghostPuyo2.y--;
      }
    }
    const { match, found } = Board.matchPuyo(dataitem, [ghostPuyo1, ghostPuyo2]);
    if (found) {
      return <Cell classList={[match.color, 'ghost']} />;
    }
    // now it must be nothing
    return <Cell classList={[dataitem.color, dataitem.state]} />;
  }

  renderBoard() {
    const { boardData: data, nextColors1, nextColors2 } = this.state;
    return data.map((datarow) => datarow.map((dataitem) => (
      <div key={dataitem.x * datarow.length + dataitem.y}>
        { this.renderCell(dataitem) }
        { dataitem.x === datarow.length - 1 && (
          <>
            { (() => {
              switch (dataitem.y) {
                case 2: return <Cell classList={[nextColors1.color1]} />;
                case 3: return <Cell classList={[nextColors1.color2]} />;
                case 5: return <Cell classList={[nextColors2.color1]} />;
                case 6: return <Cell classList={[nextColors2.color2]} />;
                default: return null;
              }
            })() }
            <div className="clear" />
          </>
        ) }
      </div>
    )));
  }

  render() {
    const { score } = this.state;
    return (
      <div>
        <div className="board">
          { this.renderBoard() }
        </div>
        <div id="score">
          <h1>{ score }</h1>
        </div>
      </div>
    );
  }
}

export default Board;
