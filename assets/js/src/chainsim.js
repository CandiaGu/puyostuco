const puyoMinPop = 4;
const height = 14;
const width = 6;

class Chainsim {
  static checkIfValidLoc(puyo) {
    return puyo.x >= 0 && puyo.x < width && puyo.y >= 0 && puyo.y < height;
  }

  static chainPower(chain) {
    switch (chain) {
      case 1: return 0;
      case 2: return 8;
      case 3: return 16;
      default: return 32 * (chain - 3);
    }
  }

  static colorBonus(colors) {
    if (colors === 1) return 0;
    return 3 * (2 ** (colors - 2));
  }

  static groupBonus(puyos) {
    if (puyos === 4) return 0;
    if (puyos > 10) return 10;
    return puyos - 3;
  }

  constructor() {
    this.board = Array.from({ length: height }, () => Array.from({ length: width }, () => 0));
  }

  placePuyo(puyo1, puyo2) {
    this.board[puyo1.y][puyo1.x] = puyo1.color;
    this.board[puyo2.y][puyo2.x] = puyo2.color;
    // prevent ghost row from popping
    this.lastDropped = [puyo1, puyo2].filter((puyo) => puyo.y > 1);
    this.chainNum = 1;
  }

  computeChain() {
    // { popped, dropped, score }
    const poppedDroppedScoreList = [];
    let poppedDroppedScore;
    while ((poppedDroppedScore = this.computeLink())) {
      poppedDroppedScoreList.push(poppedDroppedScore);
    }
    return poppedDroppedScoreList;
  }

  computeLink() {
    const { puyosToPop, bonus } = this.checkPuyoPop(this.lastDropped);
    if (puyosToPop.length === 0) {
      return null;
    }
    for (const { x, y } of puyosToPop) {
      this.board[y][x] = 0;
    }
    // drop puyos
    const droppedPuyos = this.dropPuyo(puyosToPop);
    const multiplier = Math.min(Math.max(Chainsim.chainPower(this.chainNum) + bonus, 1), 999);
    const score = 10 * puyosToPop.length * multiplier;
    this.lastDropped = droppedPuyos.map(({ puyo: { x, y }, dist }) => ({ x, y: y + dist }));
    this.chainNum++;
    return { popped: puyosToPop, dropped: droppedPuyos, score };
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
    const colorList = new Set();
    let bonus = 0;
    for (const can of candidates) {
      if (!Chainsim.checkIfAlreadyVisited(can, checkedLocations)) {
        const color = this.board[can.y][can.x];
        const group = this.checkPuyoHelper(can, checkedLocations, color);
        if (group.length >= puyoMinPop) {
          puyosToPop.push(...group);
          colorList.add(color);
          bonus += Chainsim.groupBonus(group.length);
        }
      }
    }
    bonus += Chainsim.colorBonus(colorList.size);
    return { puyosToPop, bonus };
  }

  // recursive function that modifies checkedLocations
  checkPuyoHelper(puyo, checkedLocations, color) {
    const { x, y } = puyo;
    const group = [];
    if (!(x in checkedLocations)) {
      checkedLocations[x] = new Set();
    }
    checkedLocations[x].add(y);
    group.push({ x, y });
    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const nb = { x: x + dx, y: y + dy };
      // prevent ghost row from popping
      if (
        nb.y > 1
        && Chainsim.checkIfValidLoc(nb)
        && this.board[nb.y][nb.x] === color
        && !Chainsim.checkIfAlreadyVisited(nb, checkedLocations)
      ) {
        group.push(...this.checkPuyoHelper(nb, checkedLocations, color));
      }
    }
    return group;
  }
}

export default Chainsim;
