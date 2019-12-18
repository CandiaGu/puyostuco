const height = 14;
const width = 6;

class Chainsim {
  static checkIfValidLoc(x, y) {
    return x >= 0 && x < width && y >= 0 && y < height;
  }

  constructor() {
    this.initBoard();
  }

  initBoard() {
    this.board = Array.from({ length: height }, () => Array.from({ length: width }, () => 0));
  }

  placePuyo(puyo1, color1, puyo2, color2) {
    this.board[puyo1[1]][puyo1[0]] = color1;
    this.board[puyo2[1]][puyo2[0]] = color2;

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
  }

  static checkIfAlreadyVisited(x, y, checkedLocations) {
    if (x in checkedLocations) {
      return checkedLocations[x].has(y);
    }
    return false;
  }

  // drop all puyos in the same col above x, y
  dropPuyo(poppedPuyos) {
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
      while (highY >= 0 && this.board[highY][valX] === 0) {
        console.log('Dropping puyo... ' + highY + ' ' + valX);
        highY -= 1;
      }
      // find the puyo below empty space (all the way at the bottom of the board if no puyo)
      let lowY = valY;
      while (lowY < height && this.board[lowY][valX] === 0) {
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
      while (highY >= 0 && this.board[highY][valX] !== 0) {
        colorArray.push(this.board[highY][valX]);
        this.board[highY][valX] = 0;
        highY -= 1;
      }

      console.log('color array length ' + colorArray.length);
      console.log('Dropping puyo at col ' + valX + '... to ' + lowY);
      // bring all the puyos down
      while (colorArray.length > 0) {
        const currColor = colorArray.shift();
        console.log('current color ' + currColor);
        this.board[lowY][valX] = currColor;
        lowY -= 1;
      }
    });
  }

  popPuyos(puyoSet) {
    puyoSet.forEach((val) => { this.board[val[1]][val[0]] = 0; });
  }

  // find all puyos that should pop
  checkPuyoPop(x, y) {
    const checkedLocations = {};
    const color = this.board[y][x];
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
    // check if current puyo is same color
    console.log('color check at ' + x + ',' + y + ' ? ' + color + ' ' + this.board[y][x]);
    if (this.board[y][x] === color) {
      // add given
      if (!(x in checkedLocation)) {
        checkedLocation[x] = new Set();
      }

      checkedLocation[x].add(y);
      sameColorPuyoLoc.add([x, y]);
      // check neighboring puyo blocks
      // up
      if (
        Chainsim.checkIfValidLoc(x, y - 1)
        && !this.checkIfEmpty(x, y - 1)
        && !Chainsim.checkIfAlreadyVisited(x, y - 1, checkedLocation)
      ) {
        console.log('up?');
        sameColorPuyoLoc = this.checkPuyoHelper(x, y - 1, checkedLocation, sameColorPuyoLoc, color);
      }

      // down
      if (
        Chainsim.checkIfValidLoc(x, y + 1)
        && !this.checkIfEmpty(x, y + 1)
        && !Chainsim.checkIfAlreadyVisited(x, y + 1, checkedLocation)
      ) {
        sameColorPuyoLoc = this.checkPuyoHelper(x, y + 1, checkedLocation, sameColorPuyoLoc, color);
      }

      // left
      if (
        Chainsim.checkIfValidLoc(x - 1, y)
        && !this.checkIfEmpty(x - 1, y)
        && !Chainsim.checkIfAlreadyVisited(x - 1, y, checkedLocation)
      ) {
        sameColorPuyoLoc = this.checkPuyoHelper(x - 1, y, checkedLocation, sameColorPuyoLoc, color);
      }

      // right
      if (
        Chainsim.checkIfValidLoc(x + 1, y)
        && !this.checkIfEmpty(x + 1, y)
        && !Chainsim.checkIfAlreadyVisited(x + 1, y, checkedLocation)
      ) {
        sameColorPuyoLoc = this.checkPuyoHelper(x + 1, y, checkedLocation, sameColorPuyoLoc, color);
      }
    }
    return sameColorPuyoLoc;
  }

  checkIfEmpty(x, y) {
    return this.board[y][x] === 0;
  }
}

export default Chainsim;
