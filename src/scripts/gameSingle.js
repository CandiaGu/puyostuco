import React from 'react';
import { render } from 'react-dom';
import Board from './board.js';
import '../styles/style.css';
import { randSeed } from './utils.js';
import Controller from './controller.js';

class GameSingle extends React.Component {
  constructor(props) {
    super(props);
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

  reset(unmounted = false) {
    const key = (new Date()).getTime();
    const state = {
      id: key,
      seed: randSeed(),
    };
    if (unmounted) {
      this.state = state;
    } else {
      this.setState(state);
    }
  }

  render() {
    const {
      id,
      seed,
    } = this.state;
    return (
      <div id="game">
        <Board
          key={id}
          seed={seed}
          handleDeath={this.reset}
          multiplayer="none"
        />
      </div>
    );
  }
}

const domContainer = document.getElementById('game-single-wrapper');
render(<GameSingle />, domContainer);

// disable default for arrow keys
window.addEventListener('keydown', (e) => {
  // space and arrow keys
  if (new Set([32, 37, 38, 39, 40]).has(e.keyCode)) {
    e.preventDefault();
  }
}, false);
