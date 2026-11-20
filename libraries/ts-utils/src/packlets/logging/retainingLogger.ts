/*
 * Copyright (c) 2020 Erik Fortune
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
import { MessageLogLevel, Success, succeed } from '../base';
import { RetainingRingBuffer } from '../collections';
import { LoggerBase, ReporterLogLevel, shouldLog } from './logger';

/**
 * A retained log record. Preserves the level and an ordering cursor so consumers
 * can filter by severity and page incrementally.
 * @public
 */
export interface ILogRecord {
  /**
   * Monotonic 1-based sequence number, stable across ring eviction.
   */
  readonly seq: number;
  /**
   * Milliseconds since epoch when the record was logged (from the injected clock).
   */
  readonly timestamp: number;
  /**
   * The level the record was logged at.
   */
  readonly level: MessageLogLevel;
  /**
   * The formatted message (same formatting {@link Logging.LoggerBase._format | LoggerBase._format} produces).
   */
  readonly message: string;
  /**
   * The raw structured inputs `[message, ...parameters]` before formatting.
   */
  readonly args?: readonly unknown[];
}

/**
 * Options for {@link Logging.RetainingLogger.getRecords | RetainingLogger.getRecords}.
 * @public
 */
export interface IGetRecordsOptions {
  /**
   * If supplied, only records whose level would be emitted at this threshold
   * (per {@link Logging.shouldLog | shouldLog}) are returned.
   */
  readonly minLevel?: ReporterLogLevel;
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
}

/**
 * An {@link Logging.ILogger | ILogger} that retains structured log records in a bounded
 * most-recent-N ring, with a query API supporting min-severity filtering and
 * since-cursor incremental paging.
 *
 * @remarks
 * Records are captured via the {@link Logging.LoggerBase._logStructured | _logStructured} hook,
 * so the full structured form (`level` + formatted `message` + raw `args`) is retained.
 * The logger emits nowhere itself — pair it with a {@link Logging.MultiLogger | MultiLogger}
 * to also feed a {@link Logging.ConsoleLogger | ConsoleLogger} or other durable sink.
 *
 * @public
 */
export class RetainingLogger extends LoggerBase {
  /**
   * Injected clock used to timestamp records.
   * @internal
   */
  private readonly _now: () => number;

  /**
   * The monotonic sequence counter. The logger owns `seq` assignment and
   * increments this before each push so the buffer receives strictly increasing
   * sequence numbers.
   * @internal
   */
  private _nextSeq: number = 0;

  /**
   * The backing ring buffer. Retains up to `maxRecords` log records, evicting
   * the oldest when full. The buffer is a pure seq-ring — it does not assign
   * `seq`; the logger does.
   * @internal
   */
  private readonly _ring: RetainingRingBuffer<ILogRecord>;

  /**
   * Creates a new retaining logger.
   * @param logLevel - The level of logging to retain. Defaults to `'detail'` to capture
   * broadly and filter at query time.
   * @param maxRecords - The maximum number of records to retain. Defaults to `1000`.
   * @param now - Injected clock returning milliseconds since epoch. Defaults to `Date.now`.
   */
  public constructor(
    logLevel: ReporterLogLevel = 'detail',
    maxRecords: number = 1000,
    now: () => number = () => Date.now()
  ) {
    super(logLevel);
    this._now = now;
    this._ring = new RetainingRingBuffer<ILogRecord>({ maxRecords });
  }

  /**
   * The retained records, oldest-first.
   */
  public get records(): ReadonlyArray<ILogRecord> {
    return this._ring.records;
  }

  /**
   * The most recently assigned sequence number. A client can hold this value and
   * pass it as `sinceSeq` to page only records logged afterward.
   */
  public get lastSeq(): number {
    return this._ring.lastSeq;
  }

  /**
   * Returns retained records, oldest-first, optionally filtered.
   * @param options - {@link Logging.IGetRecordsOptions | Filtering and paging options}.
   * @returns The matching records, oldest-first.
   */
  public getRecords(options?: IGetRecordsOptions): ReadonlyArray<ILogRecord> {
    const minLevel = options?.minLevel;
    return this._ring.query({
      sinceSeq: options?.sinceSeq,
      filter: minLevel !== undefined ? (r) => shouldLog(r.level, minLevel) : undefined,
      limit: options?.limit
    });
  }

  /**
   * Clears all retained records. Does NOT reset the sequence counter, so a client
   * holding a `sinceSeq` cursor never re-sees a sequence number.
   */
  public clear(): void {
    this._ring.clear();
  }

  /**
   * {@inheritDoc Logging.LoggerBase._logStructured}
   * @internal
   */
  protected _logStructured(
    level: MessageLogLevel,
    formatted: string,
    message: unknown,
    parameters: readonly unknown[]
  ): void {
    this._nextSeq += 1;
    const record: ILogRecord = {
      seq: this._nextSeq,
      timestamp: this._now(),
      level,
      message: formatted,
      args: [message, ...parameters]
    };
    this._ring.push(record);
  }

  /**
   * {@inheritDoc Logging.LoggerBase._log}
   * @internal
   */
  protected _log(message: string, __level: MessageLogLevel): Success<string | undefined> {
    return succeed(message);
  }
}
