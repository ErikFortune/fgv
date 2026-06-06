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

import { captureResult, Result } from '@fgv/ts-utils';

/**
 * Represents a seed as both a string and a number.
 * @public
 */
export interface ISeedPair {
  seed: string;
  state: number;
}

/**
 * Result of an internal next() operation.
 * @public
 */
export interface INextResult {
  value: number;
  nextState: number;
}

/**
 * Function that steps a random number generator state and returns the next value.
 * @public
 */
export type RandomStepFunction = (state: number) => INextResult;

/**
 * Constructor params for a {@link Generator.SeededRandomSource | SeededRandomSource}.
 * @public
 */
export interface ISeededRandomSourceConstructorParams {
  state: number;
  seed: string;
  counter: number;
  lineage: ReadonlyArray<string>;
  step: RandomStepFunction;
}

/**
 * Static create parameters for a {@link Generator.SeededRandomSource | SeededRandomSource}.
 * @public
 */
export interface ISeededRandomSourceCreateParams {
  seed?: number | string;
  step?: RandomStepFunction;
}

/**
 * Seeded random number generator that can be cloned and used for deterministic generation.
 * @public
 */
export class SeededRandomSource {
  private _currentState: number;
  public readonly seed: string;
  public readonly lineage: ReadonlyArray<string>;
  private _counter: number;
  private _step: RandomStepFunction;

  /**
   * Gets the current counter value.
   */
  public get counter(): number {
    return this._counter;
  }

  /**
   * Creates a new seeded random source.
   * @param init - The constructor parameters.
   */
  protected constructor(init: ISeededRandomSourceConstructorParams) {
    this._currentState = init.state;
    this.seed = init.seed;
    this._counter = init.counter;
    this._step = init.step;
    this.lineage = init.lineage;
  }

  /**
   * Creates a new seeded random source from an optional seed.
   * @param seed - The optional seed value.
   * @returns A new seeded random source.
   */
  public static create(seed?: number | string): Result<SeededRandomSource>;

  /**
   * Creates a new seeded random source from {@link Generator.ISeededRandomSourceCreateParams | ISeededRandomSourceCreateParams}.
   * @param init - The initialization parameters.
   * @returns A new seeded random source.
   */
  public static create(init: ISeededRandomSourceCreateParams): Result<SeededRandomSource>;

  public static create(
    seedOrInit?: number | string | ISeededRandomSourceCreateParams
  ): Result<SeededRandomSource> {
    const init = typeof seedOrInit === 'object' ? seedOrInit : { seed: seedOrInit };
    const step = init?.step ?? SeededRandomSource.mulberryStep;
    const { seed, state } = SeededRandomSource.hashSeed(init?.seed ?? Date.now());
    return captureResult(
      () =>
        new SeededRandomSource({
          state,
          seed,
          counter: 0,
          lineage: [],
          step
        })
    );
  }

  /**
   * Generates the next random number.
   * @returns A random number between 0 and 1.
   */
  public next(): number {
    this._counter += 1;
    const { value, nextState } = this._step(this._currentState);
    this._currentState = nextState;
    return value;
  }

  /**
   * Creates a clone of this random source.
   * @returns A new seeded random source with the same state.
   */
  public clone(): SeededRandomSource {
    return new SeededRandomSource({
      state: this._currentState,
      seed: this.seed,
      counter: this._counter,
      lineage: this.lineage,
      step: this._step
    });
  }

  /**
   * Creates a child random source with a label.
   * @param label - The label for the child.
   * @returns A new seeded random source with a hashed state and label.
   */
  public createChild(label: string): SeededRandomSource {
    const { seed, state } = SeededRandomSource.hashStateAndLabel(this._currentState, label);
    const lineage = [...this.lineage, `${this._counter}:${label}`];
    return new SeededRandomSource({ state, seed, counter: 0, lineage, step: this._step });
  }

  /**
   * Steps a mulberry32 random number generator state and returns the next value.
   * @param currentState - The current state of the generator.
   * @returns The next random number and the next state.
   */
  public static mulberryStep(currentState: number): INextResult {
    const nextState = (currentState + 0x6d2b79f5) >>> 0;

    let t = nextState;
    // eslint-disable-next-line no-bitwise
    t = Math.imul(t ^ (t >>> 15), t | 1);
    // eslint-disable-next-line no-bitwise
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

    const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    return { value, nextState };
  }

  /**
   * Hashes a seed value.
   * @param seed - The seed value.
   * @returns A hashed seed value.
   */
  public static hashSeed(seed: number | string): ISeedPair {
    if (typeof seed === 'number') {
      return { seed: seed.toString(), state: seed };
    }
    const parsedSeed = Number(seed);
    if (!isNaN(parsedSeed) && isFinite(parsedSeed)) {
      return { seed, state: parsedSeed };
    }
    return { seed, state: SeededRandomSource._hashString(seed) };
  }

  /**
   * Hashes a state and label.
   * @param state - The state value.
   * @param label - The label value.
   * @returns A hashed state and label value.
   */
  public static hashStateAndLabel(state: number, label: string): ISeedPair {
    const seed = `${state >>> 0}:${label}`;
    return { seed, state: SeededRandomSource._hashString(seed) };
  }

  /**
   * Hashes a string value.
   * @param value - The string value.
   * @returns A hashed string value.
   */
  private static _hashString(value: string): number {
    let hash = 0x811c9dc5;

    for (let index = 0; index < value.length; index++) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 0x01000193);
    }

    return hash >>> 0;
  }
}
