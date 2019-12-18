const puyoMinPop = 4;
const height = 14;
const width = 6;

class Chainsim {
  static checkIfValidLoc(puyo) {
    return puyo.x >= 0 && puyo.x < width && puyo.y >= 0 && puyo.y < height;
  }

  constructor() {
    this.board = Array.from({ length: height }, () => Array.from({ length: width }, () => 0));
  }

  placePuyo(puyo1, color1, puyo2, color2) {
    // { popped, dropped }
    const poppedDropped = [];
    this.board[puyo1.y][puyo1.x] = color1;
    this.board[puyo2.y][puyo2.x] = color2;
    // prevent ghost row from popping
    let lastDropped = [puyo1, puyo2].filter(({ x, y }) => y > 1);
    for (;;) {
      const puyosToPop = this.checkPuyoPop(lastDropped);

      if (puyosToPop.length === 0) break;

      for (const { x, y } of puyosToPop) {
        this.board[y][x] = 0;
      }
      // drop puyos
      const droppedPuyos = this.dropPuyo(puyosToPop);
      poppedDropped.push({ popped: puyosToPop, dropped: droppedPuyos });
      lastDropped = droppedPuyos.map(({ puyo: { x, y }, dist }) => ({ x, y: y + dist }));
    }
    return poppedDropped;
  }

  static checkIfAlreadyVisited(puyo, checkedLocations) {
    if (puyo.x in checkedLocations) {
      return checkedLocations[puyo.x].has(puyo.y);
    }
    return false;
  }

  dropPuyo(poppedPuyos) {
    // { puyo, dist }
    const droppedPuyos = [];
    // [x]: bottommost y of x
    const xLowY = new Map();
    for (const { x, y } of poppedPuyos) {
      xLowY.set(x, Math.max(y, xLowY.get(x) || 0));
    }
    for (const [x, lowY] of xLowY) {
      // loops end at 1 to avoid dropping 14th row
      // row for next dropped puyo
      let floor = lowY;
      // find puyos to drop
      for (let y = lowY; y >= 1; y--) {
        if (this.board[y][x] !== 0) {
          this.board[floor][x] = this.board[y][x];
          droppedPuyos.push({ puyo: { x, y }, dist: floor - y });
          floor -= 1;
        }
      }
      // no more puyos to drop
      for (; floor >= 1; floor--) {
        this.board[floor][x] = 0;
      }
    }
    return droppedPuyos;
  }

  // find all puyos that should pop
  checkPuyoPop(candidates) {
    const checkedLocations = {};
    const puyosToPop = [];
    for (const can of candidates) {
      if (!Chainsim.checkIfAlreadyVisited(can, checkedLocations)) {
        const sameColorPuyoLoc = (
          this.checkPuyoHelper(can, checkedLocations, this.board[can.y][can.x])
        );
        if (sameColorPuyoLoc.length >= puyoMinPop) {
          puyosToPop.push(...sameColorPuyoLoc);
        }
      }
    }
    return puyosToPop;
  }

  // recursive function
  checkPuyoHelper(puyo, checkedLocations, color) {
    const { x, y } = puyo;
    const sameColorPuyoLoc = [];
    // add given
    if (!(x in checkedLocations)) {
      checkedLocations[x] = new Set();
    }
    checkedLocations[x].add(y);
    sameColorPuyoLoc.push({ x, y });
    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const nb = { x: x + dx, y: y + dy };
      // prevent ghost row from popping
      if (
        nb.y > 1
        && Chainsim.checkIfValidLoc(nb)
        && this.board[nb.y][nb.x] === color
        && !Chainsim.checkIfAlreadyVisited(nb, checkedLocations)
      ) {
        sameColorPuyoLoc.push(...this.checkPuyoHelper(nb, checkedLocations, color));
      }
    }
    return sameColorPuyoLoc;
  }
}

export default Chainsim;
