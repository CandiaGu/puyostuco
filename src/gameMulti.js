import React from 'react';
import PropTypes from 'prop-types';
import Board from './board.js';
import { randSeed, disableMovementKeyHandler } from './utils.js';

class GameMulti extends React.Component {
  constructor(props) {
    super(props);
    const { gameRef, playerNum } = this.props;
    this.gameRef = gameRef;
    this.playerNum = playerNum;

    this.seedRef = this.gameRef.child('seed');
    this.garbageListRef = this.gameRef.child('g');
    this.playerListRef = this.gameRef.child('p');
    this.loserRef = this.gameRef.child('loser');
    this.usernameListRef = this.gameRef.child('users');

    this.handleDeath = this.handleDeath.bind(this);

    this.state = {
      seed: undefined,
      loser: 'none',
      usernameList: [undefined, undefined],
    };

    if (this.playerNum === 0) {
      this.resetRefs();
    }
  }

  componentDidMount() {
    this.loserRef.on('value', (snapshot) => {
      if (snapshot.exists()) {
        const loser = snapshot.val();
        if (loser !== 'none' && loser !== this.playerNum) {
          // player is winner
          this.setState({ loser });
          this.loserRef.set('none');
        }
      }
    });
    this.seedRef.on('value', (snapshot) => {
      if (snapshot.exists()) {
        const seed = snapshot.val();
        if (seed !== 'none') {
          this.setState({ seed });
        }
      }
    });
    this.usernameListRef.on('value', (snapshot) => {
      if (snapshot.exists()) {
        const usernameList = snapshot.val();
        if (usernameList) {
          this.setState({ usernameList });
        }
      }
    });
    // disable default for arrow keys
    window.addEventListener('keydown', disableMovementKeyHandler, false);
  }

  componentWillUnmount() {
    this.loserRef.off('value');
    this.seedRef.off('value');
    window.removeEventListener('keydown', disableMovementKeyHandler, false);
  }

  resetRefs() {
    const initGarbage = { pending: 0, sentPlusDropped: 0 };
    this.garbageListRef.set([{ ...initGarbage }, { ...initGarbage }]);

    this.playerListRef.set([0, 0]);

    const { seed } = this.state;
    let newSeed;
    do {
      newSeed = randSeed();
    } while (newSeed === seed);
    this.seedRef.set(newSeed);
  }

  handleDeath() {
    this.loserRef.transaction((loser) => {
      if (loser === 'none') {
        this.setState({ loser: this.playerNum });
        setTimeout(this.resetRefs.bind(this), 0);
        return this.playerNum;
      }
      return loser;
    });
  }

  render() {
    const {
      seed,
      loser,
      usernameList,
    } = this.state;
    if (!seed) return null;
    return (
      <>
        <div>
          {'You: ' + (usernameList[this.playerNum] || 'connecting')}
        </div>
        <div>
          {'Loser: ' + (loser === 'none' ? 'none' : usernameList[loser])}
        </div>
        <div>
          {'Opponent: ' + (usernameList[1 - this.playerNum] || 'connecting')}
        </div>
        <div id="game">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            {
              [0, 1].map((i) => {
                const playerNum = (i + this.playerNum) % 2;
                return (
                  <Board
                    key={seed + i}
                    seed={seed}
                    handleDeath={this.handleDeath}
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
      </>
    );
  }
}

const {
  shape,
  func,
  number,
} = PropTypes;

GameMulti.propTypes = {
  gameRef: shape({
    child: func.isRequired,
  }).isRequired,
  playerNum: number.isRequired,
};

export default GameMulti;
