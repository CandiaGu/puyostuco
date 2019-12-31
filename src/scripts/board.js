import React from 'react';
import PropTypes from 'prop-types';
import Cell from './cell.js';
import Chainsim from './chainsim.js';
import Controller from './controller.js';
import Sequence from './sequence.js';
import {
  locsEqual,
  findLocInList,
  sample,
  deepClone,
  deepMerge,
  deepUpdateRef,
} from './utils.js';
import firebase from './firebase.js';

class Board extends React.Component {
  constructor(props) {
    super(props);
    const {
      keys,
      seed,
      sendGarbage,
      droppedGarbage,
    } = props;
    this.sendGarbage = sendGarbage;
    this.droppedGarbage = droppedGarbage;
    // state:
    //   boardData (elems have x, y, color)
    //     color: none, red, green, blue, yellow, purple, gray
    //   currPuyo1 { x, y, color }
    //   currPuyo2 (axis puyo)
    //   currState: none, active, offset
    //   score
    //   nextColors1 { color1, color2 }
    //   nextColors2
    //   splitPuyo
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
    this.leftRightLockTimeout = null;
    this.createTiming();
    this.createController(keys);
    this.recentLeftRight = 0;
    const boardData = Array.from({ length: this.height }, (_, y) => (
      Array.from({ length: this.width }, (_, x) => ({
        x,
        y,
        color: 'none',
        state: 'none', // none, landed, offset, blinked, falling, ghost, fell, exploding
      }))
    ));
    this.sequence = new Sequence(seed);
    this.state = {
      boardData,
      currPuyo1: null,
      currPuyo2: null,
      currState: 'none',
      score: 0,
      nextColors1: this.sequence.getColors(),
      nextColors2: this.sequence.getColors(),
      splitPuyo: null,
      garbagePuyoList: false,
    };
    this.chainsim = new Chainsim(this.twelfthRow);
    this.lastScoreCutoff = 0;
    this.online = false;
  }

  componentDidMount() {
    if (this.online) {
      this.refList = [];
      this.ref = {};
      this.initRef(this.ref, firebase.database().ref('user'), this.state, []);
    }
    setTimeout(() => { this.spawnPuyo(); }, this.timing.pieceSpawnDelay);
  }

  componentWillUnmount() {
    // clear timeouts
    for (let id = window.setTimeout(() => {}, 0); id >= 0; id--) {
      window.clearTimeout(id);
    }
    this.controller.release();
    if (this.online) {
      for (const ref of this.refList) {
        ref.off('value');
      }
    }
  }

  onFallingAnimationEnd() {
    const { splitPuyo } = this.state;
    const {
      x,
      y,
      color,
      distance,
    } = splitPuyo;
    this.update({
      boardData: {
        [y]: {
          [x]: {
            color: 'none',
            state: 'none',
          },
        },
        [y + distance]: {
          [x]: {
            color,
            state: 'fell',
          },
        },
      },
      currState: 'none',
      splitPuyo: false,
    });
    const delay = this.timing.startChainDelay + this.timing.fallenPuyoDelay;
    setTimeout(() => { this.handleLink(); }, delay);
  }

  onGarbageAnimationEnd(garbage) {
    const { x, y, distance: d } = garbage;
    this.update({ boardData: { [y]: { [x]: { color: 'none', state: 'none' } } } });
    // don't add garbage to 14th row
    if (y + d >= this.twelfthRow - 1) {
      this.update({ boardData: { [y + d]: { [x]: { color: 'gray', state: 'none' } } } });
    }
    this.garbageFallingCount--;
    // don't rerender until end
    if (this.garbageFallingCount === 0) {
      this.update({ garbagePuyoList: false });
      setTimeout(() => { this.spawnPuyo(); },
        this.timing.pieceSpawnDelay + this.timing.fallenPuyoDelay);
    }
  }

  initRef(refPtr, ref, state, keyList) {
    if (state && typeof state === 'object') {
      for (const [key, value] of Object.entries(state)) {
        refPtr[key] = {};
        refPtr[key] = this.initRef(refPtr[key], ref.child(key), value, keyList.concat([key]))
          || refPtr[key];
      }
    } else {
      this.refList.push(ref);
      ref.set(state);
      ref.on('value', (snapshot) => {
        const val = snapshot.val();
        this.setState((oldState) => {
          const newState = deepClone(oldState);
          let obj = newState;
          keyList.forEach((key, i) => {
            if (i < keyList.length - 1) {
              obj = obj[key];
            } else {
              obj[key] = val;
            }
          });
          return newState;
        });
      });
      return ref;
    }
    return null;
  }

  update(state) {
    if (this.online) {
      deepUpdateRef(this.ref, state);
    } else {
      this.setState((oldState) => deepMerge(oldState, state));
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
      leftRightLock: 2 * msPerFrame,
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

  createController(keys) {
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
    this.controller = new Controller(controls, keys);
  }

  spawnPuyo() {
    const { boardData } = this.state;
    if (boardData[this.axisSpawnY][this.axisSpawnX].color !== 'none') {
      this.handleDeath();
      return;
    }
    const { nextColors1, nextColors2 } = this.state;
    this.update({
      currPuyo1: { x: this.axisSpawnX, y: this.axisSpawnY - 1, color: nextColors1.color1 },
      currPuyo2: { x: this.axisSpawnX, y: this.axisSpawnY, color: nextColors1.color2 },
      currState: 'offset',
      nextColors1: nextColors2,
      nextColors2: this.sequence.getColors(),
    });
    this.lockTimeout = null;
    this.failedRotate = false;
    if (this.gravityOn) {
      this.gravityTimeout = setTimeout(() => { this.applyGravity(); }, this.timing.gravityRepeat);
    }
    this.rowsHeldDownIn.clear();
    this.kickUpCount = 0;
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
      this.update({ currState: 'active' });
      if (atLowestPosition) {
        this.startLockTimeout();
      }
    } else if (!atLowestPosition) {
      currPuyo1.y++;
      currPuyo2.y++;
      this.update({ currPuyo1, currPuyo2, currState: 'offset' });
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
    const { boardData } = this.state;
    return this.chainsim.checkIfValidLoc(puyo1)
      && this.chainsim.checkIfValidLoc(puyo2)
      && boardData[puyo1.y][puyo1.x].color === 'none'
      && boardData[puyo2.y][puyo2.x].color === 'none'
      && puyo2.y >= this.twelfthRow - 1; // forbid rotating axis puyo into 14th row
  }

  puyoLockFunctions() {
    const {
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
    this.chainsim.placePuyo(placedPuyo1, placedPuyo2);
    this.didChain = false;
    this.update({
      boardData: {
        [puyo1.y]: {
          [puyo1.x]: {
            color: puyo1.color,
            state: state1,
          },
        },
      },
    });
    this.update({
      boardData: {
        [puyo2.y]: {
          [puyo2.x]: {
            color: puyo2.color,
            state: state2,
          },
        },
      },
      currState: 'none',
    });
    if (state1 === 'falling' || state2 === 'falling') {
      this.update({ splitPuyo });
    } else {
      setTimeout(() => { this.handleLink(); }, this.timing.startChainDelay);
    }
  }

  handleLink() {
    const poppedDroppedScore = this.chainsim.computeLink();
    if (poppedDroppedScore) {
      this.didChain = true;
      const { popped, dropped, score: chainScore } = poppedDroppedScore;
      this.puyosToPop = popped;
      this.puyosToDrop = dropped;
      setTimeout(() => { this.blinkPopped(0, chainScore); }, this.timing.startPopDelay);
    } else {
      if (this.didChain) {
        const { score } = this.state;
        const garbageSent = Math.floor((score - this.lastScoreCutoff) / this.garbageRate);
        this.lastScoreCutoff += garbageSent * this.garbageRate;
        const { isMulti } = this.props;
        if (isMulti) {
          this.sendGarbage(garbageSent);
        }
      }
      if (this.checkAllClear()) {
        const { score } = this.state;
        this.update({ score: score + this.rockGarbage * this.garbageRate });
      }
      this.handleGarbage();
    }
  }

  handleGarbage() {
    const { garbageCount } = this.props;
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
      this.droppedGarbage();
      this.update({ garbagePuyoList });
    } else {
      setTimeout(() => { this.spawnPuyo(); }, this.timing.pieceSpawnDelay);
    }
  }

  blinkPopped(step, chainScore) {
    const { boardData } = this.state;
    const blinks = 12;
    if (step < blinks) {
      for (const { x, y } of this.puyosToPop) {
        this.update({
          boardData: {
            [y]: {
              [x]: {
                state: boardData[y][x].state === 'blinked' ? 'none' : 'blinked',
              },
            },
          },
        });
      }
      setTimeout(() => { this.blinkPopped(step + 1, chainScore); }, this.timing.blinkRepeat);
    } else {
      for (const { x, y } of this.puyosToPop) {
        this.update({
          boardData: {
            [y]: {
              [x]: {
                state: boardData[y][x].color === 'gray' ? 'blinked' : 'exploding',
              },
            },
          },
        });
      }
      setTimeout(() => {
        this.popPopped();
        const { score } = this.state;
        this.update({ score: score + chainScore });
        this.dropDroppedHalfCell(0);
      }, this.timing.startDropDelay - blinks * this.timing.blinkRepeat);
    }
  }

  popPopped() {
    for (const { x, y } of this.puyosToPop) {
      this.update({ boardData: { [y]: { [x]: { color: 'none', state: 'none' } } } });
    }
  }

  dropDroppedHalfCell(step) {
    const { boardData } = this.state;
    let canDrop = false;
    this.puyosToDrop.forEach(({ puyo: { x, y }, dist }, i) => {
      if (dist > 0) {
        const puyo = { ...boardData[y][x] };
        if (step === 0) {
          this.update({ boardData: { [y + 1]: { [x]: { color: puyo.color, state: 'offset' } } } });
          this.update({ boardData: { [y]: { [x]: { color: 'none', state: 'none' } } } });
          this.puyosToDrop[i].puyo.y++;
        } else {
          if (dist === 1) {
            puyo.state = puyo.color === 'gray' ? 'none' : 'fell';
          } else {
            puyo.state = 'none';
            canDrop = true;
          }
          this.update({ boardData: { [y]: { [x]: { state: puyo.state } } } });
          this.puyosToDrop[i].dist--;
        }
      }
    });
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
    const { boardData } = this.state;
    // exclude 14th row from all clear check
    return boardData.every((row, y) => y < this.twelfthRow - 1
      || row.every((puyo) => puyo.color === 'none'));
  }

  handleDeath() {
    const { handleDeath } = this.props;
    handleDeath();
  }

  findLowestPosition(col) {
    const { boardData } = this.state;
    for (let i = this.height - 1; i >= 0; i--) {
      if (boardData[i][col].color === 'none') {
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
      this.update({ currPuyo1: puyo1, currPuyo2: puyo2 });
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
    if (this.recentLeftRight === -dx || (currState !== 'active' && currState !== 'offset')) return;
    const newPuyo1 = { ...currPuyo1 };
    newPuyo1.x += dx;
    const newPuyo2 = { ...currPuyo2 };
    newPuyo2.x += dx;
    if (this.tryMove(newPuyo1, newPuyo2)) {
      this.recentLeftRight = dx;
      clearTimeout(this.leftRightLockTimeout);
      this.leftRightLockTimeout = setTimeout(() => {
        this.recentLeftRight = 0;
      }, this.timing.leftRightLock);
    }
  }

  moveDown() {
    const { currPuyo1, currPuyo2, currState } = this.state;
    if (this.recentLeftRight || (currState !== 'active' && currState !== 'offset')) return;
    if (!this.rowsHeldDownIn.has(currPuyo2.y)) {
      const { score } = this.state;
      this.update({ score: score + 1 });
      this.rowsHeldDownIn.add(currPuyo2.y);
    }
    if (this.atLowestPosition(currPuyo1, currPuyo2)) {
      if (currState === 'offset') {
        this.update({ currState: 'active' });
      }
      const { score } = this.state;
      this.update({ score: score + 1 });
      this.puyoLockFunctions();
    } else if (currState === 'offset') {
      this.update({ currState: 'active' });
    } else {
      currPuyo1.y++;
      currPuyo2.y++;
      this.update({ currPuyo1, currPuyo2, currState: 'offset' });
    }
  }

  rotatePuyo(direction) {
    const { currPuyo1, currPuyo2, currState } = this.state;
    if (currState !== 'active' && currState !== 'offset') return;
    // offsets from axis puyo to other puyo
    const dx = -direction * (currPuyo1.y - currPuyo2.y);
    const dy = direction * (currPuyo1.x - currPuyo2.x);
    const newPuyo1 = { ...currPuyo2 };
    newPuyo1.x += dx;
    newPuyo1.y += dy;
    newPuyo1.color = currPuyo1.color;
    if (!this.tryMove(newPuyo1, currPuyo2)) {
      const kickUpMax = 8;
      if (this.kickUpCount === kickUpMax && dy === 1) return;
      // kick
      newPuyo1.x -= dx;
      newPuyo1.y -= dy;
      const newPuyo2 = { ...currPuyo2 };
      newPuyo2.x -= dx;
      newPuyo2.y -= dy;
      if (this.tryMove(newPuyo1, newPuyo2)) {
        if (dy === 1) {
          this.kickUpCount++;
        }
      } else if (currPuyo1.x === currPuyo2.x) {
        // quick turn
        if (this.failedRotate) {
          if (currPuyo2.y > currPuyo1.y) {
            if (this.kickUpCount === kickUpMax) return;
            this.kickUpCount++;
          }
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
    const { match: garbage, found: isGarbage } = findLocInList(dataitem, garbagePuyoList || []);
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
    const { boardData } = this.state;
    return boardData.map((datarow) => datarow.map((dataitem) => (
      <div key={dataitem.x * datarow.length + dataitem.y}>
        { this.renderCell(dataitem) }
        { dataitem.x === datarow.length - 1 && <div className="clear" /> }
      </div>
    )));
  }

  render() {
    const {
      score,
      nextColors1,
      nextColors2,
    } = this.state;
    const { garbageCount } = this.props;
    return (
      <div className="player">
        <div className="garbage">
          <h2>{ garbageCount }</h2>
        </div>
        <>
          <div className="board" style={{ '--invisible-rows-count': this.twelfthRow }}>
            { this.renderBoard() }
          </div>
          <div className="preview">
            <Cell classList={[nextColors1.color1]} />
            <div className="clear" />
            <Cell classList={[nextColors1.color2]} />
            <div className="clear" />
            <Cell classList={['none']} />
            <div className="clear" />
            <Cell classList={[nextColors2.color1]} />
            <div className="clear" />
            <Cell classList={[nextColors2.color2]} />
            <div className="clear" />
          </div>
        </>
        <div className="score">
          <h1>{ score }</h1>
        </div>
      </div>
    );
  }
}

const {
  objectOf,
  string,
  number,
  func,
  bool,
} = PropTypes;
Board.propTypes = {
  keys: objectOf(string).isRequired,
  seed: number.isRequired,
  handleDeath: func.isRequired,
  isMulti: bool.isRequired,
  garbageCount: number.isRequired,
  sendGarbage: func,
  droppedGarbage: func.isRequired,
};

export default Board;
