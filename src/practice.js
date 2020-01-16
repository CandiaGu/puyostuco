import React from 'react';
import PropTypes from 'prop-types';
import { withFirebase } from './firebase.js';
import { withAuthUser } from './session.js';
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
    if (!!authUser) {
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
              this.history.push(mode);
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
              className="centered-box practice-option"
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
              className="centered-box practice-option"
              onClick={() => {
                this.history.push(mode);
                this.setState({ mode: 'game', challenge: 'score' });
              }}
              text="SCORE CHALLENGE"
            />
            {!!authUser && (
              <Button
              className="centered-box practice-option"
                onClick={() => {
                  this.history.push(mode);
                  this.setState({ mode: 'highscores', challenge: 'none' });
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
              className="centered-box practice-option"
              onClick={() => {
                this.history.push(mode);
                this.setState({ mode: 'game' });
              }}
              text="SOLO"
            />
            <Button
              className="centered-box practice-option"
              onClick={() => {
                this.history.push(mode);
                this.setState({ mode: 'challenge' });
              }}
              text="CHALLENGE"
            />
          </>
        );
    }
    return (
      <>
        <div id="practice-options">
          {component}
        </div>
        {mode !== 'none' && (
          <Button
            className="return"
            onClick={() => {
              const back = this.history.pop();
              this.setState({ mode: back });
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
