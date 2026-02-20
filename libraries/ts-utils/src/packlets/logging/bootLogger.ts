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
import { MessageLogLevel, Success } from '../base';
import { IDetailLogger, ILogger, InMemoryLogger, isDetailLogger, ReporterLogLevel } from './logger';

/**
 * A recorded log entry capturing the raw arguments before formatting.
 * @internal
 */
interface IBootLogEntry {
  readonly level: MessageLogLevel;
  readonly message: unknown;
  readonly parameters: unknown[];
}

/**
 * A logger that buffers log entries during startup, then replays them
 * to a real logger once it becomes available.
 *
 * @remarks
 * During application bootstrap, the real logger (e.g. one backed by
 * toast notifications) may not be available yet. `BootLogger` solves
 * this by:
 * 1. Buffering all log calls in memory during the boot phase.
 * 2. When {@link BootLogger.ready | ready()} is called with the real
 *    logger, replaying all buffered entries and then forwarding all
 *    subsequent calls directly.
 *
 * @example
 * ```typescript
 * // Create early, before the real logger exists
 * const bootLogger = new BootLogger('detail');
 * bootLogger.info('Starting up...');
 *
 * // Later, when the real logger is available
 * bootLogger.ready(realLogger);
 * // 'Starting up...' is replayed to realLogger
 * // All future calls go directly to realLogger
 * ```
 *
 * @public
 */
export class BootLogger implements IDetailLogger {
  private _buffer: IBootLogEntry[] = [];
  private _delegate: ILogger;
  private _isReady: boolean = false;

  /**
   * Creates a new boot logger.
   * @param logLevel - The log level for the initial in-memory buffer phase.
   * Defaults to 'detail' to capture everything during boot.
   */
  public constructor(logLevel?: ReporterLogLevel) {
    this._delegate = new InMemoryLogger(logLevel ?? 'detail');
  }

  /**
   * {@inheritDoc Logging.ILogger.logLevel}
   */
  public get logLevel(): ReporterLogLevel {
    return this._delegate.logLevel;
  }

  /**
   * Whether the boot logger has been connected to a real logger.
   */
  public get isReady(): boolean {
    return this._isReady;
  }

  /**
   * Connects this boot logger to a real logger.
   * All buffered entries are replayed to the new logger in order,
   * and all subsequent calls are forwarded directly.
   * @param logger - The real logger to forward to.
   */
  public ready(logger: ILogger): void {
    // Replay buffered entries
    for (const entry of this._buffer) {
      logger.log(entry.level, entry.message, ...entry.parameters);
    }

    // Switch to the real logger and discard the buffer
    this._delegate = logger;
    this._buffer = [];
    this._isReady = true;
  }

  /**
   * {@inheritDoc Logging.ILogger.log}
   */
  public log(
    level: MessageLogLevel,
    message?: unknown,
    ...parameters: unknown[]
  ): Success<string | undefined> {
    if (!this._isReady) {
      this._buffer.push({ level, message, parameters });
    }
    return this._delegate.log(level, message, ...parameters);
  }

  /**
   * {@inheritDoc Logging.ILogger.detail}
   */
  public detail(message?: unknown, ...parameters: unknown[]): Success<string | undefined> {
    return this.log('detail', message, ...parameters);
  }

  /**
   * {@inheritDoc Logging.ILogger.info}
   */
  public info(message?: unknown, ...parameters: unknown[]): Success<string | undefined> {
    return this.log('info', message, ...parameters);
  }

  /**
   * {@inheritDoc Logging.ILogger.warn}
   */
  public warn(message?: unknown, ...parameters: unknown[]): Success<string | undefined> {
    return this.log('warning', message, ...parameters);
  }

  /**
   * {@inheritDoc Logging.ILogger.error}
   */
  public error(message?: unknown, ...parameters: unknown[]): Success<string | undefined> {
    return this.log('error', message, ...parameters);
  }

  /**
   * {@inheritDoc Logging.IDetailLogger.errorWithDetail}
   */
  public errorWithDetail(message: string, detail: unknown): Success<string | undefined> {
    if (isDetailLogger(this._delegate)) {
      return this._delegate.errorWithDetail(message, detail);
    }
    this.log('detail', detail);
    return this.log('error', message);
  }

  /**
   * {@inheritDoc Logging.IDetailLogger.warnWithDetail}
   */
  public warnWithDetail(message: string, detail: unknown): Success<string | undefined> {
    if (isDetailLogger(this._delegate)) {
      return this._delegate.warnWithDetail(message, detail);
    }
    this.log('detail', detail);
    return this.log('warning', message);
  }
}
