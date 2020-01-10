import React from 'react';
import { Link } from 'react-router-dom';
import { selectMultiplayer } from './script.js';
import Multiplayer from './multiplayer.js';
import * as ROUTES from './routes.js';

class Play extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      multiplayer: false,
    };
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
            className="centered-box"
            onClick={selectMultiplayer}
            onKeyDown={selectMultiplayer}
          >
            <div className="play-option centered-box play-option-2">
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

export default Play;
