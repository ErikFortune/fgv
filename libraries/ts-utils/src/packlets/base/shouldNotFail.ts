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
 * Internal helpers for `Result<T>.shouldNotFail()`. Parsing and message
 * composition live here so the `Result` class file stays focused on the
 * Result hierarchy itself; the helpers are exported with the `_` prefix
 * convention and `@internal` tag so unit tests can cover them directly
 * without adding test-only public exports.
 */

/**
 * Parsed stack-frame information used by `Result<T>.shouldNotFail`.
 * All fields are optional — runtimes that don't expose stack traces produce
 * an empty frame and the call site is omitted from the message.
 * @internal
 */
export interface _IShouldNotFailFrame {
  fn?: string;
  file?: string;
  line?: number;
}

/**
 * Parses a single stack-trace line in either V8 or WebKit format.
 *
 * V8: `    at <fn> (<file>:<line>:<col>)` or `    at <file>:<line>:<col>`
 * WebKit: `<fn>@<file>:<line>:<col>` or `@<file>:<line>:<col>`
 * @internal
 */
export function _parseStackFrame(line: string): _IShouldNotFailFrame {
  const trimmed = line.trim();
  const v8WithFn = /^at\s+(.+?)\s+\((.+):(\d+):\d+\)$/.exec(trimmed);
  if (v8WithFn) {
    return { fn: v8WithFn[1], file: v8WithFn[2], line: Number(v8WithFn[3]) };
  }
  const v8NoFn = /^at\s+(.+):(\d+):\d+$/.exec(trimmed);
  if (v8NoFn) {
    return { file: v8NoFn[1], line: Number(v8NoFn[2]) };
  }
  const webkit = /^(.*?)@(.+):(\d+):\d+$/.exec(trimmed);
  if (webkit) {
    return { fn: webkit[1] === '' ? undefined : webkit[1], file: webkit[2], line: Number(webkit[3]) };
  }
  return {};
}

/**
 * Finds the caller frame at the supplied depth in a stack string.
 *
 * Filters out frames whose **parsed function name** contains `shouldNotFail`
 * (the file path is deliberately NOT inspected — consumer test files may
 * themselves be named after `shouldNotFail` and their frames must not be
 * filtered out). Covers both the V8 path — where `Error.captureStackTrace`
 * should have done this already but the extra filter is harmless — and the
 * WebKit fallback path where `captureStackTrace` is unavailable. `frameDepth`
 * is 1-indexed: `1` selects the immediate caller.
 * @internal
 */
export function _findShouldNotFailFrame(stack: string | undefined, frameDepth: number): _IShouldNotFailFrame {
  if (!stack) {
    return {};
  }
  const userFrames: _IShouldNotFailFrame[] = [];
  for (const line of stack.split('\n')) {
    if (!/^\s*at\s|@/.test(line)) {
      continue;
    }
    const parsed = _parseStackFrame(line);
    if (parsed.file === undefined && parsed.fn === undefined) {
      continue;
    }
    // Filter by parsed function name only — never by raw line text, since the
    // file path may itself contain 'shouldNotFail' (e.g. consumer test files).
    if (parsed.fn !== undefined && parsed.fn.includes('shouldNotFail')) {
      continue;
    }
    userFrames.push(parsed);
  }
  return userFrames[frameDepth - 1] ?? {};
}

/**
 * Normalizes a function name from a stack frame, returning `undefined` when
 * the name is empty or one of the well-known anonymous-IIFE noise patterns
 * (typically emitted by V8 for module-top-level code).
 * @internal
 */
export function _normalizeShouldNotFailFnName(fn: string | undefined): string | undefined {
  if (fn === undefined || fn === '' || fn === '<anonymous>' || fn === 'Object.<anonymous>') {
    return undefined;
  }
  return fn;
}

/**
 * Composes the error message thrown by `Result<T>.shouldNotFail` from the
 * captured frame and optional label.
 * @internal
 */
export function _formatShouldNotFailMessage(
  originalMessage: string,
  label: string | undefined,
  frame: _IShouldNotFailFrame
): string {
  const fn = _normalizeShouldNotFailFnName(frame.fn);
  const fileLoc =
    frame.file !== undefined && frame.line !== undefined ? `${frame.file}:${frame.line}` : undefined;

  if (label !== undefined) {
    if (fn !== undefined && fileLoc !== undefined) {
      return `${label} (at ${fn} in ${fileLoc}): ${originalMessage}`;
    }
    if (fileLoc !== undefined) {
      return `${label} (at ${fileLoc}): ${originalMessage}`;
    }
    if (fn !== undefined) {
      return `${label} (at ${fn}): ${originalMessage}`;
    }
    return `${label}: ${originalMessage}`;
  }
  if (fn !== undefined && fileLoc !== undefined) {
    return `${fn} at ${fileLoc}: ${originalMessage}`;
  }
  if (fileLoc !== undefined) {
    return `${fileLoc}: ${originalMessage}`;
  }
  if (fn !== undefined) {
    return `${fn}: ${originalMessage}`;
  }
  return originalMessage;
}
