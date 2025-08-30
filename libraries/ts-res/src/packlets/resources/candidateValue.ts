/*
 * Copyright (c) 2025 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { JsonValue } from '@fgv/ts-json-base';
import { Collections, Hash, Result, captureResult, fail, succeed } from '@fgv/ts-utils';
import { CandidateValueIndex, CandidateValueKey } from '../common';
import * as Common from '../common';

/**
 * Interface for a candidate value that can be collected and indexed.
 * Candidate values are normalized JSON values that can be shared across
 * multiple resource candidates to reduce duplication.
 * @public
 */
export interface ICandidateValue extends Collections.ICollectible<CandidateValueKey, CandidateValueIndex> {
  /**
   * The unique key for this candidate value, derived from the hash of the normalized JSON.
   */
  readonly key: CandidateValueKey;

  /**
   * The index of this candidate value in the collection.
   */
  readonly index: CandidateValueIndex | undefined;

  /**
   * The normalized JSON value.
   */
  readonly json: JsonValue;

  /**
   * Sets the index of this candidate value.
   * @param index - The index to set.
   * @returns `Success` with the index if successful, or `Failure` with an error message if not.
   */
  setIndex(index: number): Result<CandidateValueIndex>;
}

/**
 * Parameters for creating a {@link Resources.CandidateValue | CandidateValue}.
 * @public
 */
export interface ICandidateValueCreateParams {
  /**
   * The JSON value to store. Will be normalized during creation.
   */
  json: JsonValue;

  /**
   * Optional normalizer to use for normalizing the JSON value.
   * If not provided, a default Crc32Normalizer will be used.
   */
  normalizer?: Hash.Crc32Normalizer;

  /**
   * Optional index if the value is already indexed.
   */
  index?: number;
}

/**
 * Implementation of a candidate value that stores normalized JSON data.
 * The value is normalized on creation and a hash-based key is generated
 * for efficient deduplication.
 * @public
 */
export class CandidateValue implements ICandidateValue {
  private readonly _collectible: Collections.Collectible<CandidateValueKey, CandidateValueIndex>;
  private readonly _json: JsonValue;

  /**
   * The unique key for this candidate value.
   */
  public get key(): CandidateValueKey {
    return this._collectible.key;
  }

  /**
   * The index of this candidate value in the collection.
   */
  public get index(): CandidateValueIndex | undefined {
    return this._collectible.index;
  }

  /**
   * The normalized JSON value.
   */
  public get json(): JsonValue {
    return this._json;
  }

  /**
   * Constructor for a {@link Resources.CandidateValue} object.
   * @param params - Parameters to create the candidate value.
   * @internal
   */
  protected constructor(params: ICandidateValueCreateParams) {
    const normalizer = params.normalizer ?? new Hash.Crc32Normalizer();

    // Normalize the JSON value
    const normalizedResult = normalizer.normalize(params.json);
    this._json = normalizedResult.orThrow();

    // Generate key from the normalized value using computeHash
    const keyResult = normalizer.computeHash(this._json);
    const key = keyResult.orThrow() as unknown as CandidateValueKey;

    // Create the collectible with the key and optional index
    this._collectible = new Collections.Collectible({
      key,
      index: params.index,
      indexConverter: Common.Convert.candidateValueIndex
    });
  }

  /**
   * Creates a new {@link Resources.CandidateValue} object.
   * @param params - Parameters to create the candidate value.
   * @returns `Success` with the new candidate value if successful,
   * or `Failure` with an error message if not.
   * @public
   */
  public static create(params: ICandidateValueCreateParams): Result<CandidateValue> {
    return captureResult(() => new CandidateValue(params));
  }

  /**
   * Sets the index of this candidate value.
   * @param index - The index to set.
   * @returns `Success` with the index if successful, or `Failure` with an error message if not.
   * @public
   */
  public setIndex(index: number): Result<CandidateValueIndex> {
    return this._collectible.setIndex(index);
  }
}

/**
 * Converts a string to a {@link CandidateValueKey | candidate value key}.
 *
 * @param key - The string to convert.
 * @returns `Success` with the converted key if valid, or `Failure` with an error message
 * if not.
 * @public
 */
export function toCandidateValueKey(key: string): Result<CandidateValueKey> {
  // CandidateValueKey is a hash string, so any non-empty string is valid
  if (key.length === 0) {
    return fail('Candidate value key cannot be empty');
  }
  return succeed(key as unknown as CandidateValueKey);
}
