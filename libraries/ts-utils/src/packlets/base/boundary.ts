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

import { _errorMessage } from './result';

/**
 * How many guarded boundary calls are on the stack right now. Shared by every converter and
 * validator, so the outermost one can be told apart from the nested ones. Each call reads it into
 * a local before incrementing it and restores it in a `finally` by arithmetic alone, so nothing that
 * needs stack space stands between the two.
 */
let boundaryDepth: number = 0;

/**
 * Whether a caught value should be treated as stack exhaustion: a `RangeError` (V8, JavaScriptCore)
 * or an `InternalError` (SpiderMonkey's "too much recursion"), judged by constructor and name rather
 * than by message text, which differs by engine. Other `RangeError`s (an invalid array length,
 * `toFixed(200)`) are rare in a conversion callback and lose nothing but nested path context by
 * being treated the same. If the check itself throws — the stack is too close to its limit to run
 * it, or the thrown value is a Proxy whose traps throw — the answer is yes, because propagating to
 * the outermost boundary is the safe direction.
 * @internal
 */
export function _isStackExhaustion(err: unknown): boolean {
  try {
    if (err instanceof RangeError) {
      return true;
    }
    const name: unknown =
      typeof err === 'object' && err !== null ? (err as { name?: unknown }).name : undefined;
    return name === 'RangeError' || name === 'InternalError';
  } catch {
    return true;
  }
}

/**
 * Runs one converter or validator body at the `Result` boundary.
 *
 * @remarks
 * A throw from the body becomes `failure('<kind> threw: <message>')`, so a bug in a callback reads
 * differently from invalid input. Stack exhaustion is the exception: below the outermost boundary it
 * is re-thrown, so it unwinds straight to the outermost boundary and fails once. Converting it at
 * every level would let each level go on to its next sibling and exhaust the stack again, which on a
 * graph with shared or cyclic references multiplies into an effectively unbounded walk.
 *
 * @param kind - `'converter'` or `'validator'`, used in the failure message.
 * @param body - The guarded call.
 * @param failure - Builds the failure value from a message.
 * @internal
 */
export function _atResultBoundary<T>(kind: string, body: () => T, failure: (message: string) => T): T {
  const nested = boundaryDepth > 0;
  let outcome: T;
  boundaryDepth++;
  try {
    outcome = body();
  } catch (err) {
    if (nested && _isStackExhaustion(err)) {
      throw err;
    }
    outcome = failure(`${kind} threw: ${_errorMessage(err)}`);
  } finally {
    // arithmetic only: this must run even when the stack is too close to its limit for a call
    boundaryDepth--;
  }
  return outcome;
}
