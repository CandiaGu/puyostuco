import React from 'react';
import PropTypes from 'prop-types';
import Multiplayer from './multiplayer.js';
import withAuthorization from './withAuthorization.js';
import { roomCodes } from './constants.js';

const INITIAL_STATE = {
  mode: 'none',
  roomCode: undefined,
  invalidCode: false,
  opponentLeft: false,
  youLeft: false,
};

class Play extends React.Component {
  constructor(props) {
    super(props);
    const {
      firebase,
    } = this.props;

    this.roomsRef = firebase.ref().child('rooms');

    this.state = { ...INITIAL_STATE };
  }

  componentDidMount() {
    document.addEventListener('visibilitychange', this.onVisibilityChange, false);
  }

  componentWillUnmount() {
    const {
      roomCode,
    } = this.state;
    document.removeEventListener('visibilitychange', this.onVisibilityChange, false);
    this.roomsRef.off('value');
    if (roomCode) {
      this.roomsRef.child(roomCode).off('value');
    }
  }

  onVisibilityChange = () => {
    const { mode } = this.state;
    if (document.visibilityState === 'hidden' && mode === 'game') {
      this.setState({
        ...INITIAL_STATE,
        youLeft: true,
      });
    }
  }

  createRoom = () => {
    this.roomsRef.once('value', (snapshot) => {
      let roomCode;
      do {
        const i = Math.floor(Math.random() * roomCodes.length);
        roomCode = roomCodes[i];
      } while (snapshot.hasChild(roomCode));
      this.setState({
        mode: 'game',
        roomCode,
      });
    });
  }

  changeCode = (event) => {
    this.setState({ roomCode: event.target.value });
  }

  submitCode = (event) => {
    const { roomCode } = this.state;
    if (roomCode) {
      this.roomsRef.child(roomCode).once('value', (snapshot) => {
        if (snapshot.exists()) {
          this.setState({ mode: 'game' });
        } else {
          this.setState({ invalidCode: true });
        }
      });
    }
    event.preventDefault();
  }

  opponentLeft = () => {
    this.setState({
      ...INITIAL_STATE,
      opponentLeft: true,
    });
  };

  render() {
    const {
      mode,
      roomCode,
      invalidCode,
      opponentLeft,
      youLeft,
    } = this.state;
    let component;
    switch (mode) {
      case 'game':
        component = (
          <>
            <Multiplayer
              opponentLeft={this.opponentLeft}
              roomCode={roomCode}
            />
            <div className="temp-controls">
        &#91;z/x or d/f&#93; to rotate | left/right arrow to move | down arrow to soft-drop
            </div>
          </>
        );
        break;
      case 'room':
        component = (
          <div id="select-room" className="centered-box">
            <div className="select-room">
              <a
                role="button"
                tabIndex={0}
                className="centered-box select-room-option-1"
                onClick={this.createRoom}
                onKeyDown={this.createRoom}
              >
                <h3>CREATE ROOM</h3>
              </a>
              <div style={{ textAlign: 'center' }}>
                or
              </div>
              <div>
                <form onSubmit={this.submitCode}>
                  <label htmlFor="rcode">
                    <h3>JOIN ROOM</h3>
                    <input
                      id="rcode"
                      name="roomCode"
                      value={roomCode || ''}
                      onChange={this.changeCode}
                      type="text"
                      placeholder="Enter Room Code"
                      autoComplete="off"
                    />
                  </label>
                </form>
                {invalidCode && (
                  <div style={{ color: 'red' }}>
                    Error: room not found
                  </div>
                )}
              </div>
            </div>
          </div>
        );
        break;
      case 'none':
      default:
        component = (
          <div id="play-options">
            {opponentLeft && (
              <h1 style={{ textAlign: 'center' }}>
                opponent left :-(
              </h1>
            )}
            {youLeft && (
              <h1 style={{ textAlign: 'center' }}>
                you left
              </h1>
            )}
            <div className="play-options">
              {/* include keyboard listener and tabIndex for accessibility */}
              <a
                role="button"
                tabIndex={0}
                className="centered-box"
                onClick={() => this.setState({ mode: 'game' })}
                onKeyDown={() => this.setState({ mode: 'game' })}
              >
                <div className="play-option centered-box play-option-1">
                  <h2>FIND OPPONENT</h2>
                </div>
              </a>
              <a
                role="button"
                tabIndex={0}
                className="centered-box"
                onClick={() => this.setState({ mode: 'room' })}
                onKeyDown={() => this.setState({ mode: 'room' })}
              >

                <div
                  className="play-option play-option-2 "
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <h2>CREATE/JOIN ROOM</h2>
                </div>
              </a>
            </div>
          </div>
        );
        break;
    }
    return component;
  }
}

const {
  shape,
  func,
} = PropTypes;

Play.propTypes = {
  firebase: shape({
    ref: func.isRequired,
  }).isRequired,
};

const condition = (authUser) => !!authUser;

export default withAuthorization(condition)(Play);
