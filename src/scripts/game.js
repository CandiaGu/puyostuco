import React from 'react';
import { render } from 'react-dom';
import Board from './board.js';
import '../styles/style.css';
import { random } from './utils.js';
import Controller from './controller.js';

class Game extends React.Component {
  constructor(props) {
    super(props);
    this.numSeq = 65536;
    const key = (new Date()).getTime();
    this.state = {
      key1: key + '1',
      key2: key + '2',
      seed: random(this.numSeq),
    };
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
    this.createController();
    this.reset = this.reset.bind(this);
  }

  createController() {
    const that = this;
    const controls = {
      reset: { f: () => { that.reset.bind(that)(); }, delay: 0, repeat: 0 },
    };
    const keys = {
      Escape: 'reset',
    };
    this.controller = new Controller(controls, keys);
  }

  reset() {
    const key = (new Date()).getTime();
    this.setState({
      key1: key + '1',
      key2: key + '2',
      seed: random(this.numSeq),
    });
  }

  render() {
    const {
      key1,
      key2,
      seed,
    } = this.state;
    return (
      <div className="game-wrapper">
        <div />
        <div className="margin-auto">
          <div className="game">
            <Board key={key1} keys={this.keys} seed={seed} handleDeath={this.reset} />
            <Board key={key2} keys={this.keys} seed={seed} handleDeath={this.reset} />
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
