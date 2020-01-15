import React from 'react';
import Board from './board.js';
import { randSeed, disableMovementKeyHandler } from './utils.js';
import Controller from './controller.js';

class GameSingle extends React.Component {
  constructor(props) {
    super(props);
    this.reset = this.reset.bind(this);
    this.createController();
    this.reset(true);
  }

  componentDidMount() {
    // disable default for arrow keys
    window.addEventListener('keydown', disableMovementKeyHandler, false);
  }

  componentWillUnmount() {
    this.controller.release();
    window.removeEventListener('keydown', disableMovementKeyHandler, false);
  }

  createController() {
    const that = this;
    const controls = {
      reset: { f: this.reset, delay: 0, repeat: 0 },
      pause: { f: () => { that.pause.bind(that)(); }, delay: 0, repeat: 0 },
    };
    const keys = {
      r: 'reset',
      Escape: 'pause',
    };
    this.controller = new Controller(controls, keys);
  }

  reset(unmounted = false) {
    const key = (new Date()).getTime();
    const state = {
      id: key,
      seed: randSeed(),
      timeElapsed: 0,
      paused: false,
    };
    if (unmounted) {
      this.state = state;
    } else {
      this.setState(state);
    }
    this.effectiveStartTime = Date.now();
    setInterval(() => {
      const { paused } = this.state;
      if (!paused) {
        this.setTimeElapsed();
      }
    }, 17);
  }

  setTimeElapsed() {
    this.setState({ timeElapsed: Date.now() - this.effectiveStartTime });
  }

  pause() {
    this.setState(({ paused }) => {
      if (!paused) {
        this.pauseStartTime = Date.now();
        setTimeout(() => {
          this.setTimeElapsed();
        }, 0);
      } else {
        setTimeout(() => {
          this.effectiveStartTime += Date.now() - this.pauseStartTime;
          this.setTimeElapsed(time);
        }, 0);
      }
      this.boardPause();
      return { paused: !paused };
    });
  }

  setBoardPause(boardPause) {
    this.boardPause = boardPause;
  }

  renderTime() {
    const { timeElapsed } = this.state;
    const hundredthsPerMillisecond = 10;
    const hundredthsPerSecond = 100;
    const secondsPerMinute = 60;
    const maxMinutes = 99;
    const totalHundredths = Math.floor(timeElapsed / hundredthsPerMillisecond);
    let hundredths = totalHundredths % hundredthsPerSecond;
    const totalSeconds = Math.floor(totalHundredths / hundredthsPerSecond);
    let seconds = totalSeconds % secondsPerMinute;
    const totalMinutes = Math.floor(totalSeconds / secondsPerMinute);
    let minutes = totalMinutes;
    if (totalMinutes > maxMinutes) {
      hundredths = hundredthsPerSecond - 1;
      seconds = secondsPerMinute - 1;
      minutes = maxMinutes;
    }
    const hundredthsStr = String(hundredths).padStart(2, '0');
    const secondsStr = String(seconds).padStart(2, '0');
    const minutesStr = String(minutes).padStart(2, '0');
    return (
      <div id="time">
        {`${minutesStr}:${secondsStr}.${hundredthsStr}`}
      </div>
    );
  }

  render() {
    const {
      id,
      seed,
      paused,
    } = this.state;
    return (
      <div id="game">
        <div style={{ display: 'flex', flexDireciton: 'row' }}>
          <div style={{ marginLeft: 80, marginRight: 80 }}>
            {this.renderTime()}
          </div>
          <Board
            key={id}
            seed={seed}
            handleDeath={this.reset}
            multiplayer="none"
            paused={paused}
            setBoardPause={this.setBoardPause.bind(this)}
          />
        </div>
      </div>
    );
  }
}

export default GameSingle;
