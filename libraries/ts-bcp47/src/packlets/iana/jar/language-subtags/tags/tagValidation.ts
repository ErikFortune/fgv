/*
 * Copyright (c) 2021 Erik Fortune
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

import { Result, succeed } from '@fgv/ts-utils';
import { ValidationHelpers } from '../../../../utils';

/**
 * @internal
 */
export class TagValidationHelpers<T extends string, TC = unknown> extends ValidationHelpers<T, TC> {
  public readonly wellFormed: RegExp = /^([A-Za-z][A-Za-z0-9-]{0,7})(-[A-Za-z][A-Za-z0-9-]{0,7})*$/;

  public constructor(description: string) {
    super({
      description,
      toCanonical: TagValidationHelpers.toCanonicalTag,
      isWellFormed: (from: unknown): from is T => {
        return typeof from === 'string' && this.wellFormed.test(from);
      },
      isCanonical: (from: unknown): from is T => {
        if (this.isWellFormed(from)) {
          const result = this.toCanonical(from);
          if (result.isSuccess()) {
            return result.value === from;
          }
        }
        return false;
      }
    });
  }

  public static toCanonicalTag<T extends string>(val: T): Result<T> {
    const subtags = val.split('-');
    const canonical: string[] = [];
    let isInitial = true;
    for (const part of subtags) {
      if (isInitial || (part.length !== 2 && part.length !== 4)) {
        canonical.push(part.toLowerCase());
      } else if (part.length === 2) {
        canonical.push(part.toUpperCase());
      } else if (part.length === 4) {
        canonical.push(`${part[0].toUpperCase()}${part.slice(1).toLowerCase()}`);
      }
      isInitial = part.length === 1;
    }
    return succeed(canonical.join('-') as T);
  }
}
