import Board from './board.js';

class Game extends React.Component {
  render() {
    return (
      <div className="game-wrapper">
        <div />
        <div className="margin-auto">
          <div className="game">
            <Board />
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
  if (new Set([32, 37, 38, 39, 40]).has(e.keyCode)) {
    e.preventDefault();
  }
}, false);
