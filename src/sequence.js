/* eslint no-bitwise: 'off' */

class Sequence {
  constructor(rand) {
    this.seqLen = 256;

    this.rand = rand;
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

  initPuyo(numColors) {
    return Array.from({ length: this.seqLen }, (_, i) => i % numColors);
  }

  // mutates arr
  shufflePuyo(arr) {
    let iEnd = 15;
    let jEnd = 8;
    let shift = 28;
    let coeff = 0x10;
    for (let k = 0; k < 3; k++) {
      for (let i = 0; i < iEnd; i++) {
        for (let j = 0; j < jEnd; j++) {
          const num1 = (this.rand.next().value >>> shift) + i * coeff;
          const num2 = (this.rand.next().value >>> shift) + (i + 1) * coeff;
          // eslint-disable-next-line no-param-reassign
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
      const j = Math.floor(this.rand.next().value / (0x100005000 / (numColors - i)));
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
