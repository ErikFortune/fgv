/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

/**
 * A set of string keys kept in ascending code-unit order, iterable from any key.
 *
 * @remarks
 * A sorted array with binary search: membership, insertion and removal find their position in
 * O(log n), and a keyset page starts at its position in O(log n) instead of scanning from the
 * front. Insertion and removal move the tail, which is O(n) element moves; every set here is
 * bounded by the non-archived capacity dimension or by one subscription's owed updates, so that
 * cost is bounded too. The keys themselves are the identity: the set cannot hold one twice.
 * @internal
 */
export class SortedKeySet {
  private readonly _keys: string[] = [];

  public get size(): number {
    return this._keys.length;
  }

  /** The keys, in order. Exposed for inspection; never mutate. */
  public get keys(): ReadonlyArray<string> {
    return this._keys;
  }

  /** Adds a key. Returns `false` if it was already present. */
  public add(key: string): boolean {
    const at: number = this._lowerBound(key);
    if (at < this._keys.length && this._keys[at] === key) {
      return false;
    }
    this._keys.splice(at, 0, key);
    return true;
  }

  /** Removes a key. Returns `false` if it was absent. */
  public delete(key: string): boolean {
    const at: number = this._lowerBound(key);
    if (at < this._keys.length && this._keys[at] === key) {
      this._keys.splice(at, 1);
      return true;
    }
    return false;
  }

  /** The position of the first key strictly after `after`, or 0 when `after` is absent. */
  public startAfter(after: string | undefined): number {
    if (after === undefined) {
      return 0;
    }
    const at: number = this._lowerBound(after);
    return at < this._keys.length && this._keys[at] === after ? at + 1 : at;
  }

  private _lowerBound(key: string): number {
    let lo: number = 0;
    let hi: number = this._keys.length;
    while (lo < hi) {
      const mid: number = (lo + hi) >>> 1;
      if (this._keys[mid] < key) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }
    return lo;
  }
}

/**
 * Counts the index entries a query reads — the evidence the performance gate asks for.
 * @internal
 */
export interface IVisitCounter {
  candidateVisits: number;
}

/**
 * A forward stream over one sorted set, from a keyset position, with an optional inclusive
 * upper bound. Every key it loads is one counted visit — including the single key past the
 * bound that tells it to stop.
 * @internal
 */
export class KeyStream<TTag> {
  public readonly tag: TTag;
  private readonly _keys: ReadonlyArray<string>;
  private readonly _upper: string | undefined;
  private readonly _counter: IVisitCounter;
  private _at: number;
  private _head: string | undefined;

  public constructor(
    set: SortedKeySet,
    after: string | undefined,
    tag: TTag,
    counter: IVisitCounter,
    upper?: string
  ) {
    this.tag = tag;
    this._keys = set.keys;
    this._upper = upper;
    this._counter = counter;
    this._at = set.startAfter(after);
    this._head = undefined;
    this._load();
  }

  /** The current key, or `undefined` when the stream is exhausted. */
  public get head(): string | undefined {
    return this._head;
  }

  public advance(): void {
    this._at++;
    this._load();
  }

  private _load(): void {
    if (this._at >= this._keys.length) {
      this._head = undefined;
      return;
    }
    const key: string = this._keys[this._at];
    this._counter.candidateVisits++;
    this._head = this._upper !== undefined && key > this._upper ? undefined : key;
    if (this._head === undefined) {
      this._at = this._keys.length;
    }
  }
}

/**
 * Merges streams in key order, yielding each distinct key once with every tag that held it.
 * Deduplication happens here — before any filtering or paging.
 * @internal
 */
export class MergedStream<TTag> {
  private readonly _streams: ReadonlyArray<KeyStream<TTag>>;

  public constructor(streams: ReadonlyArray<KeyStream<TTag>>) {
    this._streams = streams;
  }

  public next(): { readonly key: string; readonly tags: ReadonlyArray<TTag> } | undefined {
    let min: string | undefined = undefined;
    for (const stream of this._streams) {
      const head: string | undefined = stream.head;
      if (head !== undefined && (min === undefined || head < min)) {
        min = head;
      }
    }
    if (min === undefined) {
      return undefined;
    }
    const tags: TTag[] = [];
    for (const stream of this._streams) {
      if (stream.head === min) {
        tags.push(stream.tag);
        stream.advance();
      }
    }
    return { key: min, tags };
  }
}
