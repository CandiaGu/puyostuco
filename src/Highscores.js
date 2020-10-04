import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import { withFirebase } from './firebase';
import withAuthUser from './withAuthUser';
import withAuthorization from './withAuthorization';

class Highscores extends React.Component {
  constructor(props) {
    super(props);
    const {
      authUser,
      firebase,
      match,
    } = props;
    this.numHighscores = 30;
    const { challenge } = match.params;
    this.challenge = challenge;
    const userRef = firebase.user(authUser.uid);
    this.highscoresRef = userRef.child('challenge').child(challenge);
    this.hwRef = userRef.child('hw');
    this.state = {
      loading: false,
      highscoresWithCounts: [],
    };
  }

  componentDidMount() {
    this.setState({ loading: true });
    this.highscoresRef.once('value', (highscoresSnapshot) => {
      const highscores = highscoresSnapshot.val() || [];
      let prev = {};
      this.setState({
        loading: false,
        highscoresWithCounts: highscores.map((highscore) => {
          const count = highscore === prev.highscore ? prev.count + 1 : 0;
          prev = { highscore, count };
          return prev;
        }),
      }, () => {
        this.hwRef.once('value', (hwCompletedSnapshot) => {
          const hwCompleted = hwCompletedSnapshot.val();
          if (!hwCompleted[0] && highscores.length >= this.numHighscores) {
            window.alert('HW1 completed!');
            hwCompleted[0] = true;
            this.hwRef.set(hwCompleted);
          }
        });
      });
    });
  }

  componentWillUnmount() {
    this.highscoresRef.off('value');
    this.hwRef.off('value');
  }

  render() {
    const {
      loading,
      highscoresWithCounts,
    } = this.state;
    return (
      <div id="highscores">
        <h1>{`${this.challenge.toUpperCase()} CHALLENGE`}</h1>
        {loading && <div>Loading...</div>}
        <ol id="highscores">
          {highscoresWithCounts.map(({ highscore, count }) => (
            <li
              key={`${highscore} ${count}`}
              className="highscore"
            >
              {highscore}
            </li>
          ))}
        </ol>
      </div>
    );
  }
}

const {
  string,
  shape,
  func,
} = PropTypes;

Highscores.propTypes = {
  authUser: shape({
    uid: string.isRequired,
  }).isRequired,
  firebase: shape({
    user: func.isRequired,
  }).isRequired,
  match: shape({
    params: shape({
      challenge: string.isRequired,
    }).isRequired,
  }).isRequired,
};

const condition = (authUser) => !!authUser;

export default withRouter(withFirebase(withAuthUser(withAuthorization(condition)(Highscores))));
