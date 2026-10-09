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
import '../helpers/jest';

import { captureResult } from '../../packlets/base';

describe('captureResult with a thrown value that cannot be read', () => {
  test('returns failure with fixed text when the message accessor or toString throws', () => {
    const unprintable = {
      toString(): string {
        throw new Error('toString');
      }
    };
    const unreadable = Object.defineProperty(new Error('hidden'), 'message', {
      get(): string {
        throw new Error('message');
      }
    });
    const unprintableMessage = Object.defineProperty(new Error('hidden'), 'message', {
      value: unprintable
    });
    for (const thrown of [unprintable, unreadable, unprintableMessage]) {
      expect(
        captureResult(() => {
          throw thrown;
        })
      ).toFailWith('an error whose message could not be read');
    }
  });

  test('converts an Error whose message is not a string to text', () => {
    const numeric = Object.defineProperty(new Error('hidden'), 'message', { value: 42 });
    expect(
      captureResult(() => {
        throw numeric;
      })
    ).toFailWith('42');
  });
});
