import '@fgv/ts-utils-jest';

import { IWeightedCandidate, PseudoRandomGenerator, pickWeightedAt } from '../../generator';

function weighted<T>(...pairs: ReadonlyArray<[T, number]>): ReadonlyArray<IWeightedCandidate<T>> {
  return pairs.map(([item, weight]) => ({ item, weight }));
}

/**
 * The walk the first consumer used before this primitive existed: `point < cumulative`
 * in input order over positive weights, last candidate by elimination. Kept here so the
 * stability test compares against an independent statement of that walk.
 */
function referenceWalk<T>(unit: number, candidates: ReadonlyArray<IWeightedCandidate<T>>): T {
  const total = candidates.reduce((sum, c) => sum + c.weight, 0);
  const point = unit * total;
  let cumulative = 0;
  for (let i = 0; i < candidates.length - 1; i++) {
    cumulative += candidates[i].weight;
    if (point < cumulative) {
      return candidates[i].item;
    }
  }
  return candidates[candidates.length - 1].item;
}

describe('pickWeightedAt', () => {
  const abc = weighted<string>(['a', 1], ['b', 2], ['c', 3]);

  describe('eligibility', () => {
    test('never chooses a zero-weight candidate', () => {
      const candidates = weighted<string>(['zero', 0], ['a', 1]);
      expect(pickWeightedAt(0, candidates)).toBe('a');
      expect(pickWeightedAt(1, candidates)).toBe('a');
    });

    test('never chooses a negative-weight candidate', () => {
      const candidates = weighted<string>(['a', 1], ['negative', -5]);
      expect(pickWeightedAt(0, candidates)).toBe('a');
      expect(pickWeightedAt(1, candidates)).toBe('a');
    });

    test('never chooses a NaN-weight candidate', () => {
      const candidates = weighted<string>(['nan', NaN], ['a', 1]);
      expect(pickWeightedAt(0, candidates)).toBe('a');
      expect(pickWeightedAt(1, candidates)).toBe('a');
    });

    test('never chooses an infinite-weight candidate', () => {
      const candidates = weighted<string>(['inf', Infinity], ['a', 1], ['ninf', -Infinity]);
      expect(pickWeightedAt(0, candidates)).toBe('a');
      expect(pickWeightedAt(0.5, candidates)).toBe('a');
      expect(pickWeightedAt(1, candidates)).toBe('a');
    });

    test('ineligible candidates take no share of the range', () => {
      const candidates = weighted<string>(['x', 0], ['a', 1], ['y', NaN], ['b', 1]);
      expect(pickWeightedAt(0.49, candidates)).toBe('a');
      expect(pickWeightedAt(0.5, candidates)).toBe('b');
    });
  });

  describe('no eligible candidate', () => {
    test('returns undefined for an empty list', () => {
      expect(pickWeightedAt(0.5, [])).toBeUndefined();
    });

    test('returns undefined when every weight is ineligible', () => {
      const candidates = weighted<string>(['a', 0], ['b', -1], ['c', NaN], ['d', Infinity]);
      expect(pickWeightedAt(0.5, candidates)).toBeUndefined();
    });
  });

  describe('unit range', () => {
    test('accepts unit = 0 and chooses the first eligible candidate', () => {
      expect(pickWeightedAt(0, abc)).toBe('a');
    });

    test('accepts unit = 1 and chooses the last eligible candidate', () => {
      expect(pickWeightedAt(1, abc)).toBe('c');
      expect(pickWeightedAt(1, weighted<string>(['a', 1], ['b', 1], ['zero', 0]))).toBe('b');
    });

    test('returns undefined for a unit below 0', () => {
      expect(pickWeightedAt(-0.0001, abc)).toBeUndefined();
    });

    test('returns undefined for a unit above 1', () => {
      expect(pickWeightedAt(1.0001, abc)).toBeUndefined();
    });

    test('returns undefined for a NaN unit', () => {
      expect(pickWeightedAt(NaN, abc)).toBeUndefined();
    });
  });

  describe('walk', () => {
    test('a point on a cumulative boundary belongs to the next candidate (point < cumulative)', () => {
      // total 4: a covers [0, 1), b covers [1, 4)
      const candidates = weighted<string>(['a', 1], ['b', 3]);
      expect(pickWeightedAt(0.25, candidates)).toBe('b');
      expect(pickWeightedAt(0.2499, candidates)).toBe('a');
    });

    test('walks candidates in input order', () => {
      expect(pickWeightedAt(0.1, weighted<string>(['a', 1], ['b', 1]))).toBe('a');
      expect(pickWeightedAt(0.1, weighted<string>(['b', 1], ['a', 1]))).toBe('b');
    });

    test('the last eligible candidate wins by elimination on a floating-point shortfall', () => {
      // The last candidate's bound is never compared, so a point at or beyond the
      // summed total (0.1 + 0.2 + 0.3 is 0.6000000000000001) still lands on it.
      const candidates = weighted<string>(['a', 0.1], ['b', 0.2], ['c', 0.3]);
      expect(pickWeightedAt(1, candidates)).toBe('c');
    });

    test('a single eligible candidate is always chosen', () => {
      const candidates = weighted<string>(['zero', 0], ['only', 0.001]);
      expect(pickWeightedAt(0, candidates)).toBe('only');
      expect(pickWeightedAt(0.5, candidates)).toBe('only');
      expect(pickWeightedAt(1, candidates)).toBe('only');
    });
  });

  describe('stability', () => {
    test('pins fixed (unit, candidates) pairs to their chosen item', () => {
      const pins: ReadonlyArray<[number, ReadonlyArray<IWeightedCandidate<string>>, string]> = [
        [0, abc, 'a'],
        [0.1666, abc, 'a'],
        [0.49, abc, 'b'],
        [0.5, abc, 'c'],
        [0.9999, abc, 'c'],
        [1, abc, 'c'],
        [0.3, weighted<string>(['x', 3], ['y', 7]), 'y'],
        [0.2999, weighted<string>(['x', 3], ['y', 7]), 'x'],
        [0.75, weighted<string>(['p', 5], ['q', 3], ['r', 9]), 'r'],
        [0.4, weighted<string>(['p', 5], ['q', 3], ['r', 9]), 'q']
      ];
      for (const [unit, candidates, expected] of pins) {
        expect({ unit, picked: pickWeightedAt(unit, candidates) }).toEqual({ unit, picked: expected });
      }
    });

    test('matches the reference positive-weight walk across a grid of units', () => {
      const sets = [
        abc,
        weighted<string>(['a', 0.1], ['b', 0.2], ['c', 0.3]),
        weighted<string>(['a', 0.7], ['b', 0.1], ['c', 0.2]),
        weighted<string>(['a', 1], ['b', 1], ['c', 1], ['d', 1], ['e', 1])
      ];
      for (const candidates of sets) {
        for (let k = 0; k <= 1000; k++) {
          const unit = k / 1000;
          expect(pickWeightedAt(unit, candidates)).toBe(referenceWalk(unit, candidates));
        }
      }
    });

    test('does not rescale ordinary weights', () => {
      // The unit is 0.1 / (0.1 + 0.2 + 0.3), a's boundary. The unscaled walk chooses
      // 'b'; dividing by the largest weight first rounds the point below a's bound and
      // would choose 'a', changing a stored draw.
      const candidates = weighted<string>(['a', 0.1], ['b', 0.2], ['c', 0.3]);
      expect(pickWeightedAt(0.16666666666666666, candidates)).toBe('b');
    });
  });

  describe('overflow', () => {
    test('rescales by the largest eligible weight when the total is not finite', () => {
      const candidates = weighted<string>(['a', 1e308], ['b', 1e308]);
      expect(pickWeightedAt(0, candidates)).toBe('a');
      expect(pickWeightedAt(0.25, candidates)).toBe('a');
      expect(pickWeightedAt(0.75, candidates)).toBe('b');
      expect(pickWeightedAt(1, candidates)).toBe('b');
    });

    test('keeps relative weights when rescaling', () => {
      const candidates = weighted<string>(['a', 6e307], ['b', 6e307], ['c', 1.2e308]);
      // rescaled to 0.5, 0.5, 1 — total 2
      expect(pickWeightedAt(0.2, candidates)).toBe('a');
      expect(pickWeightedAt(0.3, candidates)).toBe('b');
      expect(pickWeightedAt(0.6, candidates)).toBe('c');
    });
  });
});

describe('PseudoRandomGenerator.pickWeighted', () => {
  test('delegates to pickWeightedAt with the next float', () => {
    const candidates = weighted<string>(['a', 1], ['b', 2], ['c', 3], ['zero', 0]);
    const gen = PseudoRandomGenerator.create({ seed: 'weighted' }).orThrow();
    const shadow = gen.clone();
    for (let i = 0; i < 50; i++) {
      expect(gen.pickWeighted(candidates)).toBe(pickWeightedAt(shadow.nextFloat(), candidates));
    }
  });

  test('returns undefined when no candidate is eligible', () => {
    const gen = PseudoRandomGenerator.create({ seed: 1 }).orThrow();
    expect(gen.pickWeighted([])).toBeUndefined();
    expect(gen.pickWeighted(weighted<string>(['a', 0]))).toBeUndefined();
  });

  test('consumes exactly one draw per call, even when it returns undefined', () => {
    const gen = PseudoRandomGenerator.create({ seed: 1 }).orThrow();
    gen.pickWeighted([]);
    gen.pickWeighted(weighted<string>(['a', 1]));
    expect(gen.rng.counter).toBe(2);
  });

  test('chooses in proportion to weight', () => {
    const candidates = weighted<string>(['a', 1], ['b', 3]);
    const gen = PseudoRandomGenerator.create({ seed: 'proportion' }).orThrow();
    let b = 0;
    for (let i = 0; i < 4000; i++) {
      if (gen.pickWeighted(candidates) === 'b') {
        b++;
      }
    }
    expect(b / 4000).toBeGreaterThan(0.7);
    expect(b / 4000).toBeLessThan(0.8);
  });
});
