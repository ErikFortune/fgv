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

import { captureResult, mapResults, Result, succeed } from '@fgv/ts-utils';

/**
 * @public
 */
export class EntityArray<TE, TI extends number = number> {
  public entities: ReadonlyArray<TE>;
  public entityName: string;

  public constructor(entities: ReadonlyArray<TE>, entityName: string) {
    this.entities = [...entities] as ReadonlyArray<TE>;
    this.entityName = entityName;
  }

  public static create<TE, TI extends number = number>(
    entities: ReadonlyArray<TE>,
    entityName: string
  ): Result<EntityArray<TE>> {
    return captureResult(() => new EntityArray<TE, TI>(entities, entityName));
  }

  public get(index: TI, errorContext?: string): Result<TE> {
    if (index < 0 || index >= this.entities.length) {
      const message = errorContext
        ? `${errorContext}: ${this.entityName} index ${index} is out of range.`
        : `${this.entityName} index ${index} isn out of range`;
      return fail(message);
    }
    return succeed(this.entities[index]);
  }

  public mapIndices(indices: TI[], errorContext?: string): Result<TE[]> {
    return mapResults(indices.map((index) => this.get(index, errorContext)));
  }
}
