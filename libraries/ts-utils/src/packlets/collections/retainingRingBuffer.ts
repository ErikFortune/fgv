/*
 * Copyright (c) 2026 Erik Fortune
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

/**
 * Minimal structural contract a {@link RetainingRingBuffer} record must satisfy:
 * a monotonic `seq` the buffer pages on. Records carry their own `seq` (assigned
 * by the caller) so the buffer is agnostic about how records are minted — a logger
 * assigns `seq` from its own counter, an observability layer assigns a library-global
 * `seq` shared across several buffers, etc.
 * @public
 */
export interface IRetainedRecord {
  /**
   * Monotonic sequence number, assigned by the caller. The buffer assumes
   * non-decreasing `seq` across successive {@link RetainingRingBuffer.push | push}
   * calls and uses it for `sinceSeq` cursor paging and {@link RetainingRingBuffer.lastSeq | lastSeq}.
   */
  readonly seq: number;
}

/**
 * Query options for {@link RetainingRingBuffer.query}.
 * @public
 */
export interface IRetainingRingBufferQuery<T extends IRetainedRecord> {
  /**
   * If supplied, only records with `seq > sinceSeq` are returned, enabling
   * incremental paging from a previously-held cursor.
   */
  readonly sinceSeq?: number;
  /**
   * If supplied, returns at most this many records — the most recent N (tail),
   * still ordered oldest-first.
   */
  readonly limit?: number;
  /**
   * If supplied, only records for which the predicate returns `true` are
   * returned. Applied before `limit`, so `limit` bounds the filtered tail.
   */
  readonly filter?: (record: T) => boolean;
}

/**
 * Construction options for {@link RetainingRingBuffer}.
 * @public
 */
export interface IRetainingRingBufferCreateParams {
  /**
   * The maximum number of records retained before the oldest is overwritten.
   * Defaults to `1000`. A non-finite or sub-1 value is floored to `1` (the ring
   * requires a positive integer capacity to be well-defined).
   */
  readonly maxRecords?: number;
}

/**
 * A generic bounded most-recent-N ring of records, with monotonic-`seq` cursor
 * paging and predicate filtering.
 *
 * @remarks
 * The buffer is a pure storage substrate: the caller mints each record (assigning
 * its own `seq` and any other fields) and {@link RetainingRingBuffer.push | push}es
 * it. The buffer never reshapes a record — it only retains, evicts the oldest when
 * full (O(1), no `shift()` re-indexing regardless of capacity), and answers queries.
 *
 * Separating record minting from retention lets one `seq` authority feed several
 * buffers consistently (e.g. an observability layer that assigns a library-global
 * `seq` and fans the same record out to multiple retaining stores), and lets a
 * single-authority consumer (e.g. a logger) own its own `seq` counter. It is the
 * shared mechanism beneath {@link Logging.RetainingLogger | RetainingLogger} and
 * any schema-aware observation store.
 *
 * @public
 */
export class RetainingRingBuffer<T extends IRetainedRecord> {
  /**
   * The fixed ring capacity — the maximum number of records retained before the
   * oldest is overwritten. A positive integer (see the constructor normalization).
   * @internal
   */
  private readonly _capacity: number;

  /**
   * The backing store, used as a circular buffer. Grows lazily up to `_capacity`,
   * after which records overwrite the oldest slot in place — eviction is O(1), with
   * no `shift()` re-indexing regardless of capacity.
   * @internal
   */
  private _buffer: T[] = [];

  /**
   * Index of the oldest retained record within `_buffer` once the ring is full.
   * @internal
   */
  private _head: number = 0;

  /**
   * The number of valid records currently retained (`<= _capacity`).
   * @internal
   */
  private _count: number = 0;

  /**
   * The highest `seq` ever pushed; monotonic, stable across eviction and
   * {@link RetainingRingBuffer.clear | clear()}.
   * @internal
   */
  private _lastSeq: number = 0;

  /**
   * Creates a new retaining ring buffer.
   * @param params - {@link IRetainingRingBufferCreateParams | Construction options}.
   */
  public constructor(params?: IRetainingRingBufferCreateParams) {
    const maxRecords = params?.maxRecords ?? 1000;
    // The ring requires a positive integer capacity to be well-defined; a non-finite
    // or sub-1 value would make the modular index arithmetic meaningless, so floor it
    // to a sane minimum of 1 rather than crash on degenerate input.
    this._capacity = Number.isFinite(maxRecords) && maxRecords >= 1 ? Math.floor(maxRecords) : 1;
  }

  /**
   * The number of records currently retained.
   */
  public get size(): number {
    return this._count;
  }

  /**
   * The highest `seq` pushed so far. A client can hold this value and pass it as
   * `sinceSeq` to page only records pushed afterward. Stable across eviction and
   * {@link RetainingRingBuffer.clear | clear()}.
   */
  public get lastSeq(): number {
    return this._lastSeq;
  }

  /**
   * The retained records, oldest-first.
   */
  public get records(): ReadonlyArray<T> {
    return this._toOrderedArray();
  }

  /**
   * Retains a record, evicting the oldest if the ring is full.
   * @param record - The record to retain. Its `seq` should be greater than the
   * `seq` of the previously-pushed record so cursor paging stays monotonic.
   * @returns The same record, for call-site chaining.
   */
  public push(record: T): T {
    if (record.seq > this._lastSeq) {
      this._lastSeq = record.seq;
    }
    if (this._count < this._capacity) {
      // Still filling: append to the next free slot (head stays 0 during this phase).
      this._buffer.push(record);
      this._count += 1;
    } else {
      // Full: overwrite the oldest record in place and advance the head.
      this._buffer[this._head] = record;
      this._head = (this._head + 1) % this._capacity;
    }
    return record;
  }

  /**
   * Returns retained records, oldest-first, optionally filtered and paged.
   * @param query - {@link IRetainingRingBufferQuery | Filtering and paging options}.
   * @returns The matching records, oldest-first.
   */
  public query(query?: IRetainingRingBufferQuery<T>): ReadonlyArray<T> {
    let result: ReadonlyArray<T> = this._toOrderedArray();
    if (query?.sinceSeq !== undefined) {
      const sinceSeq = query.sinceSeq;
      result = result.filter((r) => r.seq > sinceSeq);
    }
    if (query?.filter !== undefined) {
      result = result.filter(query.filter);
    }
    if (query?.limit !== undefined && result.length > query.limit) {
      result = result.slice(result.length - query.limit);
    }
    return result;
  }

  /**
   * Clears all retained records. Does NOT reset {@link RetainingRingBuffer.lastSeq | lastSeq},
   * so a client holding a `sinceSeq` cursor never re-sees a sequence number.
   */
  public clear(): void {
    this._buffer = [];
    this._head = 0;
    this._count = 0;
  }

  /**
   * Materializes the ring into a plain oldest-first array.
   * @internal
   */
  private _toOrderedArray(): T[] {
    const result: T[] = [];
    for (let i = 0; i < this._count; i++) {
      result.push(this._buffer[(this._head + i) % this._capacity]);
    }
    return result;
  }
}
