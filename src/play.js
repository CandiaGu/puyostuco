import React from 'react';
import { Link } from 'react-router-dom';
import { selectMultiplayer } from './script.js';
import * as ROUTES from './routes.js';

const Play = () => (
  <>
    <div id="play-options" className="play-options">
      {/* include keyboard listener and tabIndex for accessibility */}
      <a
        role="button"
        tabIndex={0}
        className="centered-box"
        onClick={selectMultiplayer}
        onKeyDown={selectMultiplayer}
      >
        <div className="play-option centered-box play-option-1">
          <h2>JOIN ROOM</h2>
        </div>
      </a>
      <Link className="centered-box" to={ROUTES.PRACTICE}>
        <div className="play-option centered-box play-option-2">
          <h2>PLAY CPU</h2>
        </div>
      </Link>
    </div>

    <div id="select-room" className="centered-box">
      <div className="select-room">
        <div>
          <form>
            <label htmlFor="rcode"><h3>ENTER ROOM CODE</h3></label>
            <input type="text" id="rcode" name="rcode" />
          </form>
        </div>
        <Link className="centered-box select-room-option-1" to={ROUTES.MULTIPLAYER}>
          <h3>CREATE ROOM</h3>
        </Link>
        <div className="select-room-option-2">
          <h3>JOIN ROOM</h3>
          <p>No rooms have been created yet :o</p>
        </div>
      </div>
    </div>
  </>
);

export default Play;
