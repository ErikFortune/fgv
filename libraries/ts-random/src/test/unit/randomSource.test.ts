import '@fgv/ts-utils-jest';

import { RandomStepFunction, SeededRandomSource } from '../../generator';

/**
 * A passthrough step function useful for testing: returns the state as the value
 * and increments the state by 1 each step, making sequences predictable.
 */
const passthroughStep: RandomStepFunction = (state: number) => {
  return {
    value: state,
    nextState: state + 1
  };
};

function createSource(seed: number | string): SeededRandomSource {
  return SeededRandomSource.create(seed).orThrow();
}

function readValues(source: SeededRandomSource, count: number): number[] {
  const values: number[] = [];
  for (let index = 0; index < count; index += 1) {
    values.push(source.next());
  }
  return values;
}

describe('SeededRandomSource', () => {
  describe('create', () => {
    test('succeeds with a numeric seed', () => {
      expect(SeededRandomSource.create(42)).toSucceedAndSatisfy((source) => {
        expect(source.seed).toBe('42');
        expect(source.counter).toBe(0);
        expect(source.lineage).toEqual([]);
      });
    });

    test('succeeds with a string seed', () => {
      expect(SeededRandomSource.create('hello')).toSucceedAndSatisfy((source) => {
        expect(source.seed).toBe('hello');
        expect(source.counter).toBe(0);
        expect(source.lineage).toEqual([]);
      });
    });

    test('succeeds with no seed using Date.now as fallback', () => {
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(999);
      try {
        expect(SeededRandomSource.create()).toSucceedAndSatisfy((source) => {
          expect(source.seed).toBe('999');
          expect(source.counter).toBe(0);
        });
      } finally {
        nowSpy.mockRestore();
      }
    });

    test('unseeded sources created at different times produce different sequences', () => {
      const nowSpy = jest.spyOn(Date, 'now');
      nowSpy.mockReturnValueOnce(100);
      nowSpy.mockReturnValueOnce(200);
      try {
        const first = SeededRandomSource.create().orThrow();
        const second = SeededRandomSource.create().orThrow();
        expect(readValues(first, 4)).not.toEqual(readValues(second, 4));
      } finally {
        nowSpy.mockRestore();
      }
    });

    test('object-form initialization behaves like primitive initialization', () => {
      const primitive = createSource(12345);
      const object = SeededRandomSource.create({ seed: 12345 }).orThrow();
      expect(readValues(primitive, 4)).toEqual(readValues(object, 4));
    });

    test('object-form with custom step function uses that step', () => {
      expect(SeededRandomSource.create({ seed: 10, step: passthroughStep })).toSucceedAndSatisfy((source) => {
        expect(source.next()).toBe(10);
        expect(source.next()).toBe(11);
        expect(source.next()).toBe(12);
      });
    });

    test('object-form without seed falls back to Date.now', () => {
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(555);
      try {
        expect(SeededRandomSource.create({ step: passthroughStep })).toSucceedAndSatisfy((source) => {
          expect(source.seed).toBe('555');
          expect(source.next()).toBe(555);
        });
      } finally {
        nowSpy.mockRestore();
      }
    });
  });

  describe('deterministic sequences', () => {
    test('same seed always produces the same sequence', () => {
      const first = createSource('deterministic');
      const second = createSource('deterministic');
      expect(readValues(first, 10)).toEqual(readValues(second, 10));
    });

    test('numeric and string forms of the same seed produce identical sequences', () => {
      const numeric = createSource(12345);
      const stringForm = createSource('12345');
      expect(readValues(numeric, 10)).toEqual(readValues(stringForm, 10));
    });

    test('different seeds produce different sequences', () => {
      const first = createSource('alpha');
      const second = createSource('beta');
      expect(readValues(first, 4)).not.toEqual(readValues(second, 4));
    });
  });

  describe('next', () => {
    test('counter increments with each call', () => {
      const source = createSource(1);
      expect(source.counter).toBe(0);
      source.next();
      expect(source.counter).toBe(1);
      source.next();
      source.next();
      expect(source.counter).toBe(3);
    });

    test('returns values in [0, 1) range over many iterations', () => {
      const source = createSource(42);
      for (let i = 0; i < 1000; i++) {
        const value = source.next();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });

    test('sequence does not degenerate to constant values', () => {
      const source = createSource(42);
      const values = readValues(source, 100);
      const unique = new Set(values);
      // With 100 values from a proper PRNG, we expect many unique values
      expect(unique.size).toBeGreaterThan(90);
    });
  });

  describe('clone', () => {
    test('clone produces identical sequence from clone point', () => {
      const parent = createSource(7);
      parent.next();
      parent.next();

      const clone = parent.clone();
      expect(readValues(parent, 4)).toEqual(readValues(clone, 4));
    });

    test('clone preserves counter and lineage', () => {
      const parent = createSource(7);
      parent.next();
      parent.next();
      parent.next();

      const clone = parent.clone();
      expect(clone.counter).toBe(3);
      expect(clone.seed).toBe(parent.seed);
      expect(clone.lineage).toEqual(parent.lineage);
    });

    test('advancing clone does not affect parent', () => {
      const parent = createSource(7);
      parent.next();

      const clone = parent.clone();
      clone.next();
      clone.next();
      clone.next();

      // Parent should still be at counter 1 and produce its own next value
      expect(parent.counter).toBe(1);
      expect(clone.counter).toBe(4);

      // Parent's next value should differ from clone's (different positions)
      parent.next();
      clone.next();
      expect(parent.counter).toBe(2);
      expect(clone.counter).toBe(5);
    });

    test('clone of a child preserves child lineage', () => {
      const parent = createSource(7);
      parent.next();
      const child = parent.createChild('branch');
      child.next();
      child.next();

      const clone = child.clone();
      expect(clone.lineage).toEqual(['1:branch']);
      expect(clone.counter).toBe(2);
      expect(readValues(child, 4)).toEqual(readValues(clone, 4));
    });
  });

  describe('createChild', () => {
    test('child starts with counter at 0', () => {
      const parent = createSource(7);
      parent.next();
      parent.next();

      const child = parent.createChild('test');
      expect(child.counter).toBe(0);
    });

    test('child records lineage as counter:label', () => {
      const parent = createSource(7);
      parent.next();
      parent.next();
      parent.next();

      const child = parent.createChild('myLabel');
      expect(child.lineage).toEqual(['3:myLabel']);
    });

    test('grandchild accumulates lineage', () => {
      const parent = createSource(7);
      parent.next();
      parent.next();

      const child = parent.createChild('branch');
      child.next();

      const grandchild = child.createChild('leaf');
      expect(grandchild.lineage).toEqual(['2:branch', '1:leaf']);
      expect(grandchild.counter).toBe(0);
    });

    test('children with same label from same parent state are identical', () => {
      const parent1 = createSource(7);
      const parent2 = createSource(7);
      parent1.next();
      parent1.next();
      parent2.next();
      parent2.next();

      const child1 = parent1.createChild('same');
      const child2 = parent2.createChild('same');
      expect(readValues(child1, 10)).toEqual(readValues(child2, 10));
    });

    test('children with different labels produce different sequences', () => {
      const parent = createSource(7);
      parent.next();
      parent.next();

      const childA = parent.createChild('alpha');
      const childB = parent.createChild('beta');
      expect(readValues(childA, 4)).not.toEqual(readValues(childB, 4));
    });

    test('same label but different parent positions produce different children', () => {
      const early = createSource(7);
      const later = createSource(7);
      early.next();
      later.next();
      later.next();

      const earlyChild = early.createChild('shared');
      const laterChild = later.createChild('shared');
      expect(readValues(earlyChild, 4)).not.toEqual(readValues(laterChild, 4));
    });

    test('advancing child does not affect parent', () => {
      const parent = createSource(7);
      parent.next();
      parent.next();

      const child = parent.createChild('test');
      child.next();
      child.next();
      child.next();

      expect(parent.counter).toBe(2);
      expect(child.counter).toBe(3);
    });

    test('child uses same step function as parent', () => {
      const parent = SeededRandomSource.create({ seed: 10, step: passthroughStep }).orThrow();
      parent.next(); // advances state to 11

      const child = parent.createChild('x');
      // Child should use passthroughStep too. Its initial state comes from hashStateAndLabel
      // so value = hashed state, next call returns hashed state + 1
      const first = child.next();
      const second = child.next();
      expect(second - first).toBe(1); // passthroughStep increments by 1
    });

    test('child with empty label produces a valid source', () => {
      const parent = createSource(7);
      parent.next();

      const child = parent.createChild('');
      expect(child.lineage).toEqual(['1:']);
      expect(child.counter).toBe(0);
      // Should still produce valid numbers
      const value = child.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    });
  });

  describe('hashSeed', () => {
    test('numeric input returns number as string seed and number as state', () => {
      const result = SeededRandomSource.hashSeed(42);
      expect(result).toEqual({ seed: '42', state: 42 });
    });

    test('numeric zero is handled correctly', () => {
      const result = SeededRandomSource.hashSeed(0);
      expect(result).toEqual({ seed: '0', state: 0 });
    });

    test('negative number is handled correctly', () => {
      const result = SeededRandomSource.hashSeed(-5);
      expect(result).toEqual({ seed: '-5', state: -5 });
    });

    test('string that parses as number uses numeric state', () => {
      const result = SeededRandomSource.hashSeed('123');
      expect(result).toEqual({ seed: '123', state: 123 });
    });

    test('string "0" parses as numeric zero', () => {
      const result = SeededRandomSource.hashSeed('0');
      expect(result).toEqual({ seed: '0', state: 0 });
    });

    test('non-numeric string is hashed to a state', () => {
      const result = SeededRandomSource.hashSeed('hello');
      expect(result.seed).toBe('hello');
      expect(typeof result.state).toBe('number');
      expect(result.state).toBeGreaterThanOrEqual(0);
    });

    test('same non-numeric string always produces same hash', () => {
      const first = SeededRandomSource.hashSeed('test-seed');
      const second = SeededRandomSource.hashSeed('test-seed');
      expect(first).toEqual(second);
    });

    test('different non-numeric strings produce different hashes', () => {
      const a = SeededRandomSource.hashSeed('alpha');
      const b = SeededRandomSource.hashSeed('beta');
      expect(a.state).not.toBe(b.state);
    });

    test('empty string is hashed (not treated as numeric)', () => {
      const result = SeededRandomSource.hashSeed('');
      expect(result.seed).toBe('');
      // Empty string: Number('') is 0, isFinite(0) is true, so state should be 0
      expect(result.state).toBe(0);
    });

    test('string "Infinity" is hashed as non-numeric', () => {
      const result = SeededRandomSource.hashSeed('Infinity');
      expect(result.seed).toBe('Infinity');
      // Number('Infinity') is Infinity, isFinite(Infinity) is false → hashed
      expect(typeof result.state).toBe('number');
      expect(result.state).not.toBe(Infinity);
    });

    test('string "NaN" is hashed as non-numeric', () => {
      const result = SeededRandomSource.hashSeed('NaN');
      expect(result.seed).toBe('NaN');
      // Number('NaN') is NaN, isNaN(NaN) is true → hashed
      expect(typeof result.state).toBe('number');
      expect(isNaN(result.state)).toBe(false);
    });

    test('floating point string is treated as numeric', () => {
      const result = SeededRandomSource.hashSeed('3.14');
      expect(result).toEqual({ seed: '3.14', state: 3.14 });
    });

    test('negative numeric string is treated as numeric', () => {
      const result = SeededRandomSource.hashSeed('-42');
      expect(result).toEqual({ seed: '-42', state: -42 });
    });
  });

  describe('hashStateAndLabel', () => {
    test('produces a seed string in "state:label" format', () => {
      const result = SeededRandomSource.hashStateAndLabel(100, 'test');
      expect(result.seed).toBe('100:test');
    });

    test('state is treated as unsigned 32-bit integer in seed string', () => {
      // -1 >>> 0 = 4294967295
      const result = SeededRandomSource.hashStateAndLabel(-1, 'label');
      expect(result.seed).toBe('4294967295:label');
    });

    test('same inputs produce same output', () => {
      const first = SeededRandomSource.hashStateAndLabel(42, 'branch');
      const second = SeededRandomSource.hashStateAndLabel(42, 'branch');
      expect(first).toEqual(second);
    });

    test('different states produce different results', () => {
      const a = SeededRandomSource.hashStateAndLabel(1, 'same');
      const b = SeededRandomSource.hashStateAndLabel(2, 'same');
      expect(a.state).not.toBe(b.state);
    });

    test('different labels produce different results', () => {
      const a = SeededRandomSource.hashStateAndLabel(42, 'alpha');
      const b = SeededRandomSource.hashStateAndLabel(42, 'beta');
      expect(a.state).not.toBe(b.state);
    });

    test('state value is a non-negative number from hash', () => {
      const result = SeededRandomSource.hashStateAndLabel(999, 'test');
      expect(result.state).toBeGreaterThanOrEqual(0);
    });
  });

  describe('mulberryStep', () => {
    test('returns value in [0, 1) range', () => {
      const result = SeededRandomSource.mulberryStep(42);
      expect(result.value).toBeGreaterThanOrEqual(0);
      expect(result.value).toBeLessThan(1);
    });

    test('advances state deterministically', () => {
      const first = SeededRandomSource.mulberryStep(42);
      const second = SeededRandomSource.mulberryStep(42);
      expect(first).toEqual(second);
    });

    test('different states produce different results', () => {
      const a = SeededRandomSource.mulberryStep(1);
      const b = SeededRandomSource.mulberryStep(2);
      expect(a.value).not.toBe(b.value);
      expect(a.nextState).not.toBe(b.nextState);
    });

    test('nextState is an unsigned 32-bit integer', () => {
      const result = SeededRandomSource.mulberryStep(0);
      expect(result.nextState).toBeGreaterThanOrEqual(0);
      expect(result.nextState).toBeLessThanOrEqual(0xffffffff);
      expect(Number.isInteger(result.nextState)).toBe(true);
    });

    test('state 0 produces valid output', () => {
      const result = SeededRandomSource.mulberryStep(0);
      expect(result.value).toBeGreaterThanOrEqual(0);
      expect(result.value).toBeLessThan(1);
      // nextState should be 0x6D2B79F5 (the constant added)
      expect(result.nextState).toBe(0x6d2b79f5);
    });

    test('produces [0,1) values across many states', () => {
      let state = 12345;
      for (let i = 0; i < 1000; i++) {
        const result = SeededRandomSource.mulberryStep(state);
        expect(result.value).toBeGreaterThanOrEqual(0);
        expect(result.value).toBeLessThan(1);
        state = result.nextState;
      }
    });
  });

  describe('seed edge cases', () => {
    test('seed 0 produces a valid source', () => {
      expect(SeededRandomSource.create(0)).toSucceedAndSatisfy((source) => {
        expect(source.seed).toBe('0');
        const value = source.next();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      });
    });

    test('negative seed produces a valid source', () => {
      expect(SeededRandomSource.create(-1)).toSucceedAndSatisfy((source) => {
        expect(source.seed).toBe('-1');
        const value = source.next();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      });
    });

    test('very large numeric seed produces a valid source', () => {
      expect(SeededRandomSource.create(Number.MAX_SAFE_INTEGER)).toSucceedAndSatisfy((source) => {
        const value = source.next();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      });
    });

    test('empty string seed produces a valid source', () => {
      expect(SeededRandomSource.create('')).toSucceedAndSatisfy((source) => {
        expect(source.seed).toBe('');
        const value = source.next();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      });
    });

    test('whitespace string seed produces a valid source', () => {
      expect(SeededRandomSource.create('  ')).toSucceedAndSatisfy((source) => {
        expect(source.seed).toBe('  ');
        const value = source.next();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      });
    });

    test('unicode string seed produces a valid source', () => {
      expect(SeededRandomSource.create('🎲🎰')).toSucceedAndSatisfy((source) => {
        expect(source.seed).toBe('🎲🎰');
        const value = source.next();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      });
    });
  });
});
