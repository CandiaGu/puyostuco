import React from 'react';
import PropTypes from 'prop-types';
import Board from './board';
import { randSeed, disableMovementKeyHandler } from './utils';

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
    this.setIsChaining = this.setIsChaining.bind(this);

    this.state = {
      game: 0,
      seed: undefined,
      usernameList: [undefined, undefined],
      scores: [0, 0],
    };

    this.result = 'none';

    if (this.playerNum === 0) {
      this.resetRefs();
    }
    this.isChaining = false;
  }

  componentDidMount() {
    this.loserRef.on('value', (snapshot) => {
      if (snapshot.exists()) {
        const { game: currGame } = this.state;
        const { game: loserGame, loser: currLoser } = snapshot.val();
        if (loserGame === currGame && currLoser === 1 - this.playerNum) {
          this.loserRef.transaction(({ game, loser }) => {
            if (game === currGame && loser === 1 - this.playerNum) {
              return { game: game + 1, loser: 'none' };
            }
            return { game, loser };
          }, (error, committed) => {
            if (committed) {
              // player is winner
              this.result = 'won';
              this.didIWin = true;
              if (!this.isChaining) {
                this.handleWin();
              }
            }
          });
        }
      }
    });
    this.seedRef.on('value', (snapshot) => {
      if (snapshot.exists()) {
        const seed = snapshot.val();
        if (seed !== 'none') {
          if (this.result !== 'none') {
            this.setState((state) => {
              const scores = [...state.scores];
              if (this.result === 'won') {
                scores[0]++;
              } else if (this.result === 'lost') {
                scores[1]++;
              }
              return { scores };
            });
          }
          this.setState(({ game }) => ({ game: game + 1, seed }));
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

  setIsChaining(isChaining) {
    this.isChaining = isChaining;
    if (!isChaining && this.didIWin) {
      this.handleWin();
      return true;
    }
    return false;
  }

  handleDeath(currGame) {
    this.loserRef.transaction(({ game, loser }) => {
      if (game === currGame && loser === 'none') {
        this.result = 'lost';
        return { game, loser: this.playerNum };
      }
      return { game, loser };
    });
  }

  resetRefs() {
    this.didIWin = false;
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

  handleWin() {
    this.resetRefs();
  }

  renderBoard(i) {
    const {
      game,
      seed,
    } = this.state;
    const playerNum = (i + this.playerNum) % 2;
    return (
      <div style={{ display: 'flex', flexDireciton: 'row' }}>
        <Board
          key={`${game}${i}`}
          seed={seed}
          handleDeath={() => { this.handleDeath(game); }}
          multiplayer={i === 0 ? 'send' : 'receive'}
          myGarbageRef={this.garbageListRef.child(playerNum)}
          oppGarbageRef={this.garbageListRef.child(1 - playerNum)}
          playerRef={this.playerListRef.child(playerNum)}
          setIsChaining={i === 0 ? this.setIsChaining : undefined}
        />
      </div>
    );
  }

  render() {
    const {
      seed,
      usernameList,
      scores,
    } = this.state;
    if (!seed) return null;
    return (
      <>
        <div id="game">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
            <div>
              <h3>
                {usernameList[this.playerNum]}
                {' '}
&emsp;Wins:
                {' '}
                {scores[0]}
              </h3>
              {this.renderBoard(0)}
            </div>
            <div />
            <div>
              <h3>
                {usernameList[1 - this.playerNum]}
                {' '}
&emsp;Wins:
                {' '}
                {scores[1]}
              </h3>
              {this.renderBoard(1)}
            </div>

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
