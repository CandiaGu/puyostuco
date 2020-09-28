import React from 'react';
import PropTypes from 'prop-types';
import { withFirebase } from './firebase.js';
import withAuthUser from './withAuthUser.js';
import GameSingle from './gameSingle.js';
import Highscores from './highscores.js';
import Button from './button.js';

class Practice extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      mode: 'none',
      challenge: 'none',
    };
    this.history = [];
  }

  render() {
    const {
      mode,
      challenge,
    } = this.state;
    const { firebase, authUser } = this.props;
    let userRef;
    if (authUser) {
      userRef = firebase.user(authUser.uid);
    }
    let component = null;
    switch (mode) {
      case 'game':
        component = (
          <GameSingle
            challenge={challenge}
            userRef={userRef}
            showHighscores={() => {
              this.history.push({ mode, challenge });
              this.setState({ mode: 'highscores' });
            }}
          />
        );
        break;
      case 'highscores':
        if (challenge !== 'none') {
          component = (
            <Highscores
              challenge={challenge}
              userRef={userRef}
            />
          );
        } else {
          component = (
            <Button
              className="centered-box option practice-option"
              onClick={() => {
                this.setState({ challenge: 'score' });
              }}
              text="SCORE CHALLENGE HIGHSCORES"
            />
          );
        }
        break;
      case 'challenge':
        component = (
          <>
            <Button
              className="centered-box option practice-option"
              onClick={() => {
                this.history.push({ mode, challenge });
                this.setState({ mode: 'game', challenge: 'score' });
              }}
              text="SCORE CHALLENGE"
            />
            {!!authUser && (
              <Button
                className="centered-box option practice-option"
                onClick={() => {
                  this.history.push({ mode, challenge });
                  // 'score' instead of 'none' to bypass next page
                  this.setState({ mode: 'highscores', challenge: 'score' });
                }}
                text="HIGHSCORES"
              />
            )}
          </>
        );
        break;
      case 'none':
      default:
        component = (
          <>
            <Button
              className="centered-box option practice-option"
              onClick={() => {
                this.history.push({ mode, challenge });
                this.setState({ mode: 'game' });
              }}
              text="SOLO"
            />
            <Button
              className="centered-box option practice-option"
              onClick={() => {
                this.history.push({ mode, challenge });
                this.setState({ mode: 'challenge' });
              }}
              text="CHALLENGE"
            />
          </>
        );
    }
    return (
      <>
        <div id="options">
          {component}

        </div>
        {mode === 'game' && (
          <>
            <div className="temp-controls">
          &#91;z/x or d/f&#93; to rotate | left/right arrow to move | down arrow to soft-drop
            </div>
            <div className="temp-controls">
              {challenge === 'none' && ('[esc] to pause |')}
              {' '}
&#91;r&#93; to restart
            </div>
          </>
        )}
        {mode !== 'none' && (
          <Button
            className="return"
            onClick={() => {
              this.setState(this.history.pop());
            }}
            text="RETURN"
          />
        )}

      </>
    );
  }
}

const {
  shape,
  func,
  string,
} = PropTypes;

Practice.propTypes = {
  firebase: shape({
    user: func.isRequired,
  }).isRequired,
  authUser: shape({
    uid: string.isRequired,
  }),
};

Practice.defaultProps = {
  authUser: undefined,
};

export default withFirebase(withAuthUser(Practice));
