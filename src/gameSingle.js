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
      showHighscores,
    } = props;
    this.challenge = challenge;
    if (this.challenge !== 'none') {
      this.userRef = userRef;
    }
    if (!!this.userRef) {
      this.highscoresRef = this.userRef.child('challenge').child(challenge);
    }
    this.showHighscores = showHighscores;
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
      mode: 'game',
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
    if (!!this.userRef) {
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

  render() {
    const {
      id,
      seed,
      paused,
      mode,
    } = this.state;
    if (mode === 'highscores') {
      return (
        <Highscores
          challenge={this.challenge}
          userRef={this.userRef}
        />
      );
    }
    return (
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
  showHighscores: func,
};

GameSingle.defaultProps = {
  userRef: undefined,
  showHighscores: undefined,
};

export default GameSingle;
