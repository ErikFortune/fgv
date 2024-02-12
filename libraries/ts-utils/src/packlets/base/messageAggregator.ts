/*
 * Copyright (c) 2024 Erik Fortune
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

import { IMessageAggregator, Result, fail } from './result';

/**
 * A simple error aggregator to simplify collecting and reporting all errors in
 * a flow.
 * @public
 */
export class MessageAggregator implements IMessageAggregator {
  private readonly _messages: string[];

  /**
   * Constructs a new {@link MessageAggregator | ErrorAggregator} with an
   * optionally specified initial set of error messages.
   * @param errors - optional array of errors to be included
   * in the aggregation.
   */
  public constructor(errors?: string[]) {
    this._messages = errors ? Array.from(errors) : [];
  }

  /**
   * {@inheritdoc IMessageAggregator.hasErrors}
   */
  public get hasMessages(): boolean {
    return this._messages.length > 0;
  }

  /**
   * {@inheritdoc IMessageAggregator.errors}
   */
  public get messages(): string[] {
    return this._messages;
  }

  /**
   * {@inheritdoc IMessageAggregator.addError}
   */
  public addMessage(message: string | undefined): this {
    if (message) {
      this._messages.push(message);
    }
    return this;
  }

  /**
   * {@inheritdoc IMessageAggregator.addErrors}
   */
  public addMessages(messages: string[] | undefined): this {
    if (messages && messages.length > 0) {
      this._messages.push(...messages);
    }
    return this;
  }

  /**
   * {@inheritdoc IMessageAggregator.toString}
   */
  public toString(separator?: string): string {
    return this._messages.join(separator ?? '\n');
  }

  /**
   * If any error messages have been aggregated, returns
   * {@link Failure | Failure<T>} with the aggregated
   * messages concatenated using the optionally-supplied
   * separator, or newline.   If the supplied {@link Result | Result<T>}
   * contains an error message that has not already been aggregated,
   * it will be included in the aggregated messages.
   *
   * If no error messages have been aggregated, returns
   * the supplied {@link Result | Result<T>}.
   * @param result - The {@link Result | Result<T>} to be returned
   * if no messages have been aggregated.
   * @param separator - Optional string separator used to construct
   * the error message.
   * @returns {@link Failure | Failure<T>} with an aggregated message
   * if any error messages were collected, the supplied
   * {@link Result | Result<T>} otherwise.
   */
  public returnOrReport<T>(result: Result<T>, separator?: string): Result<T> {
    if (!this.hasMessages) {
      return result;
    }
    if (!result.success) {
      if (!this._messages.find((s) => s === result.message)) {
        return fail([...this._messages, result.message].join(separator ?? '\n'));
      }
    }
    return fail(this.toString(separator));
  }
}
