/* eslint no-bitwise: 'off' */

import 'core-js/stable';
import 'regenerator-runtime/runtime';

export function locsEqual(loc1, loc2) {
  return loc1.x === loc2.x && loc1.y === loc2.y;
}

export function findLocInList(loc, locList) {
  const match = locList.find((loc2) => locsEqual(loc, loc2));
  if (match) {
    return { match, found: true };
  }
  return { match: loc, found: false };
}

// random unsigned 32-bit integer generator using seed
export function* randGenerator(seed) {
  let rand = seed & 0xFFFF;
  for (;;) {
    rand = ((Math.imul(rand, 0x5D588B65) + 0x269EC3) & 0xFFFFFFFF) >>> 0;
    yield rand;
  }
}

// random 32-bit integer seed
export function randSeed() {
  return Math.floor(65536 * Math.random());
}

// random integer from [a, b) using rand generator
export function randInt(rand, a, b) {
  let min;
  let max;
  if (typeof b === 'undefined') {
    min = 0;
    max = a;
  } else {
    min = a;
    max = b;
  }
  return min + Math.floor(rand.next().value % (max - min));
}

// sample k distinct integers from [0, n) using rand generator
export function randSample(rand, n, k) {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = 0; i < k; i++) {
    const j = randInt(rand, i, n);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, k);
}

export function deepClone(object) {
  return JSON.parse(JSON.stringify(object));
}

export function deepMerge(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object' && target[key]) {
      deepMerge(target[key], value);
    } else {
      target[key] = value;
    }
  }
  return target;
}

export function deepUpdateRef(ref, state) {
  if ('root' in ref) {
    ref.set(state);
  } else {
    for (const [key, value] of Object.entries(state)) {
      if (value && typeof value === 'object') {
        deepUpdateRef(ref[key], value);
      } else if (ref[key]) {
        ref[key].set(value);
      }
    }
  }
}
