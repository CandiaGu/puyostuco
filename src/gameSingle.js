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

export default GameSingle;
