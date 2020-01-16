import React from 'react';
import GameSingle from './gameSingle.js';
import Challenge from './challenge.js';

class Practice extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      mode: 'none',
    };
  }

  render() {
    const { mode } = this.state;
    switch (mode) {
      case 'solo': return <GameSingle challenge="none" />;
      case 'challenge': return <Challenge />;
      default: return (
        <>
          <a
            role="button"
            tabIndex={0}
            onClick={() => { this.setState({ mode: 'solo' }); }}
            onKeyDown={() => { this.setState({ mode: 'solo' }); }}
          >
            <h2>SOLO</h2>
          </a>
          <a
            role="button"
            tabIndex={0}
            onClick={() => { this.setState({ mode: 'challenge' }); }}
            onKeyDown={() => { this.setState({ mode: 'challenge' }); }}
          >
            <h2>CHALLENGE</h2>
          </a>
        </>
      );
    }
  }
}

export default Practice;
