import React from 'react';
import PropTypes from 'prop-types';
import Loader from 'react-dots-loader';
import { withFirebase } from './firebase';
import withAuthUser from './withAuthUser';
import GameMulti from './gameMulti';
import 'react-dots-loader/index.css';

class Multiplayer extends React.Component {
  constructor(props) {
    super(props);
    const {
      firebase,
      authUser,
      opponentLeft,
      roomCode,
    } = this.props;
    this.baseRef = firebase.ref();
    this.findUser = firebase.user;
    this.uid = authUser.uid;
    this.userRef = this.findUser(this.uid);

    this.opponentLeftParent = opponentLeft;

    this.roomCode = roomCode;
    if (!this.roomCode) {
      this.waiterRef = this.baseRef.child('w');
    } else {
      this.waiterRef = this.baseRef.child('rooms').child(roomCode);
    }

    this.gameListRef = this.baseRef.child('g');

    this.state = {
      gameActive: false,
    };

    this.waiting = false;
    this.findOpponent();
  }

  componentWillUnmount() {
    if (this.myPresenceRef) {
      this.myPresenceRef.set(false);
    }
    if (this.oppPresenceRef) {
      this.oppPresenceRef.off('value');
    }
    if (this.waiting) {
      this.waiterRef.remove();
    }
  }

  findOpponent() {
    let opponent;
    this.waiterRef.transaction((waiter) => {
      if (!waiter) {
        this.playerNum = 0;
        return this.uid;
      }
      this.playerNum = 1;
      opponent = waiter;
      return null;
    }, () => {
      if (opponent) {
        this.gameListRef.push({
          seed: 'none',
          loser: { game: 1, loser: 'none' },
          users: ['', ''],
        }).then(({ key }) => {
          const oppRef = this.findUser(opponent);
          const usersRef = this.gameListRef.child(key).child('users');
          oppRef.child('username').once('value', (snapshot) => {
            usersRef.child(0).set(snapshot.val());
          });
          this.userRef.child('username').once('value', (snapshot) => {
            usersRef.child(1).set(snapshot.val());
          });
          this.myPresenceRef = oppRef.child('oppPresence');
          this.myPresenceRef.onDisconnect().set(false);
          this.oppPresenceRef = oppRef.child('myPresence');
          oppRef.child('game').set(key, () => {
            this.myPresenceRef.set(true, () => {
              this.startGame(key);
            });
          });
        });
      } else {
        this.waiting = true;
        const onDisconnectRef = this.waiterRef.onDisconnect();
        onDisconnectRef.remove();
        this.myPresenceRef = this.userRef.child('myPresence');
        this.myPresenceRef.set(true);
        this.myPresenceRef.onDisconnect().set(false);
        this.oppPresenceRef = this.userRef.child('oppPresence');
        this.oppPresenceRef.set(false, () => {
          this.oppPresenceRef.on('value', (snapshot) => {
            if (snapshot.exists() && snapshot.val() === true) {
              this.waiting = false;
              onDisconnectRef.cancel();
              this.oppPresenceRef.off('value');
              const gameRef = this.userRef.child('game');
              gameRef.once('value', (game) => {
                this.startGame(game.val());
              });
            }
          });
        });
      }
    });
  }

  startGame(gameKey) {
    this.gameRef = this.gameListRef.child(gameKey);
    this.setState({ gameActive: true });
    this.oppPresenceRef.on('value', (snapshot) => {
      if (snapshot.exists() && !snapshot.val()) {
        this.opponentLeft();
      }
    });
  }

  opponentLeft() {
    this.oppPresenceRef.off('value');
    this.setState({
      gameActive: false,
    });
    this.gameRef.remove();
    // this.findOpponent();
    this.opponentLeftParent();
  }

  render() {
    const {
      gameActive,
    } = this.state;
    if (!gameActive) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: '5vh',
        }}
        >
          {this.roomCode && (
            <h1>
              {`room code: ${this.roomCode}`}
            </h1>
          )}
          <h1>waiting for another player to join :o</h1>
          <Loader size={10} />
        </div>
      );
    }
    return (
      <GameMulti
        gameRef={this.gameRef}
        playerNum={this.playerNum}
      />
    );
  }
}

const {
  shape,
  func,
  string,
} = PropTypes;

Multiplayer.propTypes = {
  firebase: shape({
    ref: func.isRequired,
  }).isRequired,
  authUser: shape({
    uid: string.isRequired,
  }).isRequired,
  opponentLeft: func.isRequired,
  roomCode: string,
};

Multiplayer.defaultProps = {
  roomCode: undefined,
};

export default withAuthUser(withFirebase(Multiplayer));
