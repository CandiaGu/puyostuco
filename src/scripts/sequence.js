/* eslint no-bitwise: 'off' */
import { random } from './utils.js';

class Sequence {
  constructor(seed) {
    this.numSeq = 65536;
    this.seqLen = 256;

    this.rand = typeof seed === 'undefined' ? random(this.numSeq) : seed;
    this.rand &= 0xFFFF;
    this.seq = this.computeSeq();
    this.index = 0;
  }

  getColors() {
    const { seq, index } = this;
    const colors = { color1: seq[index + 1], color2: seq[index] };
    this.index += 2;
    if (this.index === this.seqLen) {
      this.index = 0;
    }
    return colors;
  }

  nextRand() {
    this.rand = ((Math.imul(this.rand, 0x5D588B65) + 0x269EC3) & 0xFFFFFFFF) >>> 0;
  }

  initPuyo(numColors) {
    return Array.from({ length: this.seqLen }, (_, i) => i % numColors);
  }

  shufflePuyo(arr) {
    let iEnd = 15;
    let jEnd = 8;
    let shift = 28;
    let coeff = 0x10;
    for (let k = 0; k < 3; k++) {
      for (let i = 0; i < iEnd; i++) {
        for (let j = 0; j < jEnd; j++) {
          this.nextRand();
          const num1 = (this.rand >>> shift) + i * coeff;
          this.nextRand();
          const num2 = (this.rand >>> shift) + (i + 1) * coeff;
          [arr[num1], arr[num2]] = [arr[num2], arr[num1]];
        }
      }
      iEnd = Math.floor(iEnd / 2);
      jEnd *= 2;
      shift--;
      coeff *= 2;
    }
  }

  computeSeq() {
    const colorScheme = [];
    const colorList = ['red', 'green', 'blue', 'yellow', 'purple'];
    const numColors = colorList.length;
    for (let i = 0; i < numColors; i++) {
      this.nextRand();
      const j = Math.floor(this.rand / (0x100005000 / (numColors - i)));
      colorScheme.push(colorList[j]);
      colorList.splice(j, 1);
    }
    const amakuchi = this.initPuyo(3);
    const tyukara = this.initPuyo(4);
    this.shufflePuyo(amakuchi);
    this.shufflePuyo(tyukara);
    for (let i = 0; i < 4; i++) {
      tyukara[i] = amakuchi[i];
    }
    return tyukara.map((i) => colorScheme[i]);
  }
}

export default Sequence;
