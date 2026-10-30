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
 * The key of the process-wide slot holding the boundary state.
 * @internal
 */
export const _resultBoundaryKey: symbol = Symbol.for('@fgv/ts-utils.resultBoundary');

/**
 * Returns the process-wide boundary state, creating it on first use. Every copy of `@fgv/ts-utils`
 * loaded into one process (two installed versions, or a bundle beside a dependency) resolves the
 * same object, so a converter from one copy nested inside a converter from another still sees the
 * true nesting depth.
 * @internal
 */
export function _resolveResultBoundary(): { depth: number } {
  const slots = globalThis as unknown as Record<symbol, { depth: number } | undefined>;
  slots[_resultBoundaryKey] ??= { depth: 0 };
  return slots[_resultBoundaryKey] as { depth: number };
}

/**
 * Shared state of the converter / validator `Result` boundary, resolved once from the process-wide
 * slot (see {@link _resolveResultBoundary}).
 *
 * @remarks
 * `depth` counts the guarded converter and validator calls on the stack. Each wrapper reads it into
 * a local, increments it before calling its function and decrements it in a `finally`. Both are
 * plain property arithmetic, so nothing that needs stack space stands between them, and the count
 * is restored even when the stack is too close to its limit for a call. The wrappers are written
 * out in `BaseConverter` and `GenericValidator` rather than sharing a helper, so the hot path
 * allocates nothing.
 * @internal
 */
export const _resultBoundary: { depth: number } = _resolveResultBoundary();

/**
 * Whether a caught value is stack exhaustion, which the boundary re-throws below the outermost level
 * so that it fails once instead of at every level.
 *
 * @remarks
 * Yes for SpiderMonkey's `InternalError`, and for a `RangeError` whose message reads as stack
 * exhaustion: V8 and JavaScriptCore say "Maximum call stack size exceeded", SpiderMonkey "too much
 * recursion". Both are judged by `name`, which also holds for an error from another realm, and the
 * message by plain substring: a regular expression is compiled on first use, and V8 aborts the
 * process when it compiles one with the stack nearly exhausted, which is exactly when this runs. The
 * message is matched because a `RangeError` alone is not evidence: an invalid date
 * or array length raises one too, and that is an ordinary error the nearest boundary must handle. If
 * the check itself throws — the stack is too close to its limit to run it, or the thrown value is a
 * Proxy whose traps throw — the answer is yes, because propagating to the outermost boundary is the
 * direction that cannot multiply work.
 * @internal
 */
export function _isStackExhaustion(err: unknown): boolean {
  try {
    if (typeof err !== 'object' || err === null) {
      return false;
    }
    const { name, message } = err as { name?: unknown; message?: unknown };
    if (name === 'InternalError') {
      return true;
    }
    return (
      name === 'RangeError' &&
      typeof message === 'string' &&
      (message.includes('call stack') || message.includes('too much recursion'))
    );
  } catch {
    return true;
  }
}
