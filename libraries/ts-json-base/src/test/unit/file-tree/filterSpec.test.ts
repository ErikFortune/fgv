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

import { isPathMutable } from '../../../packlets/file-tree';

describe('filterSpec', () => {
  describe('isPathMutable', () => {
    describe('with undefined or false', () => {
      it('returns false when mutable is undefined', () => {
        expect(isPathMutable('/some/path', undefined)).toBe(false);
      });

      it('returns false when mutable is false', () => {
        expect(isPathMutable('/some/path', false)).toBe(false);
      });
    });

    describe('with true', () => {
      it('returns true for any path when mutable is true', () => {
        expect(isPathMutable('/any/path', true)).toBe(true);
        expect(isPathMutable('/another/path/file.json', true)).toBe(true);
      });
    });

    describe('with IFilterSpec', () => {
      describe('include patterns', () => {
        it('returns true when path matches string include pattern exactly', () => {
          expect(isPathMutable('/allowed/path', { include: ['/allowed/path'] })).toBe(true);
        });

        it('returns true when path starts with string include pattern', () => {
          expect(isPathMutable('/allowed/path/file.json', { include: ['/allowed/path'] })).toBe(true);
        });

        it('returns true when path contains string include pattern', () => {
          expect(isPathMutable('/some/allowed/path', { include: ['allowed'] })).toBe(true);
        });

        it('returns false when path does not match any include pattern', () => {
          expect(isPathMutable('/other/path', { include: ['/allowed/path'] })).toBe(false);
        });

        it('returns true when path matches RegExp include pattern', () => {
          expect(isPathMutable('/data/file.json', { include: [/\.json$/] })).toBe(true);
        });

        it('returns false when path does not match RegExp include pattern', () => {
          expect(isPathMutable('/data/file.txt', { include: [/\.json$/] })).toBe(false);
        });

        it('returns true when path matches any of multiple include patterns', () => {
          expect(isPathMutable('/data/file.json', { include: ['/other', /\.json$/] })).toBe(true);
          expect(isPathMutable('/other/file.txt', { include: ['/other', /\.json$/] })).toBe(true);
        });
      });

      describe('exclude patterns', () => {
        it('returns false when path matches string exclude pattern', () => {
          expect(isPathMutable('/excluded/path', { exclude: ['/excluded'] })).toBe(false);
        });

        it('returns false when path matches RegExp exclude pattern', () => {
          expect(isPathMutable('/data/file.bak', { exclude: [/\.bak$/] })).toBe(false);
        });

        it('returns true when path does not match exclude pattern', () => {
          expect(isPathMutable('/allowed/path', { exclude: ['/excluded'] })).toBe(true);
        });

        it('returns true when no exclude patterns are specified', () => {
          expect(isPathMutable('/any/path', { exclude: [] })).toBe(true);
        });
      });

      describe('include and exclude together', () => {
        it('exclude takes precedence over include', () => {
          const filter = {
            include: ['/data'],
            exclude: [/\.bak$/]
          };
          expect(isPathMutable('/data/file.json', filter)).toBe(true);
          expect(isPathMutable('/data/file.bak', filter)).toBe(false);
        });

        it('path must match include and not match exclude', () => {
          const filter = {
            include: [/\.json$/],
            exclude: ['/temp']
          };
          expect(isPathMutable('/data/file.json', filter)).toBe(true);
          expect(isPathMutable('/temp/file.json', filter)).toBe(false);
          expect(isPathMutable('/data/file.txt', filter)).toBe(false);
        });
      });

      describe('empty filter spec', () => {
        it('returns true with empty filter spec (no include or exclude)', () => {
          expect(isPathMutable('/any/path', {})).toBe(true);
        });

        it('returns true with empty include array and no exclude', () => {
          expect(isPathMutable('/any/path', { include: [] })).toBe(true);
        });
      });
    });
  });
});
