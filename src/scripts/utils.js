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
// random integer from [a, b)
export function random(a, b) {
  let min;
  let max;
  if (typeof b === 'undefined') {
    min = 0;
    max = a;
  } else {
    min = a;
    max = b;
  }
  return min + Math.floor((max - min) * Math.random());
}
// sample k distinct integers from [0, n)
export function sample(n, k) {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = 0; i < k; i++) {
    const j = random(i, n);
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