import React from 'react';
import PropTypes from 'prop-types';

class Highscores extends React.Component {
  constructor(props) {
    super(props);
    const {
      challenge,
      userRef,
    } = props;
    this.numHighscores = 30;
    this.challenge = challenge;
    this.highscoresRef = userRef.child('challenge').child(challenge);
    this.hwRef = userRef.child('hw');
    this.state = {
      loading: false,
      highscores: [],
    };
  }

  componentDidMount() {
    this.setState({ loading: true });
    this.highscoresRef.once('value', (highscoresSnapshot) => {
      const highscores = highscoresSnapshot.val() || [];
      this.setState({
        loading: false,
        highscores,
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
      highscores,
    } = this.state;
    return (
      <div id="highscores">
        <h1>{`${this.challenge.toUpperCase()} CHALLENGE`}</h1>
        {loading && <div>Loading...</div>}
        <ol id="highscores">
          {highscores.map((highscore, i) => (
            <li
              key={`${highscore}${i}`}
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
  challenge: string.isRequired,
  userRef: shape({
    child: func.isRequired,
  }).isRequired,
};

export default Highscores;
