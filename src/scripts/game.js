import React from 'react';
import { render } from 'react-dom';
import Board from './board.js';
import '../styles/style.css';
import { random } from './utils.js';
import Controller from './controller.js';

class Game extends React.Component {
  constructor(props) {
    super(props);
    this.rockGarbage = 30;
    this.keys = {
      ArrowLeft: 'left',
      ArrowRight: 'right',
      ArrowDown: 'down',
      z: 'counterclockwise',
      x: 'clockwise',
      d: 'counterclockwise',
      f: 'clockwise',
      g: 'gravity',
      t: 'garbage',
    };
    this.reset = this.reset.bind(this);
    this.createController();
    this.reset(true);
  }

  createController() {
    const controls = {
      reset: { f: this.reset, delay: 0, repeat: 0 },
    };
    const keys = {
      Escape: 'reset',
    };
    this.controller = new Controller(controls, keys);
  }

  reset(unmounted) {
    const key = (new Date()).getTime();
    const numSeq = 65536;
    const state = {
      key1: key + '1',
      key2: key + '2',
      seed: random(numSeq),
      garbage1: 0,
      garbage2: 0,
    };
    if (unmounted) {
      this.state = state;
    } else {
      this.setState(state);
    }
  }

  render() {
    const {
      key1,
      key2,
      seed,
      garbage1,
      garbage2,
    } = this.state;
    return (
      <div className="game-wrapper">
        <div />
        <div className="margin-auto">
          <div className="game">
            <Board
              key={key1}
              keys={this.keys}
              seed={seed}
              handleDeath={this.reset}
              garbageCount={garbage1}
              sendGarbage={((garbage) => {
                this.setState((state) => ({
                  garbage1: Math.max(0, state.garbage1 - garbage),
                  garbage2: state.garbage2 + Math.max(0, garbage - state.garbage1),
                }));
              })}
              droppedGarbage={(() => {
                this.setState((state) => (
                  { garbage1: Math.max(0, state.garbage1 - this.rockGarbage) }
                ));
              })}
            />
            <Board
              key={key2}
              keys={this.keys}
              seed={seed}
              handleDeath={this.reset}
              garbageCount={garbage2}
              sendGarbage={((garbage) => {
                this.setState((state) => ({
                  garbage1: state.garbage1 + Math.max(0, garbage - state.garbage2),
                  garbage2: Math.max(0, state.garbage2 - garbage),
                }));
              })}
              droppedGarbage={(() => {
                this.setState((state) => (
                  { garbage2: Math.max(0, state.garbage2 - this.rockGarbage) }
                ));
              })}
            />
          </div>
        </div>
        <div />
      </div>
    );
  }
}

const domContainer = document.getElementById('game');
render(<Game />, domContainer);

// disable default for arrow keys
window.addEventListener('keydown', (e) => {
  // space and arrow keys
  if (new Set([32, 37, 38, 39, 40]).has(e.keyCode)) {
    e.preventDefault();
  }
}, false);
