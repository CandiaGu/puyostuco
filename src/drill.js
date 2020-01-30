import React from 'react';
import PropTypes from 'prop-types';
import Board from './board.js';
import { randSeed, disableMovementKeyHandler } from './utils.js';
import Controller from './controller.js';

class Drill extends React.Component {
  constructor(props) {
    super(props);
    const {
      drillInfo,
      endDrill,
    } = props;
    this.drillInfo = drillInfo;
    this.drill = this.drillInfo ? 'running' : 'adding';
    this.endDrill = endDrill;
    this.reset = this.reset.bind(this);
    this.createController();
    this.reset(true);
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
      reset: { f: this.reset },
    };
    const keys = {
      r: 'reset',
    };
    this.controller = new Controller(controls, keys);
  }

  reset(unmounted = false) {
    const key = (new Date()).getTime();
    const state = {
      id: key,
      seed: this.drill === 'running' ? this.drillInfo.seed : randSeed(),
    };
    if (unmounted) {
      this.state = state;
    } else {
      this.setState(state);
    }
  }

  render() {
    const {
      id,
      seed,
    } = this.state;
    return (
      <div id="game">
        <div style={{ display: 'flex', flexDireciton: 'row' }}>
          <Board
            key={id}
            seed={seed}
            handleDeath={this.reset}
            multiplayer="none"
            drill={this.drill}
            drillDropList={this.drill === 'running' ? this.drillInfo.dropList : undefined}
            endDrill={this.endDrill}
          />
        </div>
      </div>
    );
  }
}

const {
  shape,
  number,
  arrayOf,
  func,
} = PropTypes;

Drill.propTypes = {
  drillInfo: shape({
    seed: number.isRequired,
    dropList: arrayOf(shape({
      x1: number.isRequired,
      y1: number.isRequired,
      x2: number.isRequired,
      y2: number.isRequired,
    })).isRequired,
  }),
  endDrill: func.isRequired,
};

Drill.defaultProps = {
  drillInfo: undefined,
};

export default Drill;
