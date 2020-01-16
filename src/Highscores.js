import React from 'react';
import PropTypes from 'prop-types';

class Highscores extends React.Component {
  constructor(props) {
    super(props);
    const {
      challenge,
      userRef,
    } = props;
    this.challenge = challenge;
    this.highscoresRef = userRef.child('challenge').child(challenge);
    this.state = {
      loading: false,
      highscores: [],
    };
  }

  componentDidMount() {
    this.setState({ loading: true });
    this.highscoresRef.once('value', (snapshot) => {
      this.setState({
        loading: false,
        highscores: snapshot.val() || [],
      });
    });
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
              key={i}
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
