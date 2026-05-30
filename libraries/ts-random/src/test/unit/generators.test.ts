import '@fgv/ts-utils-jest';

import { IRandomSequencePickParams, ISequentialPickParams, PseudoRandomGenerator } from '../../generator';

function createGenerator(seed: number | string = 42): PseudoRandomGenerator {
  return PseudoRandomGenerator.create({ seed }).orThrow();
}

describe('PseudoRandomGenerator', () => {
  // Clean up global state between tests
  afterEach(() => {
    PseudoRandomGenerator.setGlobalRng(undefined);
  });

  describe('create', () => {
    test('succeeds with no params', () => {
      expect(PseudoRandomGenerator.create()).toSucceedAndSatisfy((gen) => {
        expect(gen.rng).toBeDefined();
        expect(gen.rng.counter).toBe(0);
      });
    });

    test('succeeds with a seed', () => {
      expect(PseudoRandomGenerator.create({ seed: 123 })).toSucceedAndSatisfy((gen) => {
        expect(gen.rng.seed).toBe('123');
      });
    });

    test('succeeds with a string seed', () => {
      expect(PseudoRandomGenerator.create({ seed: 'hello' })).toSucceedAndSatisfy((gen) => {
        expect(gen.rng.seed).toBe('hello');
      });
    });

    test('same seed produces identical sequences', () => {
      const gen1 = createGenerator('deterministic');
      const gen2 = createGenerator('deterministic');
      const values1 = Array.from({ length: 10 }, () => gen1.nextFloat());
      const values2 = Array.from({ length: 10 }, () => gen2.nextFloat());
      expect(values1).toEqual(values2);
    });

    test('different seeds produce different sequences', () => {
      const gen1 = createGenerator('alpha');
      const gen2 = createGenerator('beta');
      const values1 = Array.from({ length: 4 }, () => gen1.nextFloat());
      const values2 = Array.from({ length: 4 }, () => gen2.nextFloat());
      expect(values1).not.toEqual(values2);
    });

    test('sets global rng when global is true', () => {
      expect(PseudoRandomGenerator.getGlobalRng()).toBeUndefined();
      expect(PseudoRandomGenerator.create({ seed: 1, global: true })).toSucceedAndSatisfy((gen) => {
        expect(PseudoRandomGenerator.getGlobalRng()).toBe(gen);
      });
    });

    test('does not set global rng when global is false', () => {
      PseudoRandomGenerator.create({ seed: 1, global: false }).orThrow();
      expect(PseudoRandomGenerator.getGlobalRng()).toBeUndefined();
    });

    test('does not set global rng when global is omitted', () => {
      PseudoRandomGenerator.create({ seed: 1 }).orThrow();
      expect(PseudoRandomGenerator.getGlobalRng()).toBeUndefined();
    });
  });

  describe('clone', () => {
    test('produces identical sequence from clone point', () => {
      const gen = createGenerator(7);
      gen.nextFloat();
      gen.nextFloat();

      const clone = gen.clone();
      const original = Array.from({ length: 5 }, () => gen.nextFloat());
      const cloned = Array.from({ length: 5 }, () => clone.nextFloat());
      expect(original).toEqual(cloned);
    });

    test('clone is independent of parent', () => {
      const gen = createGenerator(7);
      const clone = gen.clone();

      gen.nextFloat();
      gen.nextFloat();
      gen.nextFloat();

      expect(gen.rng.counter).toBe(3);
      expect(clone.rng.counter).toBe(0);
    });
  });

  describe('createChild', () => {
    test('child has independent state from parent', () => {
      const gen = createGenerator(7);
      gen.nextFloat();

      const child = gen.createChild('branch');
      expect(child.rng.counter).toBe(0);
      expect(child.rng.lineage).toEqual(['1:branch']);
    });

    test('same label from same parent state produces identical child', () => {
      const gen1 = createGenerator(7);
      const gen2 = createGenerator(7);
      gen1.nextFloat();
      gen2.nextFloat();

      const child1 = gen1.createChild('x');
      const child2 = gen2.createChild('x');
      const values1 = Array.from({ length: 5 }, () => child1.nextFloat());
      const values2 = Array.from({ length: 5 }, () => child2.nextFloat());
      expect(values1).toEqual(values2);
    });

    test('different labels produce different children', () => {
      const gen = createGenerator(7);
      gen.nextFloat();

      const childA = gen.createChild('a');
      const childB = gen.createChild('b');
      const valuesA = Array.from({ length: 4 }, () => childA.nextFloat());
      const valuesB = Array.from({ length: 4 }, () => childB.nextFloat());
      expect(valuesA).not.toEqual(valuesB);
    });
  });

  describe('nextFloat', () => {
    test('returns values in [0, 1)', () => {
      const gen = createGenerator(42);
      for (let i = 0; i < 500; i++) {
        const value = gen.nextFloat();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });

    test('advances the rng counter', () => {
      const gen = createGenerator(1);
      expect(gen.rng.counter).toBe(0);
      gen.nextFloat();
      expect(gen.rng.counter).toBe(1);
      gen.nextFloat();
      gen.nextFloat();
      expect(gen.rng.counter).toBe(3);
    });
  });

  describe('nextInt', () => {
    test('returns non-negative integers less than extent', () => {
      const gen = createGenerator(42);
      for (let i = 0; i < 500; i++) {
        const value = gen.nextInt(100);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(100);
        expect(Number.isInteger(value)).toBe(true);
      }
    });

    test('returns large non-negative integer when extent is omitted', () => {
      const gen = createGenerator(42);
      const value = gen.nextInt();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(Number.MAX_SAFE_INTEGER);
      expect(Number.isInteger(value)).toBe(true);
    });

    test('returns 0 when extent is 0', () => {
      const gen = createGenerator(42);
      expect(gen.nextInt(0)).toBe(0);
    });

    test('extent of 0 still advances the rng', () => {
      const gen1 = createGenerator(42);
      const gen2 = createGenerator(42);

      gen1.nextInt(0);
      gen2.nextInt(10);

      // Both advanced one step, so next values should match
      expect(gen1.nextFloat()).toBe(gen2.nextFloat());
    });

    test('returns 0 when extent is 1', () => {
      const gen = createGenerator(42);
      for (let i = 0; i < 50; i++) {
        expect(gen.nextInt(1)).toBe(0);
      }
    });

    test('handles negative extent', () => {
      const gen = createGenerator(42);
      for (let i = 0; i < 500; i++) {
        const value = gen.nextInt(-100);
        expect(value).toBeLessThanOrEqual(0);
        expect(value).toBeGreaterThan(-100);
        expect(Number.isInteger(value)).toBe(true);
      }
    });

    test('falls back to large range for Infinity extent', () => {
      const gen = createGenerator(42);
      const value = gen.nextInt(Infinity);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(value)).toBe(true);
    });

    test('falls back to large range for NaN extent', () => {
      const gen = createGenerator(42);
      const value = gen.nextInt(NaN);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(value)).toBe(true);
    });

    test('falls back to large range for -Infinity extent', () => {
      const gen = createGenerator(42);
      const value = gen.nextInt(-Infinity);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(value)).toBe(true);
    });
  });

  describe('nextInRange', () => {
    test('returns values in [min, max] range', () => {
      const gen = createGenerator(42);
      for (let i = 0; i < 500; i++) {
        const value = gen.nextInRange(10, 20);
        expect(value).toBeGreaterThanOrEqual(10);
        expect(value).toBeLessThanOrEqual(20);
        expect(Number.isInteger(value)).toBe(true);
      }
    });

    test('returns min when min equals max', () => {
      const gen = createGenerator(42);
      for (let i = 0; i < 20; i++) {
        expect(gen.nextInRange(5, 5)).toBe(5);
      }
    });

    test('handles swapped min and max', () => {
      const gen = createGenerator(42);
      for (let i = 0; i < 500; i++) {
        const value = gen.nextInRange(20, 10);
        expect(value).toBeGreaterThanOrEqual(10);
        expect(value).toBeLessThanOrEqual(20);
        expect(Number.isInteger(value)).toBe(true);
      }
    });

    test('defaults min to 0 when undefined', () => {
      const gen = createGenerator(42);
      for (let i = 0; i < 200; i++) {
        const value = gen.nextInRange(undefined, 10);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(10);
      }
    });

    test('defaults max to MAX_SAFE_INTEGER when undefined', () => {
      const gen = createGenerator(42);
      const value = gen.nextInRange(0, undefined);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(value)).toBe(true);
    });

    test('both min and max undefined gives full non-negative range', () => {
      const gen = createGenerator(42);
      const value = gen.nextInRange(undefined, undefined);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(value)).toBe(true);
    });

    test('handles negative ranges', () => {
      const gen = createGenerator(42);
      for (let i = 0; i < 500; i++) {
        const value = gen.nextInRange(-20, -10);
        expect(value).toBeGreaterThanOrEqual(-20);
        expect(value).toBeLessThanOrEqual(-10);
        expect(Number.isInteger(value)).toBe(true);
      }
    });

    test('handles range crossing zero', () => {
      const gen = createGenerator(42);
      for (let i = 0; i < 500; i++) {
        const value = gen.nextInRange(-5, 5);
        expect(value).toBeGreaterThanOrEqual(-5);
        expect(value).toBeLessThanOrEqual(5);
        expect(Number.isInteger(value)).toBe(true);
      }
    });
  });

  describe('nextBoolean', () => {
    test('returns boolean values with default probability', () => {
      const gen = createGenerator(42);
      let trueCount = 0;
      const trials = 1000;

      for (let i = 0; i < trials; i++) {
        if (gen.nextBoolean()) {
          trueCount++;
        }
      }

      // With 0.5 probability over 1000 trials, should be roughly balanced
      expect(trueCount).toBeGreaterThan(350);
      expect(trueCount).toBeLessThan(650);
    });

    test('returns mostly true with high probability', () => {
      const gen = createGenerator(42);
      let trueCount = 0;
      const trials = 1000;

      for (let i = 0; i < trials; i++) {
        if (gen.nextBoolean(0.95)) {
          trueCount++;
        }
      }

      expect(trueCount).toBeGreaterThan(900);
    });

    test('returns mostly false with low probability', () => {
      const gen = createGenerator(42);
      let trueCount = 0;
      const trials = 1000;

      for (let i = 0; i < trials; i++) {
        if (gen.nextBoolean(0.05)) {
          trueCount++;
        }
      }

      expect(trueCount).toBeLessThan(100);
    });

    test('always returns false with probability 0', () => {
      const gen = createGenerator(42);
      for (let i = 0; i < 100; i++) {
        expect(gen.nextBoolean(0)).toBe(false);
      }
    });

    test('always returns true with probability 1', () => {
      const gen = createGenerator(42);
      for (let i = 0; i < 100; i++) {
        expect(gen.nextBoolean(1)).toBe(true);
      }
    });
  });

  describe('nextString', () => {
    test('returns string of requested length', () => {
      const gen = createGenerator(42);
      expect(gen.nextString(10)).toHaveLength(10);
      expect(gen.nextString(0)).toHaveLength(0);
      expect(gen.nextString(100)).toHaveLength(100);
    });

    test('uses default alphanumeric character set', () => {
      const gen = createGenerator(42);
      const str = gen.nextString(200);
      expect(str).toMatch(/^[A-Za-z0-9]+$/);
    });

    test('uses custom character set', () => {
      const gen = createGenerator(42);
      const str = gen.nextString(100, 'abc');
      expect(str).toMatch(/^[abc]+$/);
    });

    test('single character set produces uniform string', () => {
      const gen = createGenerator(42);
      const str = gen.nextString(20, 'X');
      expect(str).toBe('X'.repeat(20));
    });

    test('same seed produces same string', () => {
      const gen1 = createGenerator(42);
      const gen2 = createGenerator(42);
      expect(gen1.nextString(50)).toBe(gen2.nextString(50));
    });

    test('empty string length returns empty string', () => {
      const gen = createGenerator(42);
      expect(gen.nextString(0)).toBe('');
    });
  });

  describe('pickNext', () => {
    test('returns an item from the array', () => {
      const gen = createGenerator(42);
      const items = ['a', 'b', 'c', 'd', 'e'];
      for (let i = 0; i < 100; i++) {
        expect(items).toContain(gen.pickNext(items));
      }
    });

    test('returns undefined for empty array', () => {
      const gen = createGenerator(42);
      expect(gen.pickNext([])).toBeUndefined();
    });

    test('returns undefined for undefined input', () => {
      const gen = createGenerator(42);
      expect(gen.pickNext(undefined)).toBeUndefined();
    });

    test('returns the only item for single-element array', () => {
      const gen = createGenerator(42);
      for (let i = 0; i < 20; i++) {
        expect(gen.pickNext(['only'])).toBe('only');
      }
    });

    test('is deterministic with same seed', () => {
      const gen1 = createGenerator(42);
      const gen2 = createGenerator(42);
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const picks1 = Array.from({ length: 20 }, () => gen1.pickNext(items));
      const picks2 = Array.from({ length: 20 }, () => gen2.pickNext(items));
      expect(picks1).toEqual(picks2);
    });

    test('works with typed arrays', () => {
      const gen = createGenerator(42);
      const numbers = [10, 20, 30];
      const picked = gen.pickNext(numbers);
      expect(picked).toBeDefined();
      expect(numbers).toContain(picked);
    });
  });

  describe('pickSequential', () => {
    const dictA = ['a1', 'a2', 'a3'];
    const dictB = ['b1', 'b2', 'b3'];
    const dictC = ['c1', 'c2', 'c3'];

    test('picks one item from each candidate dictionary in order', () => {
      const gen = createGenerator(42);
      const result = gen.pickSequential({
        how: 'sequence',
        candidates: [dictA, dictB, dictC]
      });

      expect(result).toHaveLength(3);
      expect(dictA).toContain(result[0]);
      expect(dictB).toContain(result[1]);
      expect(dictC).toContain(result[2]);
    });

    test('defaults count to number of candidate dictionaries', () => {
      const gen = createGenerator(42);
      const result = gen.pickSequential({
        how: 'sequence',
        candidates: [dictA, dictB]
      });
      expect(result).toHaveLength(2);
    });

    test('wraps around dictionaries when count exceeds candidates', () => {
      const gen = createGenerator(42);
      const result = gen.pickSequential({
        how: 'sequence',
        count: 7,
        candidates: [dictA, dictB, dictC]
      });

      expect(result).toHaveLength(7);
      // Items 0, 3, 6 come from dictA; 1, 4 from dictB; 2, 5 from dictC
      expect(dictA).toContain(result[0]);
      expect(dictB).toContain(result[1]);
      expect(dictC).toContain(result[2]);
      expect(dictA).toContain(result[3]);
      expect(dictB).toContain(result[4]);
      expect(dictC).toContain(result[5]);
      expect(dictA).toContain(result[6]);
    });

    test('count of 0 returns empty array', () => {
      const gen = createGenerator(42);
      const result = gen.pickSequential({
        how: 'sequence',
        count: 0,
        candidates: [dictA, dictB]
      });
      expect(result).toEqual([]);
    });

    test('skips undefined picks from empty candidate dictionaries', () => {
      const gen = createGenerator(42);
      const result = gen.pickSequential({
        how: 'sequence',
        candidates: [dictA, [], dictC]
      });

      // The empty dictionary yields undefined which is skipped
      expect(result).toHaveLength(2);
      expect(dictA).toContain(result[0]);
      expect(dictC).toContain(result[1]);
    });

    test('is deterministic with same seed', () => {
      const gen1 = createGenerator(42);
      const gen2 = createGenerator(42);
      const params: ISequentialPickParams<string> = {
        how: 'sequence',
        count: 10,
        candidates: [dictA, dictB, dictC]
      };
      expect(gen1.pickSequential(params)).toEqual(gen2.pickSequential(params));
    });
  });

  describe('pickRandom', () => {
    const dictA = ['a1', 'a2', 'a3'];
    const dictB = ['b1', 'b2', 'b3'];
    const dictC = ['c1', 'c2', 'c3'];

    test('picks count items from randomly selected dictionaries', () => {
      const gen = createGenerator(42);
      const result = gen.pickRandom({
        how: 'random',
        count: 10,
        candidates: [dictA, dictB, dictC]
      });

      expect(result).toHaveLength(10);
      const allItems = [...dictA, ...dictB, ...dictC];
      for (const item of result) {
        expect(allItems).toContain(item);
      }
    });

    test('count of 0 returns empty array', () => {
      const gen = createGenerator(42);
      const result = gen.pickRandom({
        how: 'random',
        count: 0,
        candidates: [dictA, dictB]
      });
      expect(result).toEqual([]);
    });

    test('single candidate dictionary picks only from that dictionary', () => {
      const gen = createGenerator(42);
      const result = gen.pickRandom({
        how: 'random',
        count: 20,
        candidates: [dictA]
      });

      expect(result).toHaveLength(20);
      for (const item of result) {
        expect(dictA).toContain(item);
      }
    });

    test('is deterministic with same seed', () => {
      const gen1 = createGenerator(42);
      const gen2 = createGenerator(42);
      const params: IRandomSequencePickParams<string> = {
        how: 'random',
        count: 10,
        candidates: [dictA, dictB, dictC]
      };
      expect(gen1.pickRandom(params)).toEqual(gen2.pickRandom(params));
    });

    test('skips undefined picks from empty candidate dictionaries', () => {
      const gen = createGenerator(42);
      const result = gen.pickRandom({
        how: 'random',
        count: 20,
        candidates: [dictA, [], dictC]
      });

      // Some picks land on the empty dictionary and are skipped
      expect(result.length).toBeLessThanOrEqual(20);
      expect(result.length).toBeGreaterThan(0);
      const allItems = [...dictA, ...dictC];
      for (const item of result) {
        expect(allItems).toContain(item);
      }
    });
  });

  describe('pickSequence', () => {
    const dictA = ['a1', 'a2'];
    const dictB = ['b1', 'b2'];

    test('dispatches to pickSequential for sequence mode', () => {
      const gen = createGenerator(42);
      const result = gen.pickSequence({
        how: 'sequence',
        candidates: [dictA, dictB]
      });

      expect(result).toHaveLength(2);
      expect(dictA).toContain(result[0]);
      expect(dictB).toContain(result[1]);
    });

    test('dispatches to pickRandom for random mode', () => {
      const gen = createGenerator(42);
      const result = gen.pickSequence({
        how: 'random',
        count: 5,
        candidates: [dictA, dictB]
      });

      expect(result).toHaveLength(5);
      const allItems = [...dictA, ...dictB];
      for (const item of result) {
        expect(allItems).toContain(item);
      }
    });

    test('produces identical results to direct method calls', () => {
      const gen1 = createGenerator(42);
      const gen2 = createGenerator(42);

      const seqResult = gen1.pickSequence({
        how: 'sequence',
        count: 4,
        candidates: [dictA, dictB]
      });
      const directResult = gen2.pickSequential({
        how: 'sequence',
        count: 4,
        candidates: [dictA, dictB]
      });
      expect(seqResult).toEqual(directResult);
    });
  });

  describe('global RNG', () => {
    test('setGlobalRng sets and returns the generator', () => {
      const gen = createGenerator(42);
      const result = PseudoRandomGenerator.setGlobalRng(gen);
      expect(result).toBe(gen);
      expect(PseudoRandomGenerator.getGlobalRng()).toBe(gen);
    });

    test('setGlobalRng with undefined clears the global', () => {
      const gen = createGenerator(42);
      PseudoRandomGenerator.setGlobalRng(gen);
      expect(PseudoRandomGenerator.getGlobalRng()).toBe(gen);

      PseudoRandomGenerator.setGlobalRng(undefined);
      expect(PseudoRandomGenerator.getGlobalRng()).toBeUndefined();
    });

    test('getGlobalRng returns undefined when not set', () => {
      expect(PseudoRandomGenerator.getGlobalRng()).toBeUndefined();
    });
  });

  describe('ensureRng', () => {
    test('returns the provided rng if given', () => {
      const gen = createGenerator(42);
      expect(PseudoRandomGenerator.ensureRng(gen)).toSucceedAndSatisfy((result) => {
        expect(result).toBe(gen);
      });
    });

    test('returns global rng when no rng is provided and global is set', () => {
      const global = createGenerator(99);
      PseudoRandomGenerator.setGlobalRng(global);

      expect(PseudoRandomGenerator.ensureRng()).toSucceedAndSatisfy((result) => {
        expect(result).toBe(global);
      });
    });

    test('creates a new rng when none provided and no global is set', () => {
      expect(PseudoRandomGenerator.ensureRng()).toSucceedAndSatisfy((result) => {
        expect(result).toBeDefined();
        expect(result.rng.counter).toBe(0);
      });
    });

    test('prefers provided rng over global', () => {
      const global = createGenerator(99);
      const local = createGenerator(42);
      PseudoRandomGenerator.setGlobalRng(global);

      expect(PseudoRandomGenerator.ensureRng(local)).toSucceedAndSatisfy((result) => {
        expect(result).toBe(local);
      });
    });
  });
});
