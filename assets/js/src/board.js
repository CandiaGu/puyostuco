import Cell from './cell.js';

const puyoColorCount = 4;

class Board extends React.Component {
  static createEmptyArray(height, width) {
    return Array.from({ length: height }, (_, i) => Array.from({ length: width }, (_, j) => ({
      x: i,
      y: j,
      isEmpty: false,
      puyoColor: 0,
    })));
  }

  static spawnPuyo(dataArg) {
    const data = dataArg;
    // spawn puyo
    // third column vertical
    data[0][2].puyoColor = Math.floor(Math.random() * puyoColorCount) + 1;
    data[1][2].puyoColor = Math.floor(Math.random() * puyoColorCount) + 1;
    return data;
  }

  // Gets initial board data
  static initBoardData(height, width) {
    return Board.spawnPuyo(Board.createEmptyArray(height, width));
  }

  static checkIfAlreadyVisited(x, y, checkedLocations) {
    if (x in checkedLocations) {
      return checkedLocations[x].has(y);
    }
    return false;
  }

  static renderBoard(data) {
    return data.map((datarow) => datarow.map((dataitem) => (
      <div key={dataitem.x * datarow.length + dataitem.y}>
        <Cell value={dataitem} />
        { (datarow[datarow.length - 1] === dataitem) ? <div className="clear" /> : '' }
      </div>
    )));
  }

  constructor(props) {
    super(props);
    const { height, width } = this.props;
    this.state = {
      boardData: Board.initBoardData(height, width),
      locked: 0,
      currPuyo1: [2, 0], // [x, y]
      currPuyo2: [2, 1],
    };

    this.moveCurrPuyo = this.moveCurrPuyo.bind(this);
    this.keyControlsFunction = this.keyControlsFunction.bind(this);
    this.puyoLockFunctions = this.puyoLockFunctions.bind(this);
  }

  componentDidMount() {
    document.addEventListener('keydown', this.keyControlsFunction, false);
  }

  puyoLockFunctions() {
    const {
      currPuyo1: puyo1,
      currPuyo2: puyo2,
      boardData: data,
    } = this.state;
    const color1 = data[puyo1[1]][puyo1[0]].puyoColor;
    const color2 = data[puyo2[1]][puyo2[0]].puyoColor;
    console.log('colors: ' + color1 + ' ' + color2);
    // check if puyo still at lowest pos
    if (
      puyo1[1] < this.findLowestPosition(puyo1[0])
      && puyo2[1] < this.findLowestPosition(puyo2[0])
    ) {
      return;
    }
    this.setState({ locked: 1 });

    const puyosToPop1 = this.checkPuyoPop(puyo1[0], puyo1[1]);
    let puyosToPop2;
    if (color1 === color2) {
      puyosToPop2 = new Set();
    } else {
      puyosToPop2 = this.checkPuyoPop(puyo2[0], puyo2[1]);
    }


    // pop puyos
    if (puyosToPop1.size > 0) {
      this.popPuyos(puyosToPop1);
    }

    if (puyosToPop2.size > 0) {
      this.popPuyos(puyosToPop2);
    }

    console.log('Dropping puyo...' + puyosToPop1.size + ' ' + puyosToPop2.size);
    // drop puyos
    this.dropPuyo([...puyosToPop1, ...puyosToPop2]);

    this.spawnNewPuyo();
  }

  // drop all puyos in the same col above x, y
  dropPuyo(poppedPuyos) {
    const { boardData: data } = this.state;
    const { height } = this.props;
    const checkedCols = new Set();
    poppedPuyos.forEach((val) => {
      const valX = val[0];
      const valY = val[1];
      console.log('checking x: ' + valX + ' for puyo at ' + valX + ' ' + valY);
      if (checkedCols.has(valX)) return;
      checkedCols.add(valX);
      console.log('actually checking x: ' + valX);

      // find the puyo above empty space (all the way above the board if no puyo)
      let highY = valY;
      while (highY >= 0 && data[highY][valX].puyoColor === 0) {
        console.log('Dropping puyo... ' + highY + ' ' + valX);
        highY -= 1;
      }
      // find the puyo below empty space (all the way at the bottom of the board if no puyo)
      let lowY = valY;
      while (lowY < height && data[lowY][valX].puyoColor === 0) {
        lowY += 1;
      }

      lowY -= 1;

      // TODO: FIX:
      // Fails on this shape:
      // G
      // YY
      // GY
      // YY
      // find all puyos
      const colorArray = [];
      while (highY >= 0 && data[highY][valX].puyoColor !== 0) {
        colorArray.push(data[highY][valX].puyoColor);
        data[highY][valX].puyoColor = 0;
        highY -= 1;
      }

      console.log('color array length ' + colorArray.length);
      console.log('Dropping puyo at col ' + valX + '... to ' + lowY);
      // bring all the puyos down
      while (colorArray.length > 0) {
        const currColor = colorArray.shift();
        console.log('current color ' + currColor);
        data[lowY][valX].puyoColor = currColor;
        lowY -= 1;
      }
    });
    this.setState({ boardData: data });
  }

  popPuyos(puyoSet) {
    const { boardData: data } = this.state;

    puyoSet.forEach((val) => { data[val[1]][val[0]].puyoColor = 0; });

    this.setState({ boardData: data });
  }

  spawnNewPuyo() {
    const { boardData: data } = this.state;
    data[0][2].puyoColor = Math.floor(Math.random() * puyoColorCount) + 1;
    data[1][2].puyoColor = Math.floor(Math.random() * puyoColorCount) + 1;

    this.setState({
      boardData: data,
      currPuyo1: [2, 0], // [x, y]
      currPuyo2: [2, 1],
    });
  }

  // find all puyos that should pop
  checkPuyoPop(x, y) {
    const checkedLocations = {};
    const { boardData: data } = this.state;
    const color = data[y][x].puyoColor;
    const sameColorPuyoLoc = this.checkPuyoHelper(x, y, checkedLocations, new Set(), color);
    if (sameColorPuyoLoc.size >= 4) {
      return sameColorPuyoLoc;
    }

    return new Set();
  }

  // recursive function
  checkPuyoHelper(x, y, checkedLocationArg, sameColorPuyoLocArg, color) {
    const checkedLocation = checkedLocationArg;
    let sameColorPuyoLoc = sameColorPuyoLocArg;
    const { boardData: data } = this.state;
    // check if current puyo is same color
    console.log('color check at ' + x + ',' + y + ' ? ' + color + ' ' + data[y][x].puyoColor);
    if (data[y][x].puyoColor === color) {
      // add given
      if (!(x in checkedLocation)) {
        checkedLocation[x] = new Set();
      }

      checkedLocation[x].add(y);
      sameColorPuyoLoc.add([x, y]);
      // check neighboring puyo blocks
      // up
      if (
        this.checkIfValidLoc(x, y - 1)
        && !this.checkIfEmpty(x, y - 1)
        && !Board.checkIfAlreadyVisited(x, y - 1, checkedLocation)
      ) {
        console.log('up?');
        sameColorPuyoLoc = this.checkPuyoHelper(x, y - 1, checkedLocation, sameColorPuyoLoc, color);
      }

      // down
      if (
        this.checkIfValidLoc(x, y + 1)
        && !this.checkIfEmpty(x, y + 1)
        && !Board.checkIfAlreadyVisited(x, y + 1, checkedLocation)
      ) {
        sameColorPuyoLoc = this.checkPuyoHelper(x, y + 1, checkedLocation, sameColorPuyoLoc, color);
      }

      // left
      if (
        this.checkIfValidLoc(x - 1, y)
        && !this.checkIfEmpty(x - 1, y)
        && !Board.checkIfAlreadyVisited(x - 1, y, checkedLocation)
      ) {
        sameColorPuyoLoc = this.checkPuyoHelper(x - 1, y, checkedLocation, sameColorPuyoLoc, color);
      }

      // right
      if (
        this.checkIfValidLoc(x + 1, y)
        && !this.checkIfEmpty(x + 1, y)
        && !Board.checkIfAlreadyVisited(x + 1, y, checkedLocation)
      ) {
        sameColorPuyoLoc = this.checkPuyoHelper(x + 1, y, checkedLocation, sameColorPuyoLoc, color);
      }
    }
    return sameColorPuyoLoc;
  }

  checkIfEmpty(x, y) {
    const { boardData: data } = this.state;
    return data[y][x].puyoColor === 0;
  }

  checkIfValidLoc(x, y) {
    const { width, height } = this.props;
    return x >= 0 && x < width && y >= 0 && y < height;
  }

  findLowestPosition(col) {
    const { boardData: data } = this.state;
    const { height } = this.props;
    for (let i = height - 1; i > 0; i--) {
      if (data[i][col].puyoColor === 0) {
        return i;
      }
    }
    return -1;
  }

  // move relatively
  moveCurrPuyo(x, y) {
    const { currPuyo1, currPuyo2 } = this.state;
    const newPuyo1 = [currPuyo1[0] + x, currPuyo1[1] + y];
    const newPuyo2 = [currPuyo2[0] + x, currPuyo2[1] + y];

    // check if legal move
    if (
      !this.checkIfValidLoc(newPuyo1[0], newPuyo1[1])
      || !this.checkIfValidLoc(newPuyo2[0], newPuyo2[1])
      || newPuyo1[1] > this.findLowestPosition(newPuyo1[0])
      || newPuyo2[1] > this.findLowestPosition(newPuyo1[0])
    ) {
      return;
    }

    console.log(currPuyo1 + ' ' + currPuyo2);
    console.log(newPuyo1 + ' ' + newPuyo2);

    const { boardData: data } = this.state;

    const color1 = data[currPuyo1[1]][currPuyo1[0]].puyoColor;
    const color2 = data[currPuyo2[1]][currPuyo2[0]].puyoColor;
    data[currPuyo1[1]][currPuyo1[0]].puyoColor = 0;
    data[currPuyo2[1]][currPuyo2[0]].puyoColor = 0;
    data[newPuyo1[1]][newPuyo1[0]].puyoColor = color1;
    data[newPuyo2[1]][newPuyo2[0]].puyoColor = color2;

    this.setState({
      currPuyo1: [newPuyo1[0], newPuyo1[1]],
      currPuyo2: [newPuyo2[0], newPuyo2[1]],
      boardData: data,
    });

    // if at bottom start timer
    if (
      newPuyo1[1] === this.findLowestPosition(newPuyo1[0]);
      || newPuyo2[1] === this.findLowestPosition(newPuyo2[0]);
    ) {
      setTimeout(this.puyoLockFunctions.bind(this), 1000);
    }
  }

  keyControlsFunction(event) {
    if (event.key === 'ArrowUp') {
      this.dropCurrPuyo();
    } else if (event.key === 'ArrowLeft') {
      this.moveCurrPuyo(-1, 0);
    } else if (event.key === 'ArrowRight') {
      this.moveCurrPuyo(1, 0);
    } else if (event.key === 'ArrowDown') {
      this.moveCurrPuyo(0, 1);
    }
  }

  rotatePuyo() {
  }

  render() {
    const { boardData: data } = this.state;
    return (
      <div className="board">
        {
          Board.renderBoard(data)
        }
      </div>
    );
  }
}

Board.propTypes = {
  height: PropTypes.number.isRequired,
  width: PropTypes.number.isRequired,
};

export default Board;
