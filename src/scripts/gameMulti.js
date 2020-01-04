import React from 'react';
import { render } from 'react-dom';
import 'firebase/database';
import Board from './board.js';
import '../styles/style.css';
import { randSeed } from './utils.js';
import Controller from './controller.js';
import firebase from './firebase.js';

class GameMulti extends React.Component {
  constructor(props) {
    super(props);
    this.userId = 0;
    this.gameRef = firebase.database().ref('g');
    this.userListRef = this.gameRef.child('u');
    this.seedRef = this.gameRef.child('s');
    this.garbageListRef = this.gameRef.child('g');
    this.playerListRef = this.gameRef.child('p');
    this.reset = this.reset.bind(this);
    this.createController();
    this.isMulti = false;
    this.handleDeath = this.handleDeath.bind(this);
  }

  componentDidMount() {
    this.userListRef.once('value', (userList) => {
      this.playerNum = userList.numChildren();
      this.userId = this.playerNum;
      this.userRef = this.userListRef.push(this.userId);
      this.userRef.onDisconnect().remove();
      if (this.playerNum === 0) {
        this.userListRef.on('child_added', (child) => {
          if (child.val() !== this.userId) {
            this.userListRef.off('child_added');
            this.resetRefs();
            this.seedRef.onDisconnect().remove();
          }
        });
      }
      this.seedRef.on('value', (seed) => {
        if (seed.exists()) {
          this.setState({ seed: seed.val() });
          this.isMulti = true;
          this.reset();
        }
      });
      this.userListRef.on('child_removed', () => {
        this.isMulti = false;
        this.reset();
      });
    });
  }

  componentWillUnmount() {
    this.seedRef.off('value');
    this.userListRef.off('child_removed');
  }

  createController() {
    const controls = {
      reset: { f: this.handleDeath.bind(this), delay: 0, repeat: 0 },
    };
    const keys = {
      Escape: 'reset',
    };
    this.controller = new Controller(controls, keys);
  }

  reset() {
    const key = (new Date()).getTime();
    this.setState({
      keyList: [key + '0', key + '1'],
    });
  }

  resetRefs() {
    this.garbageListRef.set([0, 0]);
    this.playerListRef.set([0, 0]);
    this.seedRef.set(randSeed());
  }

  handleDeath() {
    this.resetRefs();
  }

  render() {
    if (!this.isMulti) return null;
    const {
      keyList,
      seed,
    } = this.state;
    return (
      <div id="game">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          {
            [0, 1].map((i) => {
              const playerNum = (i + this.playerNum) % 2;
              return (
                <Board
                  key={keyList[i]}
                  seed={seed}
                  handleDeath={i === 0 ? this.handleDeath : undefined}
                  multiplayer={i === 0 ? 'send' : 'receive'}
                  myGarbageRef={this.garbageListRef.child(playerNum)}
                  oppGarbageRef={this.garbageListRef.child(1 - playerNum)}
                  playerRef={this.playerListRef.child(playerNum)}
                />
              );
            })
          }
        </div>
      </div>
    );
  }
}

const domContainer = document.getElementById('game-multi-wrapper');
render(<GameMulti />, domContainer);

// disable default for arrow keys
window.addEventListener('keydown', (e) => {
  // space and arrow keys
  if (new Set([32, 37, 38, 39, 40]).has(e.keyCode)) {
    e.preventDefault();
  }
}, false);
