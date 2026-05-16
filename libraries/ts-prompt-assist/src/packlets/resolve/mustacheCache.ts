/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Hash, Result, fail, succeed } from '@fgv/ts-utils';
import { Mustache } from '@fgv/ts-extras';
import { PromptId } from '../types';

const DEFAULT_CAP: number = 256;

/**
 * Bounded LRU cache for parsed `MustacheTemplate` instances keyed by
 * `(promptId, body-hash)`. Cardinality is bounded by the prompt-corpus
 * body count, fully appropriate to cache (vs rendered outputs which are
 * combinatorial in the open qualifier-value space — those are explicitly
 * not cached per design §15.5).
 *
 * @public
 */
export class MustacheTemplateCache {
  private readonly _entries: Map<string, Mustache.MustacheTemplate>;
  private readonly _cap: number;
  private readonly _hasher: Hash.Crc32Normalizer;

  private constructor(cap: number, hasher: Hash.Crc32Normalizer) {
    this._entries = new Map();
    this._cap = cap;
    this._hasher = hasher;
  }

  /** Family-convention factory. */
  public static create(cap: number = DEFAULT_CAP): Result<MustacheTemplateCache> {
    if (cap <= 0) {
      return fail(`templateCacheSize: must be positive (got ${cap})`);
    }
    return succeed(new MustacheTemplateCache(cap, new Hash.Crc32Normalizer()));
  }

  /**
   * Returns the parsed template for `(promptId, body)`. On a cache miss
   * the template is parsed (with `escape: 'none'`, per design §6) and
   * inserted with LRU eviction.
   */
  public getOrParse(promptId: PromptId, body: string): Result<Mustache.MustacheTemplate> {
    return this._hasher
      .computeHash(body)
      .withErrorFormat((msg) => `prompt '${promptId}': hash failed: ${msg}`)
      .onSuccess((bodyHash) => {
        // Copilot review (PR #362, deferred to B-1b): the `::` delimiter
        // is safe today because `Convert.promptId` rejects empty strings
        // only (no character-class restriction). If `brandedString` is
        // tightened later to reject `::` in PromptIds (see ids.ts review
        // note), this key is collision-free. If `PromptId` keeps allowing
        // arbitrary characters, switch this to a nested map keyed by
        // `promptId` then `bodyHash` to avoid any collision risk.
        const key = `${promptId}::${bodyHash}`;
        const existing = this._entries.get(key);
        if (existing !== undefined) {
          // LRU touch: re-insert to bump recency.
          this._entries.delete(key);
          this._entries.set(key, existing);
          return succeed(existing);
        }
        return Mustache.MustacheTemplate.create(body, { escape: 'none' })
          .withErrorFormat((msg) => `prompt '${promptId}': mustache parse failed: ${msg}`)
          .onSuccess((template) => {
            this._evictIfNeeded();
            this._entries.set(key, template);
            return succeed(template);
          });
      });
  }

  /** Current entry count (for tests / observability). */
  public get size(): number {
    return this._entries.size;
  }

  private _evictIfNeeded(): void {
    while (this._entries.size >= this._cap) {
      const oldestKey = this._entries.keys().next().value;
      /* c8 ignore next 4 - defensive: Map.keys() yields a key when size>=cap>0;
         the TS type permits undefined but the runtime invariant excludes it */
      if (oldestKey === undefined) {
        return;
      }
      this._entries.delete(oldestKey);
    }
  }
}
