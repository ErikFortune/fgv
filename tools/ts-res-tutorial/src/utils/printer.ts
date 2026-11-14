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

/**
 * Simple printing abstraction used by every lesson so that tests can
 * capture and assert on output without intercepting `console.log`.
 *
 * @remarks
 * The API intentionally covers only the shapes the tutorial actually
 * emits (headings, plain lines, JSON blocks). We pass a printer into
 * each lesson rather than letting it touch `console` directly; a
 * `CapturingPrinter` in the tests keeps everything deterministic.
 *
 * @public
 */
export interface ITutorialPrinter {
  /** Prints a top-level lesson heading. */
  heading(text: string): void;
  /** Prints a subsection heading. */
  subheading(text: string): void;
  /** Prints a normal line. */
  line(text?: string): void;
  /** Pretty-prints a JSON value in a labelled block. */
  json(label: string, value: unknown): void;
}

/**
 * Default {@link ITutorialPrinter | ITutorialPrinter} that writes to the
 * supplied write function. Defaults to `console.log`.
 * @public
 */
export class ConsoleTutorialPrinter implements ITutorialPrinter {
  private readonly _write: (text: string) => void;

  public constructor(write?: (text: string) => void) {
    this._write = write ?? ((text: string) => console.log(text));
  }

  public heading(text: string): void {
    this._write('');
    this._write(`=== ${text} ===`);
  }

  public subheading(text: string): void {
    this._write('');
    this._write(`-- ${text}`);
  }

  public line(text?: string): void {
    this._write(text ?? '');
  }

  public json(label: string, value: unknown): void {
    this._write(`${label}:`);
    this._write(JSON.stringify(value, null, 2));
  }
}

/**
 * A {@link ITutorialPrinter | ITutorialPrinter} that records every
 * message into an in-memory buffer. Used by the lesson tests to make
 * assertions about what each lesson actually printed.
 * @public
 */
export class CapturingTutorialPrinter implements ITutorialPrinter {
  /**
   * The captured lines, in order.
   */
  public readonly lines: string[] = [];

  public heading(text: string): void {
    this.lines.push('');
    this.lines.push(`=== ${text} ===`);
  }

  public subheading(text: string): void {
    this.lines.push('');
    this.lines.push(`-- ${text}`);
  }

  public line(text?: string): void {
    this.lines.push(text ?? '');
  }

  public json(label: string, value: unknown): void {
    this.lines.push(`${label}:`);
    this.lines.push(JSON.stringify(value, null, 2));
  }

  /**
   * Joins all captured output into a single string for regex testing.
   */
  public get text(): string {
    return this.lines.join('\n');
  }
}
