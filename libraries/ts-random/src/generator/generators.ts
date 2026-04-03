// Copyright (c) 2026 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import { captureResult, Result, Success } from '@fgv/ts-utils';
import { RandomStepFunction, SeededRandomSource } from './randomSource';

/**
 * Parameters for creating a generator.
 * @public
 */
export interface IPseudoRandomGeneratorCreateParams {
  seed?: number | string;
  step?: RandomStepFunction;
  global?: boolean;
}

/**
 * Parameters for generating a sequence of values
 * from each dictionary in a supplied set, in turn.
 * @public
 */
export interface ISequentialPickParams<T> {
  how: 'sequence';
  count?: number;
  candidates: ReadonlyArray<ReadonlyArray<T>>;
}

/**
 * Parameters for generating a sequence of values
 * by randomly selecting from dictionaries in a supplied set.
 * @public
 */
export interface IRandomSequencePickParams<T> {
  how: 'random';
  count: number;
  candidates: ReadonlyArray<ReadonlyArray<T>>;
}

/**
 * Type representing parameters for generating a sequence of values.
 * @public
 */
export type SequencePickParams<T> = ISequentialPickParams<T> | IRandomSequencePickParams<T>;

/**
 * A pseudo-random number generator that can be used to generate random values
 * of various shapes.
 * @public
 */
export class PseudoRandomGenerator {
  private static _globalRng: PseudoRandomGenerator | undefined;

  /**
   * The underlying random number generator.
   */
  public readonly rng: SeededRandomSource;

  private constructor(rng: SeededRandomSource) {
    this.rng = rng;
  }

  /**
   * Creates a new pseudo-random number generator.
   * @param params - The parameters for creating the generator.
   * @returns A result containing the new generator or an error.
   */
  public static create(params: IPseudoRandomGeneratorCreateParams = {}): Result<PseudoRandomGenerator> {
    return SeededRandomSource.create(params)
      .onSuccess((rng) => captureResult(() => new PseudoRandomGenerator(rng)))
      .onSuccess((generator) => {
        if (params?.global === true) {
          PseudoRandomGenerator.setGlobalRng(generator);
        }
        return Success.with(generator);
      });
  }

  /**
   * Creates a clone of this generator.
   * @returns A new generator with the same state.
   */
  public clone(): PseudoRandomGenerator {
    return new PseudoRandomGenerator(this.rng.clone());
  }

  /**
   * Creates a child generator with the given label.
   * @param label - The label for the child generator.
   * @returns A new generator with the given label.
   */
  public createChild(label: string): PseudoRandomGenerator {
    return new PseudoRandomGenerator(this.rng.createChild(label));
  }

  /**
   * Generates a random float between 0 and 1.
   * @returns A random float between 0 and 1.
   */
  public nextFloat(): number {
    return this.rng.next();
  }

  /**
   * Generates a random integer between 0 and the specified extent (positive or negative).
   * @param extent - The maximum (or minimum) value (exclusive).
   * @returns A random integer between 0 and the specified extent.
   */
  public nextInt(extent?: number): number {
    if (extent !== undefined && Number.isFinite(extent)) {
      if (extent < 0) {
        return Math.ceil(this.rng.next() * extent);
      }
      return Math.floor(this.rng.next() * extent);
    }
    return Math.floor(this.rng.next() * Number.MAX_SAFE_INTEGER);
  }

  /**
   * Generates a random integer between the specified minimum and maximum values.
   * @param min - The minimum value (inclusive).
   * @param max - The maximum value (inclusive).
   * @returns A random integer between the specified minimum and maximum values.
   * @remarks If min is greater than max, the values are swapped.
   */
  public nextInRange(min: number | undefined, max: number | undefined): number {
    min = min ?? 0;
    max = max ?? Number.MAX_SAFE_INTEGER;
    if (min > max) {
      return Math.ceil(this.rng.next() * (min - max - 1)) + max;
    }
    return Math.floor(this.rng.next() * (max - min + 1)) + min;
  }

  /**
   * Generates a random boolean value.
   * @param trueProbability - The probability of returning true (default is 0.5).
   * @returns A random boolean value.
   */
  public nextBoolean(trueProbability: number = 0.5): boolean {
    return this.rng.next() < trueProbability;
  }

  /**
   * Generates a random string of the specified length using the given characters.
   * @param length - The length of the string to generate.
   * @param chars - The characters to use for the string (default is alphanumeric).
   * @returns A random string of the specified length.
   */
  public nextString(
    length: number,
    chars: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  ): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[this.nextInt(chars.length)];
    }
    return result;
  }

  /**
   * Generates a random item from the given array.
   * @param items - The array to select from.
   * @returns A random item from the array or undefined if the array is empty.
   */
  public pickNext<T>(items?: ReadonlyArray<T>): T | undefined {
    if (items === undefined || items.length === 0) {
      return undefined;
    }
    return items[this.nextInt(items.length)];
  }

  /**
   * Generates a sequence of values by randomly selecting from the given candidate
   * dictionaries in order.
   * @param params - The parameters for generating the sequence.
   * @returns A sequence of values.
   */
  public pickSequential<T>(params: ISequentialPickParams<T>): ReadonlyArray<T> {
    const count = params.count ?? params.candidates.length;
    const items: T[] = [];

    for (let i = 0; i < count; i++) {
      const dIndex = i % params.candidates.length;
      const item = this.pickNext(params.candidates[dIndex]);
      if (item !== undefined) {
        items.push(item);
      }
    }

    return items;
  }

  /**
   * Generates a sequence of values by randomly selecting from the supplied
   * dictionaries in random order.
   * @param params - The parameters for generating the sequence.
   * @returns A sequence of values.
   */
  public pickRandom<T>(params: IRandomSequencePickParams<T>): ReadonlyArray<T> {
    const items: T[] = [];

    for (let i = 0; i < params.count; i++) {
      const dIndex = this.nextInt(params.candidates.length);
      const item = this.pickNext(params.candidates[dIndex]);
      if (item !== undefined) {
        items.push(item);
      }
    }

    return items;
  }

  /**
   * Generates a sequence of values by randomly selecting from the given candidates.
   * @param params - The parameters for generating the sequence.
   * @returns A sequence of values.
   */
  public pickSequence<T>(params: SequencePickParams<T>): ReadonlyArray<T> {
    if (params.how === 'sequence') {
      return this.pickSequential(params);
    } else {
      return this.pickRandom(params);
    }
  }

  /**
   * Sets this generator as the global random number generator.
   * @returns A result containing this generator or an error.
   */
  public static setGlobalRng(rng?: PseudoRandomGenerator): PseudoRandomGenerator | undefined {
    PseudoRandomGenerator._globalRng = rng;
    return rng;
  }

  /**
   * Gets the global random number generator.
   * @returns The global random number generator or undefined if not set.
   */
  public static getGlobalRng(): PseudoRandomGenerator | undefined {
    return PseudoRandomGenerator._globalRng;
  }

  /**
   * Ensures a random number generator is available, using the global generator if available
   * or creating a new one if not.
   * @param rng - The random number generator to use, or undefined to use the global one.
   * @returns A random number generator.
   */
  public static ensureRng(rng?: PseudoRandomGenerator): Result<PseudoRandomGenerator> {
    rng = rng ?? PseudoRandomGenerator.getGlobalRng();
    if (rng) {
      return Success.with(rng);
    }
    return PseudoRandomGenerator.create();
  }
}
