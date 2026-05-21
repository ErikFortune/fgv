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

import 'jest-extended';
import '../helpers/jest';

import {
  _errorMessage,
  _findShouldNotFailFrame,
  _formatShouldNotFailMessage,
  _parseStackFrame,
  fail,
  succeed
} from '../../packlets/base';

describe('shouldNotFail method', () => {
  describe('on Success', () => {
    test('returns the value', () => {
      expect(succeed('hello').shouldNotFail()).toBe('hello');
    });

    test('returns the value when given a label', () => {
      expect(succeed(42).shouldNotFail('answer')).toBe(42);
    });

    test('returns the value when given a frameDepth', () => {
      expect(succeed(42).shouldNotFail('answer', 2)).toBe(42);
    });
  });

  describe('on Failure', () => {
    test('throws an Error including the original failure message', () => {
      expect(() => fail<number>('boom').shouldNotFail()).toThrow(/boom/);
    });

    test('throws an Error prefixed with the supplied label', () => {
      expect(() => fail<number>('boom').shouldNotFail('MY_CONST')).toThrow(/MY_CONST.*boom/);
    });

    test('throws an Error including the caller file and line', () => {
      function namedCallSiteForStackCapture(): number {
        return fail<number>('boom').shouldNotFail();
      }
      let msg: string | undefined;
      try {
        namedCallSiteForStackCapture();
      } catch (e) {
        msg = _errorMessage(e);
      }
      expect(msg).toBeDefined();
      // The captured call site should be the named wrapper above. Jest-circus runs
      // each test body via a microtask (Promise.then), which drops the test arrow
      // from V8's synchronous call stack — so we attribute to a named local
      // function inside the test body instead of the test arrow itself.
      expect(msg).toMatch(/namedCallSiteForStackCapture/);
      expect(msg).toMatch(/shouldNotFail\.test\.(?:ts|js):\d+/);
      expect(msg).toMatch(/boom/);
    });

    test('with both label and call site uses the "<label> (at <fn> in <file>:<line>)" format', () => {
      function labeledCallSite(): number {
        return fail<number>('inner').shouldNotFail('LABEL');
      }
      let msg = '';
      try {
        labeledCallSite();
      } catch (e) {
        msg = _errorMessage(e);
      }
      expect(msg).toMatch(/^LABEL \(at labeledCallSite in .*shouldNotFail\.test\.(?:ts|js):\d+\): inner$/);
    });

    test('frameDepth=2 attributes to a wrapper caller, not the wrapper itself', () => {
      function depth2InnerWrapper(): number {
        return fail<number>('wrapped-boom').shouldNotFail('THROUGH_WRAPPER', 2);
      }
      function depth2OuterCaller(): number {
        return depth2InnerWrapper();
      }
      let msg = '';
      try {
        depth2OuterCaller();
      } catch (e) {
        msg = _errorMessage(e);
      }
      expect(msg).toMatch(/THROUGH_WRAPPER/);
      expect(msg).toMatch(/wrapped-boom/);
      // frameDepth=2 should attribute to depth2OuterCaller, NOT depth2InnerWrapper.
      expect(msg).toMatch(/depth2OuterCaller/);
      expect(msg).not.toMatch(/depth2InnerWrapper/);
    });

    test('thrown error preserves the elided stack — top frame is the caller, not shouldNotFail', () => {
      function namedCallerForStackInspection(): number {
        return fail<number>('stack-check').shouldNotFail('STACK');
      }
      let stack: string | undefined;
      try {
        namedCallerForStackInspection();
      } catch (e) {
        if (e instanceof Error) {
          stack = e.stack;
        }
      }
      expect(stack).toBeDefined();
      const lines = (stack ?? '').split('\n');
      // Find the first frame line (V8 prefixes lines other than the header with
      // "    at "; WebKit uses "<fn>@<file>"). That first frame should be the
      // named caller above — NOT Failure.shouldNotFail.
      const firstFrame = lines.find((l) => /^\s*at\s|@/.test(l));
      expect(firstFrame).toBeDefined();
      expect(firstFrame).toMatch(/namedCallerForStackInspection/);
      // Negative assertion has to target the function-name segment only —
      // the test file's own path contains 'shouldNotFail', so a naive
      // substring match on the raw frame line collides with the file name.
      expect(firstFrame).not.toMatch(/\bat\s+\S*shouldNotFail/);
      expect(firstFrame).not.toMatch(/^\s*\S*shouldNotFail@/);
    });

    test('frameDepth=0 produces no captured frame and falls back to label-only format', () => {
      let msg = '';
      try {
        fail<number>('x').shouldNotFail('NO_FRAME', 0);
      } catch (e) {
        msg = _errorMessage(e);
      }
      expect(msg).toBe('NO_FRAME: x');
    });
  });

  describe('_parseStackFrame', () => {
    test('parses V8 frames with function names', () => {
      expect(_parseStackFrame('    at myFn (/abs/path/file.ts:42:7)')).toEqual({
        fn: 'myFn',
        file: '/abs/path/file.ts',
        line: 42
      });
    });

    test('parses V8 frames without function names', () => {
      expect(_parseStackFrame('    at /abs/path/file.ts:10:3')).toEqual({
        file: '/abs/path/file.ts',
        line: 10
      });
    });

    test('parses WebKit frames with function names', () => {
      expect(_parseStackFrame('myFn@/abs/path/file.ts:42:7')).toEqual({
        fn: 'myFn',
        file: '/abs/path/file.ts',
        line: 42
      });
    });

    test('parses WebKit frames without function names', () => {
      expect(_parseStackFrame('@/abs/path/file.ts:42:7')).toEqual({
        fn: undefined,
        file: '/abs/path/file.ts',
        line: 42
      });
    });

    test('returns empty frame for unparseable lines', () => {
      expect(_parseStackFrame('not a frame')).toEqual({});
    });
  });

  describe('_findShouldNotFailFrame', () => {
    test('returns empty for undefined or empty stack', () => {
      expect(_findShouldNotFailFrame(undefined, 1)).toEqual({});
      expect(_findShouldNotFailFrame('', 1)).toEqual({});
    });

    test('skips lines that mention shouldNotFail (WebKit fallback)', () => {
      const stack = [
        'Error',
        '    at Failure.shouldNotFail (/abs/path/result.ts:5:1)',
        '    at userCode (/abs/path/user.ts:10:1)',
        '    at outer (/abs/path/outer.ts:20:1)'
      ].join('\n');
      expect(_findShouldNotFailFrame(stack, 1)).toEqual({
        fn: 'userCode',
        file: '/abs/path/user.ts',
        line: 10
      });
      expect(_findShouldNotFailFrame(stack, 2)).toEqual({
        fn: 'outer',
        file: '/abs/path/outer.ts',
        line: 20
      });
    });

    test('parses WebKit-format stack strings', () => {
      const stack = [
        'shouldNotFail@/abs/path/result.ts:5:1',
        'userCode@/abs/path/user.ts:10:1',
        'global code@/abs/path/user.ts:20:1'
      ].join('\n');
      expect(_findShouldNotFailFrame(stack, 1)).toEqual({
        fn: 'userCode',
        file: '/abs/path/user.ts',
        line: 10
      });
    });

    test('returns empty when frameDepth is out of range', () => {
      const stack = '    at fn (/a.ts:1:1)';
      expect(_findShouldNotFailFrame(stack, 99)).toEqual({});
      expect(_findShouldNotFailFrame(stack, 0)).toEqual({});
    });

    test('skips non-frame lines', () => {
      const stack = 'Error\n   some noise line\n    at fn (/a.ts:1:1)';
      expect(_findShouldNotFailFrame(stack, 1)).toEqual({
        fn: 'fn',
        file: '/a.ts',
        line: 1
      });
    });
  });

  describe('_formatShouldNotFailMessage', () => {
    const orig = 'orig';

    test('label + fn + file: "<label> (at <fn> in <file>:<line>): <orig>"', () => {
      expect(_formatShouldNotFailMessage(orig, 'L', { fn: 'myFn', file: '/a.ts', line: 5 })).toBe(
        'L (at myFn in /a.ts:5): orig'
      );
    });

    test('label + file (no fn): "<label> (at <file>:<line>): <orig>"', () => {
      expect(_formatShouldNotFailMessage(orig, 'L', { file: '/a.ts', line: 5 })).toBe('L (at /a.ts:5): orig');
    });

    test('fn + file (no label): "<fn> at <file>:<line>: <orig>"', () => {
      expect(_formatShouldNotFailMessage(orig, undefined, { fn: 'myFn', file: '/a.ts', line: 5 })).toBe(
        'myFn at /a.ts:5: orig'
      );
    });

    test('file only (no label, no fn): "<file>:<line>: <orig>"', () => {
      expect(_formatShouldNotFailMessage(orig, undefined, { file: '/a.ts', line: 5 })).toBe('/a.ts:5: orig');
    });

    test('label only (no frame info): "<label>: <orig>"', () => {
      expect(_formatShouldNotFailMessage(orig, 'L', {})).toBe('L: orig');
    });

    test('label + fn only: "<label> (at <fn>): <orig>"', () => {
      expect(_formatShouldNotFailMessage(orig, 'L', { fn: 'myFn' })).toBe('L (at myFn): orig');
    });

    test('fn only (no label, no file): "<fn>: <orig>"', () => {
      expect(_formatShouldNotFailMessage(orig, undefined, { fn: 'myFn' })).toBe('myFn: orig');
    });

    test('empty frame and no label returns the original message', () => {
      expect(_formatShouldNotFailMessage(orig, undefined, {})).toBe(orig);
    });

    test('drops <anonymous> noise from the function name', () => {
      expect(
        _formatShouldNotFailMessage(orig, undefined, { fn: '<anonymous>', file: '/a.ts', line: 5 })
      ).toBe('/a.ts:5: orig');
    });

    test('drops Object.<anonymous> noise from the function name', () => {
      expect(
        _formatShouldNotFailMessage(orig, 'L', { fn: 'Object.<anonymous>', file: '/a.ts', line: 5 })
      ).toBe('L (at /a.ts:5): orig');
    });

    test('drops empty-string function names', () => {
      expect(_formatShouldNotFailMessage(orig, undefined, { fn: '', file: '/a.ts', line: 5 })).toBe(
        '/a.ts:5: orig'
      );
    });
  });

  describe('WebKit fallback (captureStackTrace unavailable)', () => {
    const originalCapture: typeof Error.captureStackTrace | undefined = Error.captureStackTrace;

    afterEach(() => {
      if (originalCapture !== undefined) {
        Error.captureStackTrace = originalCapture;
      }
    });

    test('still produces a useful message when Error.captureStackTrace is unavailable', () => {
      // Simulate WebKit by removing captureStackTrace.
      Reflect.set(Error, 'captureStackTrace', undefined);
      let msg = '';
      try {
        fail<number>('webkit-boom').shouldNotFail('WK');
      } catch (e) {
        msg = _errorMessage(e);
      }
      expect(msg).toMatch(/WK.*webkit-boom/);
    });
  });
});
