import Board from './board.js';

class Game extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      height: 12,
      width: 6,
    };
  }

  render() {
    const { height, width } = this.state;
    return (
      <div className="game-wrapper">
        <div />
        <div className="margin-auto">
          <div className="game">
            <Board height={height} width={width} />
          </div>
        </div>
        <div />
      </div>
    );
  }
}

const domContainer = document.querySelector('#game');
ReactDOM.render(<Game />, domContainer);

// disable default for arrow keys
window.addEventListener('keydown', (e) => {
  // space and arrow keys
  if ([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
    e.preventDefault();
  }
}, false);
