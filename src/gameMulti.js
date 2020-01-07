import React from 'react';
import PropTypes from 'prop-types';
import Board from './board.js';
import { randSeed, disableMovementKeyHandler } from './utils.js';
import Controller from './controller.js';
import { withFirebase } from './firebase.js';

class GameMulti extends React.Component {
  constructor(props) {
    super(props);
    const { firebase } = this.props;
    this.userId = 0;
    this.gameRef = firebase.ref().child('g');
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
      if (this.playerNum === 0) {
        this.seedRef.onDisconnect().remove();
      }
      this.userId = this.playerNum;
      this.userRef = this.userListRef.push(this.userId);
      this.userRef.onDisconnect().remove();
      if (this.playerNum === 0) {
        this.userListRef.on('child_added', (child) => {
          if (child.val() !== this.userId) {
            this.userListRef.off('child_added');
            this.userListRef.once('child_removed', () => {
              this.isMulti = false;
              this.reset();
            });
            this.resetRefs();
          }
        });
      } else {
        this.userListRef.once('child_removed', () => {
          this.isMulti = false;
          this.reset();
        });
      }
      this.seedRef.on('value', (seed) => {
        if (seed.exists()) {
          this.setState({ seed: seed.val() });
          this.isMulti = true;
          this.reset();
        }
      });
    });
    // disable default for arrow keys
    window.addEventListener('keydown', disableMovementKeyHandler, false);
  }

  componentWillUnmount() {
    this.userRef.remove();
    if (this.playerNum === 0) {
      this.seedRef.remove();
    }
    this.seedRef.off('value');
    this.userListRef.off('child_removed');
    this.controller.release();
    window.removeEventListener('keydown', disableMovementKeyHandler, false);
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
    const initGarbage = { pending: 0, sentPlusDropped: 0 };
    this.garbageListRef.set([{ ...initGarbage }, { ...initGarbage }]);
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

const {
  shape,
  func,
} = PropTypes;

GameMulti.propTypes = {
  firebase: shape({
    ref: func.isRequired,
  }).isRequired,
};

export default withFirebase(GameMulti);
