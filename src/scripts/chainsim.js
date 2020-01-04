import { findLocInList } from './utils.js';

class Chainsim {
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

  constructor(twelfthRow) {
    this.puyoMinPop = 4;
    this.twelfthRow = twelfthRow;
    this.height = 12 + twelfthRow;
    this.width = 6;

    this.board = Array.from({ length: this.height }, () => (
      Array.from({ length: this.width }, () => 'none')
    ));
  }

  checkIfValidLoc(puyo) {
    return puyo.x >= 0 && puyo.x < this.width && puyo.y >= 0 && puyo.y < this.height;
  }

  addGarbage(garbagePuyoList) {
    for (const { x, y, distance: d } of garbagePuyoList) {
      // don't add garbage to 14th row
      if (y + d >= this.twelfthRow - 1) {
        this.board[y + d][x] = 'gray';
      }
    }
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
    const { puyosToPop, score } = this.checkPuyoPop(this.lastDropped);
    if (puyosToPop.length === 0) {
      return null;
    }
    for (const { x, y } of puyosToPop) {
      this.board[y][x] = 'none';
    }
    // drop puyos
    const droppedPuyos = this.dropPuyo(puyosToPop);
    this.lastDropped = droppedPuyos.map(({ puyo: { x, y }, dist }) => ({ x, y: y + dist }));
    this.chainNum++;
    return { popped: puyosToPop, dropped: droppedPuyos, score };
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
      // row for next dropped puyo
      let floor = lowY;
      // find puyos to drop
      // end loop early to avoid dropping 14th row
      for (let y = lowY; y >= this.twelfthRow - 1; y--) {
        if (this.board[y][x] !== 'none') {
          this.board[floor][x] = this.board[y][x];
          droppedPuyos.push({ puyo: { x, y }, dist: floor - y });
          floor -= 1;
        }
      }
      // no more puyos to drop
      for (; floor >= 1; floor--) {
        this.board[floor][x] = 'none';
      }
    }
    return droppedPuyos;
  }

  // find all puyos that should pop
  checkPuyoPop(candidates) {
    const checkedLocations = [];
    const poppedGarbageList = [];
    const puyosToPop = [];
    const colorList = new Set();
    let bonus = Chainsim.chainPower(this.chainNum);
    for (const can of candidates) {
      // prevent ghost row from popping
      if (can.y >= this.twelfthRow && !findLocInList(can, checkedLocations).found) {
        const color = this.board[can.y][can.x];
        if (color === 'gray') continue;
        const garbageList = [];
        const group = (
          this.checkPuyoHelper(can, color, checkedLocations, garbageList, poppedGarbageList)
        );
        if (group.length >= this.puyoMinPop) {
          puyosToPop.push(...group);
          poppedGarbageList.push(...garbageList);
          colorList.add(color);
          bonus += Chainsim.groupBonus(group.length);
        }
      }
    }
    bonus += Chainsim.colorBonus(colorList.size);
    const score = 10 * puyosToPop.length * Math.min(Math.max(bonus, 1), 999);
    puyosToPop.push(...poppedGarbageList);
    return { puyosToPop, score };
  }

  // recursive function that modifies checkedLocations and garbageList
  checkPuyoHelper(puyo, color, checkedLocations = [], garbageList = [], poppedGarbageList = []) {
    const { x, y } = puyo;
    const group = [];
    checkedLocations.push(puyo);
    group.push(puyo);
    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const nb = { x: x + dx, y: y + dy };
      if (this.checkIfValidLoc(nb)) {
        const c = this.board[nb.y][nb.x];
        if (
          c === 'gray'
          && !findLocInList(nb, garbageList).found
          && !findLocInList(nb, poppedGarbageList).found
        ) {
          garbageList.push(nb);
        } else if (
          nb.y >= this.twelfthRow // prevent ghost row from popping
          && c === color
          && !findLocInList(nb, checkedLocations).found
        ) {
          group.push(
            ...this.checkPuyoHelper(nb, color, checkedLocations, garbageList, poppedGarbageList),
          );
        }
      }
    }
    return group;
  }
}

export default Chainsim;
