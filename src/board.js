import React from 'react';
import PropTypes from 'prop-types';
import Cell from './cell.js';
import Chainsim from './chainsim.js';
import Controller from './controller.js';
import Sequence from './sequence.js';
import {
  locsEqual,
  findLocInList,
  randGenerator,
  randSample,
  cloneData,
} from './utils.js';
import Garbage from './garbage.js';

class Board extends React.Component {
  constructor(props) {
    super(props);
    const {
      seed,
      handleDeath,
      multiplayer, // none, send, receive
      myGarbageRef,
      oppGarbageRef,
      playerRef,
      setIsChaining,
      setBoardPause,
      setGetScore,
      challenge,
    } = props;
    this.handleDeath = handleDeath;
    this.multiplayer = multiplayer;
    this.myGarbageRef = myGarbageRef;
    this.oppGarbageRef = oppGarbageRef;
    this.setIsChaining = setIsChaining;
    this.challenge = challenge;
    if (this.multiplayer === 'none') {
      setBoardPause(this.pause.bind(this));
    }
    if (this.challenge === 'score') {
      setGetScore(() => {
        const { score } = this.state;
        return score;
      });
    }
    this.twelfthRow = 2; // two hidden rows
    this.height = 12 + this.twelfthRow;
    this.extraRows = 6;
    this.width = 6;
    this.rand = randGenerator(seed);
    this.sequence = new Sequence(this.rand);
    this.axisSpawnX = 2;
    this.axisSpawnY = this.twelfthRow; // spawn axis puyo in 12th row
    const initGarbage = { pending: 0, sentPlusDropped: 0 };
    this.state = {
      boardData: Array.from({ length: this.height }, (_, y) => (
        Array.from({ length: this.width }, (_, x) => ({
          x,
          y,
          color: 'none', // none, red, green, blue, yellow, purple, gray
          state: 'none', // none, landed, offset, falling, ghost, fell, blinking, dropping
        }))
      )),
      currPuyo1: { x: this.axisSpawnX, y: this.axisSpawnY - 1, color: 'none' },
      currPuyo2: { x: this.axisSpawnX, y: this.axisSpawnY, color: 'none' }, // axis puyo
      currState: 'none', // none, active, offset
      score: 0,
      nextColors1: this.sequence.getColors(), // { color1, color2 }
      nextColors2: this.sequence.getColors(),
      splitPuyo: null,
      garbagePuyoList: false,
      highestPopping: null,
      showAllClearText: false,
      myGarbage: { ...initGarbage },
      oppGarbage: { ...initGarbage },
    };
    if (this.multiplayer !== 'none') {
      this.currPuyoRef = playerRef.child('c');
      this.currPuyoRef.set({
        x1: this.axisSpawnX,
        y1: this.axisSpawnY - 1,
        x2: this.axisSpawnX,
        y2: this.axisSpawnY,
        score: 0,
      });
      this.dropListRef = playerRef.child('d');
    }
    this.garbageRate = 70;
    this.rockGarbage = 30;
    this.redXLoc = { x: 2, y: this.twelfthRow };

    this.gravityOn = true;
    this.gravityTimeout = null;
    this.rowsHeldDownIn = new Set();
    this.leftRightLockTimeout = null;
    this.createTiming();
    if (this.multiplayer !== 'receive') {
      this.createController();
    }
    this.recentLeftRight = 0;
    this.chainsim = new Chainsim(this.twelfthRow);
    this.lastScoreCutoff = 0;
    this.unpause = null;
  }

  componentDidMount() {
    if (this.multiplayer !== 'none') {
      this.oppGarbageRef.on('value', (snapshot) => {
        if (!snapshot.exists()) return;
        this.setState({ oppGarbage: snapshot.val() });
      });
      if (this.multiplayer === 'receive') {
        this.currPuyoRef.on('value', (snapshot) => {
          if (!snapshot.exists()) return;
          const { currState } = this.state;
          if (currState === 'offset') {
            const {
              x1,
              y1,
              x2,
              y2,
              score,
            } = snapshot.val();
            this.setState((state) => ({
              currPuyo1: { ...state.currPuyo1, x: x1, y: y1 },
              currPuyo2: { ...state.currPuyo2, x: x2, y: y2 },
              score,
            }));
          }
        });
        this.dropList = [];
        this.handleGarbageReady = false;
        this.dropListRef.on('child_added', (snapshot) => {
          if (!snapshot.exists()) return;
          const val = snapshot.val();
          this.dropList.push(val);
          if (this.dropList.length === 1) {
            if ('garbage' in val) {
              if (this.handleGarbageReady) {
                const { myGarbage: { sentPlusDropped } } = this.state;
                this.handleGarbage(sentPlusDropped);
              }
            } else {
              const { currState } = this.state;
              if (currState !== 'none') {
                this.puyoLockFunctions();
              }
            }
          }
        });
      }
    }
    this.setPausableTimeout(() => { this.spawnPuyo(); }, this.timing.pieceSpawnDelay);
  }

  componentWillUnmount() {
    // clear timeouts
    for (let id = window.setTimeout(() => {}, 0); id >= 0; id--) {
      window.clearTimeout(id);
    }
    if (this.multiplayer !== 'none') {
      this.oppGarbageRef.off('value');
    }
    if (this.multiplayer === 'receive') {
      this.currPuyoRef.off('value');
      this.dropListRef.off('child_added');
    } else {
      this.controller.release();
    }
  }

  onFallingAnimationEnd() {
    this.setState(({ boardData, splitPuyo }) => {
      const {
        x,
        y,
        color,
        distance: d,
      } = splitPuyo;
      const data = cloneData(boardData);
      Object.assign(data[y][x], { color: 'none', state: 'none' });
      Object.assign(data[y + d][x], { color, state: 'fell' });
      return {
        boardData: data,
        currState: 'none',
        splitPuyo: false,
      };
    });
    const delay = this.timing.startChainDelay + this.timing.fallenPuyoDelay;
    this.setPausableTimeout(() => { this.handleLink(); }, delay);
  }

  onGarbageAnimationEnd() {
    this.garbageFallingCount--;
    if (this.garbageFallingCount === 0) {
      this.setState(({ boardData, garbagePuyoList }) => {
        const data = cloneData(boardData);
        for (const { x, y, distance: d } of garbagePuyoList) {
          // don't add garbage to 14th row
          if (y + d >= this.twelfthRow - 1) {
            Object.assign(data[y + d][x], { color: 'gray', state: 'none' });
          }
        }
        return { boardData: data, garbagePuyoList: false };
      });
      this.setPausableTimeout(() => { this.spawnPuyo(); },
        this.timing.pieceSpawnDelay + this.timing.fallenPuyoDelay);
    }
  }

  onPuyoAnimationEnd({ x, y }) {
    this.setState(({ boardData }) => {
      const data = cloneData(boardData);
      data[y][x].state = 'none';
      return { boardData: data };
    });
  }

  setPausableTimeout(func, delay) {
    setTimeout(() => {
      const { paused } = this.props;
      if (paused) {
        this.unpause = func;
      } else {
        func();
      }
    }, delay);
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
      oneFrame: 1 * msPerFrame,
    };
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
      ...process.env.NODE_ENV === 'development' ? { g: 'gravity' } : {},
    };
    this.controller = new Controller(controls, keys);
  }

  pause() {
    const { paused } = this.props;
    if (!paused) {
      this.gravityWasOn = this.gravityOn;
      if (this.gravityOn) {
        this.toggleGravity();
      }
    } else {
      setTimeout(() => {
        if (this.gravityWasOn) {
          this.toggleGravity(true);
        }
        if (this.unpause) {
          this.unpause();
          this.unpause = null;
        }
      }, 0);
    }
  }

  spawnPuyo() {
    if (this.setIsChaining(false)) return;
    if (
      this.multiplayer === 'receive'
      && this.dropList.length > 0
      && 'garbage' in this.dropList[0]
    ) {
      this.dropList.shift();
    }
    const { boardData } = this.state;
    if (
      boardData[this.axisSpawnY][this.axisSpawnX].color !== 'none'
      && this.multiplayer !== 'receive'
    ) {
      this.handleDeath();
      return;
    }
    this.setState((state) => ({
      currPuyo1: { x: this.axisSpawnX, y: this.axisSpawnY - 1, color: state.nextColors1.color1 },
      currPuyo2: { x: this.axisSpawnX, y: this.axisSpawnY, color: state.nextColors1.color2 },
      currState: 'offset',
      nextColors1: { ...state.nextColors2 },
      nextColors2: this.sequence.getColors(),
    }));
    if (this.multiplayer === 'send') {
      const { score } = this.state;
      this.currPuyoRef.update({
        x1: this.axisSpawnX,
        y1: this.axisSpawnY - 1,
        x2: this.axisSpawnX,
        y2: this.axisSpawnY,
        score,
      });
    }
    if (this.multiplayer === 'receive') {
      this.puyoLockFunctions();
      return;
    }
    this.lockTimeout = null;
    this.failedRotate = false;
    if (this.gravityOn) {
      this.gravityTimeout = setTimeout(() => { this.applyGravity(); }, this.timing.gravityRepeat);
    }
    this.rowsHeldDownIn.clear();
    this.kickUpCount = 0;
    if (this.multiplayer !== 'receive') {
      if (
        'left' in this.controller.timers
        && boardData[this.axisSpawnY][this.axisSpawnX - 1].color === 'none'
      ) {
        this.lockLeftRight(-1);
      } else if (
        'right' in this.controller.timers
        && boardData[this.axisSpawnY][this.axisSpawnX + 1].color === 'none'
      ) {
        this.lockLeftRight(1);
      }
    }
  }

  startLockTimeout() {
    if (!this.lockTimeout) {
      this.lockTimeout = this.setPausableTimeout(
        this.puyoLockFunctions.bind(this),
        this.timing.lockDelay,
      );
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
      const y1 = currPuyo1.y + 1;
      const y2 = currPuyo2.y + 1;
      this.setState({
        currPuyo1: { ...currPuyo1, y: y1 },
        currPuyo2: { ...currPuyo2, y: y2 },
        currState: 'offset',
      });
      if (this.multiplayer === 'send') {
        this.currPuyoRef.update({ y1, y2 });
      }
    }
    this.gravityTimeout = setTimeout(() => { this.applyGravity(); }, this.timing.gravityRepeat);
  }

  toggleGravity(unPausing = false) {
    const { paused } = this.props;
    if (paused && !unPausing) return;
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
    let {
      currPuyo1: puyo1,
      currPuyo2: puyo2,
      currState,
    } = this.state;
    if (this.multiplayer === 'receive') {
      if (this.dropList.length === 0 || 'garbage' in this.dropList[0]) return;
      const {
        x1,
        y1,
        x2,
        y2,
        score,
      } = this.dropList[0];
      puyo1 = { ...puyo1, x: x1, y: y1 };
      puyo2 = { ...puyo2, x: x2, y: y2 };
      currState = 'active';
      this.setState({
        currPuyo1: puyo1,
        currPuyo2: puyo2,
        currState,
        score,
      });
    }
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
    if (this.multiplayer === 'send') {
      const { score } = this.state;
      this.dropListRef.push({
        x1: puyo1.x,
        y1: puyo1.y,
        x2: puyo2.x,
        y2: puyo2.y,
        score,
      });
    }
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
    this.setState(({ boardData }) => {
      const data = cloneData(boardData);
      Object.assign(data[puyo1.y][puyo1.x], { color: puyo1.color, state: state1 });
      Object.assign(data[puyo2.y][puyo2.x], { color: puyo2.color, state: state2 });
      return {
        boardData: data,
        currState: 'none',
      };
    });
    if (state1 === 'falling' || state2 === 'falling') {
      this.setState({ splitPuyo });
    } else {
      this.setPausableTimeout(() => { this.handleLink(); }, this.timing.startChainDelay);
    }
  }

  handleLink() {
    this.setIsChaining(true);
    const poppedDroppedScore = this.chainsim.computeLink();
    if (poppedDroppedScore) {
      this.didChain = true;
      const { showAllClearText } = this.state;
      if (showAllClearText) {
        this.setState({ showAllClearText: false });
      }
      const { popped, dropped, score: chainScore } = poppedDroppedScore;
      this.setState(({ boardData }) => {
        const data = cloneData(boardData);
        let minY = this.height;
        let minX;
        for (const { x, y } of popped) {
          data[y][x].state = 'blinking';
          if (y < minY || (y === minY && x < minX)) {
            minY = y;
            minX = x;
          }
        }
        return { boardData: data, highestPopping: { x: minX, y: minY } };
      });
      this.setPausableTimeout(() => {
        this.popPopped(popped);
        this.setState(({ score, myGarbage }) => {
          const newScore = score + chainScore;
          const garbageSent = Math.floor((newScore - this.lastScoreCutoff) / this.garbageRate);
          this.lastScoreCutoff += garbageSent * this.garbageRate;
          const newGarbage = { ...myGarbage };
          newGarbage.pending += garbageSent;
          if (this.multiplayer === 'send') {
            this.myGarbageRef.set(newGarbage);
          }
          return { score: newScore, myGarbage: newGarbage };
        });
        if (dropped.length > 0) {
          const dropByDist = {};
          for (const { puyo, dist } of dropped) {
            if (!(dist in dropByDist)) {
              dropByDist[dist] = [];
            }
            dropByDist[dist].push(puyo);
          }
          const maxDist = Math.max.apply(null, Object.keys(dropByDist));
          this.dropByDistCount = Object.fromEntries(
            Object.entries(dropByDist).map(([k, v]) => [k, v.length]),
          );
          this.setState(({ boardData: boardDataTimeout }) => {
            const dataTimeout = cloneData(boardDataTimeout);
            for (const { puyo, dist } of dropped) {
              const newElem = {
                state: 'dropping',
                distance: dist,
                onAnimationEnd: () => {
                  this.dropByDistCount[dist]--;
                  if (this.dropByDistCount[dist] === 0) {
                    this.setState(({ boardData: boardDataAnimation }) => {
                      const dataAnimation = cloneData(boardDataAnimation);
                      for (const { x, y } of dropByDist[dist]) {
                        const { color } = dataAnimation[y][x];
                        const endState = color === 'gray' ? 'none' : 'fell';
                        Object.assign(dataAnimation[y][x], { color: 'none', state: 'none' });
                        Object.assign(dataAnimation[y + dist][x], { color, state: endState });
                      }
                      return { boardData: dataAnimation };
                    });
                    if (dist === maxDist) {
                      this.setPausableTimeout(() => { this.handleLink(); },
                        this.timing.nextLinkDelay + this.timing.fallenPuyoDelay);
                    }
                  }
                },
              };
              Object.assign(dataTimeout[puyo.y][puyo.x], newElem);
            }
            return { boardData: dataTimeout };
          });
        } else {
          this.setPausableTimeout(() => { this.handleLink(); }, this.timing.nextLinkDelay);
        }
      }, this.timing.startDropDelay);
    } else {
      if (this.didChain) {
        this.setState(({ myGarbage: { pending, sentPlusDropped } }) => {
          const newGarbage = { pending: 0, sentPlusDropped: sentPlusDropped + pending };
          if (this.multiplayer === 'send') {
            this.myGarbageRef.set(newGarbage);
          }
          return { myGarbage: newGarbage };
        });
      }
      if (this.checkAllClear()) {
        this.setState((state) => ({
          score: state.score + this.rockGarbage * this.garbageRate,
          showAllClearText: true,
        }));
      }
      this.handleGarbageReady = true;
      const { myGarbage: { pending, sentPlusDropped } } = this.state;
      this.handleGarbage(sentPlusDropped + pending);
    }
  }

  handleGarbage(mySentPlusDropped) {
    let garbageQueued;
    if (this.multiplayer === 'receive') {
      if (this.dropList.length > 0 && !('garbage' in this.dropList[0])) {
        this.dropList.shift();
      }
      if (this.dropList.length > 0 && 'garbage' in this.dropList[0]) {
        garbageQueued = this.dropList[0].garbage;
      } else return;
    } else {
      const { oppGarbage } = this.state;
      garbageQueued = oppGarbage.sentPlusDropped - mySentPlusDropped;
    }
    if (garbageQueued > 0) {
      this.handleGarbageReady = false;
      const garbage = Math.min(garbageQueued, this.rockGarbage);
      if (this.multiplayer === 'send') {
        this.dropListRef.push({ garbage });
      }
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
      garbagePuyoList.push(...randSample(this.rand, this.width, garbage % this.width).map((x) => ({
        x,
        y: garbageSpawnRow - fullRows,
        distance: distances[x],
      })));
      this.chainsim.addGarbage(garbagePuyoList);
      this.garbageFallingCount = garbage;
      this.setState(({ myGarbage }) => {
        const newGarbage = { ...myGarbage };
        newGarbage.sentPlusDropped += garbage;
        if (this.multiplayer === 'send') {
          this.myGarbageRef.set(newGarbage);
        }
        return { garbagePuyoList, myGarbage: newGarbage };
      });
    } else {
      if (this.multiplayer === 'send') {
        this.dropListRef.push({ garbage: 0 });
      }
      this.setPausableTimeout(() => { this.spawnPuyo(); }, this.timing.pieceSpawnDelay);
    }
  }

  popPopped(popped) {
    this.setState(({ boardData }) => {
      const data = cloneData(boardData);
      for (const { x, y } of popped) {
        Object.assign(data[y][x], { color: 'none', state: 'none' });
      }
      return { boardData: data };
    });
  }

  checkAllClear() {
    const { boardData } = this.state;
    // exclude 14th row from all clear check
    return boardData.every((row, y) => y < this.twelfthRow - 1
      || row.every((puyo) => puyo.color === 'none'));
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
      this.setState((state) => ({
        currPuyo1: {
          ...state.currPuyo1,
          x: puyo1.x,
          y: puyo1.y,
        },
        currPuyo2: {
          ...state.currPuyo2,
          x: puyo2.x,
          y: puyo2.y,
        },
      }));
      if (this.multiplayer === 'send') {
        this.currPuyoRef.update({
          x1: puyo1.x,
          y1: puyo1.y,
          x2: puyo2.x,
          y2: puyo2.y,
        });
      }
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

  lockLeftRight(dx) {
    this.recentLeftRight = dx;
    clearTimeout(this.leftRightLockTimeout);
    this.leftRightLockTimeout = setTimeout(() => {
      this.recentLeftRight = 0;
    }, this.timing.leftRightLock);
  }

  moveLeftRight(dx) {
    const {
      currPuyo1,
      currPuyo2,
      currState,
    } = this.state;
    const { paused } = this.props;
    if (
      this.recentLeftRight === -dx
      || (currState !== 'active' && currState !== 'offset')
      || paused
    ) return;
    const newPuyo1 = { ...currPuyo1 };
    newPuyo1.x += dx;
    const newPuyo2 = { ...currPuyo2 };
    newPuyo2.x += dx;
    if (this.tryMove(newPuyo1, newPuyo2)) {
      this.lockLeftRight(dx);
    }
  }

  moveDown() {
    const {
      currPuyo1,
      currPuyo2,
      currState,
    } = this.state;
    const { paused } = this.props;
    if (
      this.recentLeftRight
      || (currState !== 'active' && currState !== 'offset')
      || paused
    ) return;
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
      const y1 = currPuyo1.y + 1;
      const y2 = currPuyo2.y + 1;
      this.setState({
        currPuyo1: { ...currPuyo1, y: y1 },
        currPuyo2: { ...currPuyo2, y: y2 },
        currState: 'offset',
      });
      if (this.multiplayer === 'send') {
        const { score } = this.state;
        this.currPuyoRef.update({ y1, y2, score });
      }
    }
  }

  rotatePuyo(direction) {
    const {
      currPuyo1,
      currPuyo2,
      currState,
    } = this.state;
    const { paused } = this.props;
    if ((currState !== 'active' && currState !== 'offset') || paused) return;
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

  renderCell(dataitem, ghostPuyo1, ghostPuyo2, ghostGroup) {
    // what is this cell doing?
    const {
      currPuyo1,
      currPuyo2,
      currState,
      splitPuyo,
      garbagePuyoList,
      highestPopping,
    } = this.state;
    // is it dropping?
    if (dataitem.state === 'dropping') {
      return (
        <Cell
          classList={[dataitem.color, 'dropping']}
          style={{ '--distance': dataitem.distance }}
          onAnimationEnd={dataitem.onAnimationEnd}
        />
      );
    }
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
        onAnimationEnd: this.onGarbageAnimationEnd.bind(this),
        distance: garbage.distance,
        color: 'gray',
      });
    }
    // is it hidden?
    if (dataitem.y < this.twelfthRow) {
      return <Cell classList={['none']} />;
    }
    // is it puyo-ing?
    if (dataitem.state === 'landed' || dataitem.state === 'fell') {
      return (
        <Cell
          classList={[dataitem.color, dataitem.state]}
          onAnimationEnd={() => this.onPuyoAnimationEnd.bind(this)(dataitem)}
        />
      );
    }
    // does it have chain text?
    if (dataitem.state === 'blinking' && locsEqual(dataitem, highestPopping)) {
      return (
        <Cell
          classList={[dataitem.color, dataitem.state]}
          style={{ zIndex: 1 }}
          Component={<div className="chain-text">{(this.chainsim.chainNum - 1) + '-chain!'}</div>}
        />
      );
    }
    // prepare red X stuff
    const redXCell = (
      <Cell
        classList={['none', 'none']}
        style={{ zIndex: -1 }}
        Component={<div className="red-X">X</div>}
      />
    );
    const isRedXLoc = locsEqual(dataitem, this.redXLoc);
    // is there no active piece?
    if (currState === 'none') {
      // is it the red X?
      if (dataitem.color === 'none' && isRedXLoc) {
        return redXCell;
      }
      return <Cell classList={[dataitem.color, dataitem.state]} />;
    }
    // is it active?
    const { match: currPuyo, found: isActive } = findLocInList(dataitem, [currPuyo1, currPuyo2]);
    if (isActive) {
      return <Cell classList={[currPuyo.color, currPuyo.state, currState]} />;
    }
    // is it a ghost?
    if (this.multiplayer !== 'receive') {
      const { match: ghost, found: isGhost } = findLocInList(dataitem, [ghostPuyo1, ghostPuyo2]);
      if (isGhost) {
        return <Cell classList={[ghost.color, 'ghost']} />;
      }
      // would the ghost pop it?
      const { found: inGhostGroup } = findLocInList(dataitem, ghostGroup);
      if (inGhostGroup) {
        return <Cell classList={[dataitem.color, 'ghost-group']} />;
      }
    }
    // is it the red X?
    if (isRedXLoc) {
      return redXCell;
    }
    // default
    return <Cell classList={[dataitem.color, dataitem.state]} />;
  }

  renderBoard() {
    const {
      boardData,
      currPuyo1,
      currPuyo2,
      currState,
    } = this.state;
    const rows = [];
    // find ghost
    let ghostPuyo1;
    let ghostPuyo2;
    let ghostGroup;
    if (this.multiplayer !== 'receive' && currState !== 'none') {
      ghostPuyo1 = { ...currPuyo1, y: this.findLowestPosition(currPuyo1.x) };
      ghostPuyo2 = { ...currPuyo2, y: this.findLowestPosition(currPuyo2.x) };
      // if ghost puyo overlap, stack them
      if (currPuyo1.x === currPuyo2.x) {
        if (currPuyo1.y < currPuyo2.y) {
          ghostPuyo1.y--;
        } else {
          ghostPuyo2.y--;
        }
      }
      // find ghost group
      const color1 = this.chainsim.board[ghostPuyo1.y][ghostPuyo1.x];
      const color2 = this.chainsim.board[ghostPuyo2.y][ghostPuyo2.x];
      // ghost row ghost puyo cannot pop
      const isVisible1 = ghostPuyo1.y >= this.twelfthRow;
      const isVisible2 = ghostPuyo2.y >= this.twelfthRow;
      if (isVisible1) {
        this.chainsim.board[ghostPuyo1.y][ghostPuyo1.x] = ghostPuyo1.color;
      }
      if (isVisible2) {
        this.chainsim.board[ghostPuyo2.y][ghostPuyo2.x] = ghostPuyo2.color;
      }
      const checkedLocations = [];
      let group1 = [];
      if (isVisible1) {
        group1 = this.chainsim.checkPuyoHelper(ghostPuyo1, ghostPuyo1.color, checkedLocations);
      }
      let group2 = [];
      if (isVisible2 && !findLocInList(ghostPuyo2, checkedLocations).found) {
        group2 = this.chainsim.checkPuyoHelper(ghostPuyo2, ghostPuyo2.color, checkedLocations);
      }
      ghostGroup = [
        ...(group1.length >= this.chainsim.puyoMinPop ? group1 : []),
        ...(group2.length >= this.chainsim.puyoMinPop ? group2 : []),
      ];
      this.chainsim.board[ghostPuyo1.y][ghostPuyo1.x] = color1;
      this.chainsim.board[ghostPuyo2.y][ghostPuyo2.x] = color2;
    }
    // make room for garbage to spawn
    for (let y = -this.extraRows; y < this.height; y++) {
      const row = [];
      for (let x = 0; x < this.width; x++) {
        const defaultCell = {
          x,
          y,
          color: 'none',
          state: 'none',
        };
        const dataitem = y < 0 ? defaultCell : boardData[y][x];
        row.push(
          <div key={dataitem.x * this.width + dataitem.y}>
            { this.renderCell(dataitem, ghostPuyo1, ghostPuyo2, ghostGroup) }
            { dataitem.x === this.width - 1 && <div className="clear" /> }
          </div>,
        );
      }
      rows.push(row);
    }
    return rows;
  }

  render() {
    const {
      score,
      nextColors1,
      nextColors2,
      showAllClearText,
      myGarbage,
      oppGarbage,
    } = this.state;
    const totalGarbage = ({ pending, sentPlusDropped }) => pending + sentPlusDropped;
    const garbagePending = Math.max(0, totalGarbage(oppGarbage) - totalGarbage(myGarbage));
    return (
      <div className="player">
        {/* z-index allows chain text to overlap preview box */}
        <div style={{ zIndex: 1 }}>
          {this.multiplayer !== 'none'
          && (
            <Garbage garbage={garbagePending}/>
          )}
          <div style={{ backgroundColor: 'var(--board-color)', padding: 20, borderRadius: 20 }}>
            <div
              className="board"
              style={{ '--invisible-rows-count': this.twelfthRow + this.extraRows }}
            >
              { this.renderBoard() }
              {showAllClearText && <p className="all-clear-text">ALL CLEAR</p>}
            </div>
          </div>
          <div className="score">
            { score }
          </div>
        </div>
        <div className="preview">
          <div className="preview-box">
            <Cell classList={[nextColors1.color1]} />
            <div className="clear" />
            <Cell classList={[nextColors1.color2]} />
            <div className="clear" />
          </div>
          <div className="preview-box-offset">
            <Cell classList={[nextColors2.color1]} />
            <div className="clear" />
            <Cell classList={[nextColors2.color2]} />
            <div className="clear" />
          </div>
        </div>
      </div>
    );
  }
}

const {
  string,
  number,
  func,
  shape,
  bool,
} = PropTypes;

Board.propTypes = {
  seed: number.isRequired,
  handleDeath: func,
  multiplayer: string.isRequired,
  myGarbageRef: shape({ set: func }),
  oppGarbageRef: shape({ on: func.isRequired, off: func.isRequired }),
  playerRef: shape({ child: func.isRequired }),
  setIsChaining: func,
  paused: bool,
  setBoardPause: func,
  setGetScore: func,
  challenge: string,
};

Board.defaultProps = {
  handleDeath: undefined,
  myGarbageRef: undefined,
  oppGarbageRef: undefined,
  playerRef: undefined,
  setIsChaining: () => {},
  paused: false,
  setBoardPause: undefined,
  setGetScore: undefined,
  challenge: 'none',
};

export default Board;
