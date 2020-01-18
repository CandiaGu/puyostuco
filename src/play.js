import React from 'react';
import { FaLock } from 'react-icons/fa';
import { selectMultiplayer } from './script.js';
import Multiplayer from './multiplayer.js';
import { withAuthorization } from './session.js';

class Play extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      multiplayer: false,
    };
  }

  componentDidMount() {
    document.addEventListener('visibilitychange', this.onVisibilityChange, false);
  }

  componentWillUnmount() {
    document.removeEventListener('visibilitychange', this.onVisibilityChange, false);
  }

  onVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      this.setState({ multiplayer: false });
    }
  }

  render() {
    const { multiplayer } = this.state;
    if (multiplayer) {
      return <Multiplayer />;
    }
    return (
      <>
        <div id="play-options" className="play-options">
          {/* include keyboard listener and tabIndex for accessibility */}
          <a
            role="button"
            tabIndex={0}
            className="centered-box"
            onClick={() => this.setState({ multiplayer: true })}
            onKeyDown={() => this.setState({ multiplayer: true })}
          >
            <div className="play-option centered-box play-option-1">
              <h2>JOIN ROOM</h2>
            </div>
          </a>
          <a
            role="button"
            tabIndex={0}
            className="centered-box disabled-link"
            onClick={selectMultiplayer}
            onKeyDown={selectMultiplayer}
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
              <FaLock />
              <h2>CREATE ROOM</h2>
            </div>
          </a>

        </div>

        <div id="select-room" className="centered-box">
          <div className="select-room">
            <div>
              <form>
                <label htmlFor="rcode"><h3>ENTER ROOM CODE</h3></label>
                <input type="text" id="rcode" name="rcode" />
              </form>
            </div>
            <a
              role="button"
              tabIndex={0}
              className="centered-box select-room-option-1"
              onClick={() => this.setState({ multiplayer: true })}
              onKeyDown={() => this.setState({ multiplayer: true })}
            >
              <h3>CREATE ROOM</h3>
            </a>
            <div className="select-room-option-2">
              <h3>JOIN ROOM</h3>
              <p>No rooms have been created yet :o</p>
            </div>
          </div>
        </div>
      </>
    );
  }
}

const condition = (authUser) => !!authUser;

export default withAuthorization(condition)(Play);
