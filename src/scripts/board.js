import React from 'react';
import Cell from './cell.js';
import Chainsim from './chainsim.js';
import Controller from './controller.js';
import Sequence from './sequence.js';
import {
  locsEqual,
  findLocInList,
  random,
  sample,
} from './utils.js';

class Board extends React.Component {
  constructor(props) {
    super(props);
    // state:
    //   boardData (elems have x, y, color)
    //     color: none, red, green, blue, yellow, purple
    //   currPuyo1 { x, y, color }
    //   currPuyo2 (axis puyo)
    //   currState: none, active, offset
    //   score
    //   nextColors1 { color1, color2 }
    //   nextColors2
    //   splitPuyo
    //   garbageCount
    //   garbagePuyoList
    this.twelfthRow = 8; // leave space to spawn garbage
    this.height = 12 + this.twelfthRow;
    this.width = 6;
    this.axisSpawnX = 2;
    this.axisSpawnY = this.twelfthRow; // spawn axis puyo in 12th row
    this.garbageRate = 70;
    this.rockGarbage = 30;

    this.gravityOn = true;
    this.gravityTimeout = null;
    this.rowsHeldDownIn = new Set();
    this.createTiming();
    this.createController();
    this.reset(false);
  }

  onFallingAnimationEnd() {
    const { boardData: data, splitPuyo } = this.state;
    const {
      x,
      y,
      color,
      distance,
    } = splitPuyo;
    Object.assign(data[y][x], { color: 'none', state: 'none' });
    Object.assign(data[y + distance][x], { color, state: 'fell' });
    this.setState({ boardData: data, currState: 'none', splitPuyo: null });
    const delay = this.timing.startChainDelay + this.timing.fallenPuyoDelay;
    setTimeout(() => { this.handleLink(); }, delay);
  }

  onGarbageAnimationEnd(garbage) {
    const { boardData: data } = this.state;
    const { x, y, distance: d } = garbage;
    Object.assign(data[y][x], { color: 'none', state: 'none' });
    // don't add garbage to 14th row
    if (y + d >= this.twelfthRow - 1) {
      Object.assign(data[y + d][x], { color: 'gray', state: 'none' });
    }
    this.garbageFallingCount--;
    // don't rerender until end
    if (this.garbageFallingCount === 0) {
      this.setState({ garbagePuyoList: [] });
      setTimeout(() => { this.spawnPuyo(); },
        this.timing.pieceSpawnDelay + this.timing.fallenPuyoDelay);
    }
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
    this.sequence = new Sequence(random(numSeq));
    clearTimeout(this.gravityTimeout);
    const state = {
      boardData: data,
      currState: 'none',
      score: 0,
      nextColors1: this.sequence.getColors(),
      nextColors2: this.sequence.getColors(),
      splitPuyo: null,
      garbageCount: 0,
      garbagePuyoList: [],
    };
    if (isMounted) {
      this.setState(state);
    } else {
      this.state = state;
    }
    this.chainsim = new Chainsim(this.twelfthRow);
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
      garbage: { f: () => { that.addGarbage.bind(that)(5); }, delay: 0, repeat: 0 },
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
      t: 'garbage',
    };
    this.controller = new Controller(controls, keys);
  }

  addGarbage(num) {
    this.setState(({ garbageCount }) => ({ garbageCount: garbageCount + num }));
  }

  spawnPuyo() {
    const { boardData: data } = this.state;
    if (data[this.axisSpawnY][this.axisSpawnX].color !== 'none') {
      this.handleDeath();
      return;
    }
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
    if ((currState !== 'active' && currState !== 'offset') || !this.gravityOn) return;
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
      && puyo2.y >= this.twelfthRow - 1; // forbid rotating axis puyo into 14th row
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
    let splitPuyo;
    if (puyo1.x !== puyo2.x) {
      if (!atLowestPosition1) {
        splitPuyo = { ...puyo1, distance: lowestPosition1 - puyo1.y };
        placedPuyo1.y = lowestPosition1;
        state1 = 'falling';
      } else if (!atLowestPosition2) {
        splitPuyo = { ...puyo2, distance: lowestPosition2 - puyo2.y };
        placedPuyo2.y = lowestPosition2;
        state2 = 'falling';
      }
    }
    Object.assign(data[puyo1.y][puyo1.x], { color: puyo1.color, state: state1 });
    Object.assign(data[puyo2.y][puyo2.x], { color: puyo2.color, state: state2 });
    this.chainsim.placePuyo(placedPuyo1, placedPuyo2);
    if (state1 === 'falling' || state2 === 'falling') {
      this.setState({ boardData: data, currState: 'none', splitPuyo });
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
      if (this.checkAllClear()) {
        this.setState(({ score }) => ({ score: score + this.rockGarbage * this.garbageRate }));
      }
      this.handleGarbage();
    }
  }

  handleGarbage() {
    const { garbageCount } = this.state;
    if (garbageCount > 0) {
      const garbage = Math.min(garbageCount, this.rockGarbage);
      // garbage starts at 16th row
      const garbageSpawnRow = this.twelfthRow - 4;
      const distances = (
        Array.from({ length: this.width }, (_, x) => this.findLowestPosition(x) - garbageSpawnRow)
      );
      const fullRows = Math.floor(garbage / this.width);
      const garbagePuyoList = Array.from({ length: this.width }, (_, x) => (
        Array.from({ length: fullRows }, (_, y) => ({
          x,
          y: garbageSpawnRow - y,
          distance: distances[x],
        }))
      )).flat();
      garbagePuyoList.push(...sample(this.width, garbage % this.width).map((x) => ({
        x,
        y: garbageSpawnRow - fullRows,
        distance: distances[x],
      })));
      this.chainsim.addGarbage(garbagePuyoList);
      this.garbageFallingCount = garbage;
      this.setState((state) => ({ garbageCount: state.garbageCount - garbage, garbagePuyoList }));
    } else {
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
    return data.every((row, y) => y < this.twelfthRow - 1
      || row.every((puyo) => puyo.color === 'none'));
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

  renderFallingPuyo(puyo) {
    const {
      velocity: v0Pixels,
      acceleration: aPixels,
      onAnimationEnd,
      distance: d,
      color,
    } = puyo;
    const pixelsPerCell = 16;
    const v0 = v0Pixels / pixelsPerCell;
    const a = aPixels / pixelsPerCell;
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
    const {
      currPuyo1,
      currPuyo2,
      currState,
      splitPuyo,
      garbagePuyoList,
    } = this.state;
    // is it falling?
    if (splitPuyo && locsEqual(splitPuyo, dataitem)) {
      const { distance, color } = splitPuyo;
      return this.renderFallingPuyo({
        velocity: 1.0,
        acceleration: 3.0 / 16,
        onAnimationEnd: this.onFallingAnimationEnd.bind(this),
        distance,
        color,
      });
    }
    // is it garbage?
    const { match: garbage, found: isGarbage } = findLocInList(dataitem, garbagePuyoList);
    if (isGarbage) {
      return this.renderFallingPuyo({
        velocity: 0.0,
        acceleration: (() => {
          switch (garbage.x) {
            case 0: return 36.0 / 256;
            case 1: return 38.0 / 256;
            case 2: return 32.0 / 256;
            case 3: return 42.0 / 256;
            case 4: return 34.0 / 256;
            case 5: return 40.0 / 256;
            default: throw new Error('bad x value');
          }
        })(),
        onAnimationEnd: () => { this.onGarbageAnimationEnd.bind(this)(garbage); },
        distance: garbage.distance,
        color: 'gray',
      });
    }
    // is it hidden?
    if (dataitem.y < this.twelfthRow) {
      return <Cell classList={['none']} />;
    }
    // do we know for certain it's nothing?
    if (currState === 'none') {
      return <Cell classList={[dataitem.color, dataitem.state]} />;
    }
    // is it active?
    const { match: currPuyo, found: isActive } = findLocInList(dataitem, [currPuyo1, currPuyo2]);
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
    const { match, found } = findLocInList(dataitem, [ghostPuyo1, ghostPuyo2]);
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
              switch (dataitem.y - this.twelfthRow) {
                case 0: return <Cell classList={[nextColors1.color1]} />;
                case 1: return <Cell classList={[nextColors1.color2]} />;
                case 3: return <Cell classList={[nextColors2.color1]} />;
                case 4: return <Cell classList={[nextColors2.color2]} />;
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
    const { score, garbageCount } = this.state;
    return (
      <>
        <div id="garbage">
          <h2>{ garbageCount }</h2>
        </div>
        <div className="board" style={{ '--invisible-rows-count': this.twelfthRow }}>
          { this.renderBoard() }
        </div>
        <div id="score">
          <h1>{ score }</h1>
        </div>
      </>
    );
  }
}

export default Board;
