import React from 'react';
import { render } from 'react-dom';
import Board from './board.js';
import '../styles/style.css';
import { random } from './utils.js';
import Controller from './controller.js';

class Game extends React.Component {
  constructor(props) {
    super(props);
    this.numPlayers = 2;
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
    };
    this.reset = this.reset.bind(this);
    this.createController();
    this.reset(true);
  }

  createController() {
    const that = this;
    const controls = {
      reset: { f: this.reset, delay: 0, repeat: 0 },
      garbage: {
        f: () => {
          const g = 5;
          that.setState(({ players }) => ({
            players: players.map((player) => ({ ...player, garbage: player.garbage + g })),
          }));
        },
        delay: 0,
        repeat: 0,
      },
    };
    const keys = {
      Escape: 'reset',
      t: 'garbage',
    };
    this.controller = new Controller(controls, keys);
  }

  reset(unmounted) {
    const key = (new Date()).getTime();
    const numSeq = 65536;
    const state = {
      players: Array.from({ length: this.numPlayers }, (_, i) => ({
        id: key + i,
        garbage: 0,
      })),
      seed: random(numSeq),
    };
    if (unmounted) {
      this.state = state;
    } else {
      this.setState(state);
    }
  }

  render() {
    const {
      players,
      seed,
    } = this.state;
    return (
      <div id="game">
        {
          players.map(({
            id,
            garbage,
          }, i) => (
            <Board
              key={id}
              keys={this.keys}
              seed={seed}
              handleDeath={this.reset}
              isMulti={this.numPlayers > 1}
              garbageCount={garbage}
              sendGarbage={(g) => {
                this.setState((state) => {
                  const newPlayers = [...state.players];
                  newPlayers[1 - i] = {
                    ...newPlayers[1 - i],
                    garbage: newPlayers[1 - i].garbage + Math.max(0, g - newPlayers[i].garbage),
                  };
                  newPlayers[i] = {
                    ...newPlayers[i],
                    garbage: Math.max(0, newPlayers[i].garbage - g),
                  };
                  return { players: newPlayers };
                });
              }}
              droppedGarbage={() => {
                this.setState((state) => {
                  const newPlayers = [...state.players];
                  newPlayers[i] = {
                    ...newPlayers[i],
                    garbage: Math.max(0, newPlayers[i].garbage - this.rockGarbage),
                  };
                  return { players: newPlayers };
                });
              }}
            />
          ))
        }
      </div>
    );
  }
}

const domContainer = document.getElementById('game-wrapper');
render(<Game />, domContainer);

// disable default for arrow keys
window.addEventListener('keydown', (e) => {
  // space and arrow keys
  if (new Set([32, 37, 38, 39, 40]).has(e.keyCode)) {
    e.preventDefault();
  }
}, false);
