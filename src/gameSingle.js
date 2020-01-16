import React from 'react';
import PropTypes from 'prop-types';
import Board from './board.js';
import { randSeed, disableMovementKeyHandler } from './utils.js';
import Controller from './controller.js';

class GameSingle extends React.Component {
  constructor(props) {
    super(props);
    const {
      challenge,
      userRef,
    } = props;
    this.challenge = challenge;
    if (userRef) {
      this.highscoresRef = userRef.child('challenge').child(challenge);
    }
    this.scoreChallengeTime = 20 * 1000;
    this.scoreChallengeExpiring = 9 * 1000;
    this.numHighscores = 5;
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
    this.loadHighscores();
  }

  componentWillUnmount() {
    this.controller.release();
    window.removeEventListener('keydown', disableMovementKeyHandler, false);
  }

  createController() {
    const controls = {
      reset: { f: this.reset, delay: 0, repeat: 0 },
      pause: { f: this.pause.bind(this), delay: 0, repeat: 0 },
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
      highscores: [],
    };
    if (unmounted) {
      this.state = state;
    } else {
      if (this.highscoresRef) {
        this.highscoresRef.off('child_added');
      }
      this.setState(state, this.loadHighscores);
    }
    this.effectiveStartTime = Date.now();
    setInterval(() => {
      const { paused } = this.state;
      if (!paused) {
        this.setTimeElapsed();
      }
    }, 17);
  }

  loadHighscores() {
    if (this.highscoresRef) {
      this.highscoresRef.on('child_added', (snapshot) => {
        if (snapshot.exists()) {
          this.setState(({ highscores }) => ({
            highscores: [...highscores, snapshot.val()],
          }));
        }
      });
    }
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

  endScoreChallenge() {
    if (this.highscoresRef) {
      const { highscores } = this.state;
      const newHighscores = [...highscores, this.getScore()]
        .sort((a, b) => a - b)
        .reverse()
        .slice(0, this.numHighscores);
      this.highscoresRef.set(newHighscores, this.reset);
    } else {
      this.reset();
    }
  }

  handleDeath() {
    if (this.challenge === 'score') {
      this.endScoreChallenge();
    } else {
      this.reset();
    }
  }

  setIsChaining(isChaining) {
    this.isChaining = isChaining;
    if (!isChaining && this.didChallengeEnd) {
      this.endScoreChallenge();
      return true;
    }
    return false;
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
          this.setTimeElapsed(time);
        }, 0);
      }
      this.boardPause();
      return { paused: !paused };
    });
  }

  setGetScore(getScore) {
    this.getScore = getScore;
  }

  setBoardPause(boardPause) {
    this.boardPause = boardPause;
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
      && timeElapsed < this.scoreChallengeExpiring || negative
    ) {
      className = 'expiring';
    }
    return (
      <div id="time" className={className}>
        {`${negativeStr}${minutesStr}:${secondsStr}.${hundredthsStr}`}
      </div>
    );
  }

  renderHighscores() {
    if (!this.highscoresRef) return null;
    const {
      id,
      highscores,
    } = this.state;
    return (
      <ol id="highscores">
        {highscores.map((highscore, i) => (
          <li key={id + '' + i}>
            {highscore}
          </li>
        ))}
      </ol>
    );
  }

  render() {
    const {
      id,
      seed,
      paused,
    } = this.state;
    return (
      <div id="game">
        <div style={{ display: 'flex', flexDireciton: 'row' }}>
          <div style={{ width: '280px' }}>
            {this.renderTime()}
            {this.renderHighscores()}
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
    );
  }
}

const {
  string,
  shape,
  func,
} = PropTypes;

GameSingle.propTypes = {
  challenge: string.isRequired,
  userRef: shape({
    child: func.isRequired,
  }),
};

GameSingle.defaultProps = {
  userRef: undefined,
};

export default GameSingle;
