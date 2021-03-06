import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import Board from './board';
import { randSeed, disableMovementKeyHandler } from './utils';
import Controller from './controller';
import { withFirebase } from './firebase';
import withAuthUser from './withAuthUser';
import { PRACTICE_ROUTES as ROUTES } from './routes';

class GameSingle extends React.Component {
  constructor(props) {
    super(props);
    const {
      authUser,
      firebase,
      history,
      match,
    } = props;
    const { challenge = 'none' } = match.params;
    this.challenge = challenge;
    if (this.challenge !== 'none' && authUser) {
      this.userRef = firebase.user(authUser.uid);
    }
    if (this.userRef) {
      this.highscoresRef = this.userRef.child('challenge').child(challenge);
    }
    this.showHighscores = () => {
      history.push(`${match.url}${ROUTES.HIGHSCORES}/${challenge}`);
    };
    this.scoreChallengeTime = 60 * 1000;
    this.scoreChallengeExpiring = 9 * 1000;
    this.numHighscores = 30;
    this.reset = this.reset.bind(this);
    this.handleDeath = this.handleDeath.bind(this);
    this.setBoardPause = this.setBoardPause.bind(this);
    this.setGetScore = this.setGetScore.bind(this);
    this.setIsChaining = this.setIsChaining.bind(this);
    this.createController();
    this.reset(true);
    this.isChaining = false;
  }

  componentDidMount() {
    // disable default for arrow keys
    window.addEventListener('keydown', disableMovementKeyHandler, false);
  }

  componentWillUnmount() {
    this.controller.release();
    window.removeEventListener('keydown', disableMovementKeyHandler, false);
  }

  setBoardPause(boardPause) {
    this.boardPause = boardPause;
  }

  setGetScore(getScore) {
    this.getScore = getScore;
  }

  setIsChaining(isChaining) {
    this.isChaining = isChaining;
    if (!isChaining && this.didChallengeEnd) {
      this.endScoreChallenge();
      return true;
    }
    return false;
  }

  setTimeElapsed() {
    const timeElapsed = Date.now() - this.effectiveStartTime;
    if (this.challenge === 'score' && timeElapsed >= this.scoreChallengeTime) {
      if (!this.didChallengeEnd) {
        this.didChallengeEnd = true;
        if (!this.isChaining) {
          this.endScoreChallenge();
        }
      }
    }
    this.setState({ timeElapsed });
  }

  createController() {
    const controls = {
      reset: { f: this.reset },
      pause: { f: this.pause.bind(this) },
    };
    const keys = {
      r: 'reset',
      ...this.challenge === 'none' ? { Escape: 'pause' } : {},
    };
    this.controller = new Controller(controls, keys);
  }

  reset(unmounted = false) {
    this.didChallengeEnd = false;
    const key = (new Date()).getTime();
    const state = {
      id: key,
      seed: randSeed(),
      timeElapsed: 0,
      paused: false,
    };
    if (unmounted) {
      this.state = state;
    } else {
      this.setState(state);
    }
    this.effectiveStartTime = Date.now();
    this.timer = setInterval(() => {
      const { paused } = this.state;
      if (!paused) {
        this.setTimeElapsed();
      }
    }, 17);
  }

  endScoreChallenge() {
    if (this.userRef) {
      clearInterval(this.timer);
      this.boardPause();
      setTimeout(() => {
        this.highscoresRef.once('value', (snapshot) => {
          const highscores = [...(snapshot.val() || []), this.getScore()]
            .sort((a, b) => a - b)
            .reverse()
            .slice(0, this.numHighscores);
          this.highscoresRef.set(highscores, this.showHighscores);
        });
      }, 1000);
    } else {
      this.reset();
    }
  }

  pause() {
    this.setState(({ paused }) => {
      if (!paused) {
        this.pauseStartTime = Date.now();
        setTimeout(() => {
          this.setTimeElapsed();
        }, 0);
      } else {
        setTimeout(() => {
          this.effectiveStartTime += Date.now() - this.pauseStartTime;
          this.setTimeElapsed();
        }, 0);
      }
      this.boardPause();
      return { paused: !paused };
    });
  }

  handleDeath() {
    if (this.challenge === 'score') {
      this.endScoreChallenge();
    } else {
      this.reset();
    }
  }

  renderTime() {
    let { timeElapsed } = this.state;
    if (this.challenge === 'score') {
      timeElapsed = this.scoreChallengeTime - timeElapsed;
    }
    let negative = false;
    if (timeElapsed < 0) {
      negative = true;
      timeElapsed = -timeElapsed;
    }
    const hundredthsPerMillisecond = 10;
    const hundredthsPerSecond = 100;
    const secondsPerMinute = 60;
    const maxMinutes = 99;
    const totalHundredths = Math.floor(timeElapsed / hundredthsPerMillisecond);
    let hundredths = totalHundredths % hundredthsPerSecond;
    const totalSeconds = Math.floor(totalHundredths / hundredthsPerSecond);
    let seconds = totalSeconds % secondsPerMinute;
    const totalMinutes = Math.floor(totalSeconds / secondsPerMinute);
    let minutes = totalMinutes;
    if (totalMinutes > maxMinutes) {
      hundredths = hundredthsPerSecond - 1;
      seconds = secondsPerMinute - 1;
      minutes = maxMinutes;
    }
    const hundredthsStr = String(hundredths).padStart(2, '0');
    const secondsStr = String(seconds).padStart(2, '0');
    const minutesStr = String(minutes).padStart(2, '0');
    const negativeStr = negative ? '-' : '';
    let className = '';
    if (
      this.challenge === 'score'
      && (timeElapsed < this.scoreChallengeExpiring || negative)
    ) {
      className = 'expiring';
    }
    return (
      <div id="time" className={className}>
        {`${negativeStr}${minutesStr}:${secondsStr}.${hundredthsStr}`}
      </div>
    );
  }

  render() {
    const {
      id,
      seed,
      paused,
    } = this.state;
    return (
      <>
        <div id="game">
          <div style={{ display: 'flex', flexDireciton: 'row' }}>
            <div style={{ width: '280px' }}>
              {this.renderTime()}
            </div>
            <Board
              key={id}
              seed={seed}
              handleDeath={this.handleDeath}
              multiplayer="none"
              paused={paused}
              setBoardPause={this.setBoardPause}
              setGetScore={this.setGetScore}
              challenge={this.challenge}
              setIsChaining={this.setIsChaining}
            />
          </div>
        </div>
        <div className="temp-controls">
      &#91;z/x or d/f&#93; to rotate | left/right arrow to move | down arrow to soft-drop
        </div>
        <div className="temp-controls">
          {this.challenge === 'none' && ('[esc] to pause |')}
          {' '}
&#91;r&#93; to restart
        </div>
      </>
    );
  }
}

const {
  string,
  shape,
  func,
} = PropTypes;

GameSingle.propTypes = {
  authUser: shape({
    uid: string.isRequired,
  }),
  firebase: shape({
    user: func.isRequired,
  }).isRequired,
  history: shape({
    push: func.isRequired,
  }).isRequired,
  match: shape({
    params: shape({
      challenge: string,
    }).isRequired,
    url: string.isRequired,
  }).isRequired,
};

GameSingle.defaultProps = {
  authUser: undefined,
};

export default withRouter(withFirebase(withAuthUser(GameSingle)));
