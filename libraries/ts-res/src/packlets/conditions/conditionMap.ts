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

import { Collections, Converter, ValidatingResultMap, mapResults, Result, succeed } from '@fgv/ts-utils';
import { ReadOnlyQualifierCollector } from '../qualifiers';
import { IConditionDeclConvertContext, validatedConditionDecl } from './convert';
import { Condition } from './condition';
import { IConditionDecl } from './conditionDecls';
import { ConditionKey, Convert } from '../common';

const conditionFromDecl: Converter<Condition, IConditionDeclConvertContext> = validatedConditionDecl.map(
  Condition.create
);

export interface IConditionMapCreateParams {
  qualifiers: ReadOnlyQualifierCollector;
  conditions?: IConditionDecl[];
}

export class ConditionMap extends ValidatingResultMap<ConditionKey, Condition> {
  public get conditions(): ReadonlyArray<Condition> {
    return Array.from(this.values());
  }

  protected _qualifiers: ReadOnlyQualifierCollector;

  public constructor(params: IConditionMapCreateParams) {
    const entries: [ConditionKey, Condition][] = mapResults(
      (params.conditions ?? []).map((c, index) => {
        return validatedConditionDecl
          .convert(c, { qualifiers: params.qualifiers, index })
          .onSuccess(Condition.create)
          .onSuccess((c) => succeed<[ConditionKey, Condition]>([c.toKey(), c]));
      })
    ).orThrow();

    super({
      entries,
      converters: new Collections.KeyValueConverters<ConditionKey, Condition>({
        key: Convert.conditionKey,
        value: (value: unknown) => this._convertNext(value)
      })
    });
    this._qualifiers = params.qualifiers;
  }

  public getAt(index: number): Result<Condition> {
    if (index < 0 || index >= this.size) {
      return fail(`${index}: condition index out of range`);
    }
    const c = Array.from(this.values())[index];
    if (c.index !== index) {
      return fail(`${c.toKey()}: expected index ${index}, found ${c.index}`);
    }
    return succeed(c);
  }

  protected _convertNext(value: unknown): Result<Condition> {
    return conditionFromDecl.convert(value, { qualifiers: this._qualifiers, index: this.size });
  }
}
