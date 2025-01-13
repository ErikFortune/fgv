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

import { Result, captureResult } from '@fgv/ts-utils';
import * as Common from '../common';
import { IQualifierType } from './qualifierType';
import { EntityArray } from '../utils';
import { verifySuppliedIndex } from './utils';

/**
 * Parameters required to create a {@link Qualifier | Qualifier}.
 * @public
 */
export interface IQualifierCreateParams {
  from: Common.IQualifier;
  index: number;
  qualifierTypes: EntityArray<IQualifierType, Common.QualifierTypeIndex>;
}

/**
 * Runtime representation of a qualifier.
 * @public
 */
export class Qualifier implements Common.IQualifier {
  public readonly name: Common.QualifierName;
  public readonly index: Common.QualifierIndex;
  public readonly qualifierType: IQualifierType;
  public get qualifierTypeIndex(): Common.QualifierTypeIndex {
    return this.qualifierType.index;
  }

  /**
   * Constructs a new {@link Qualifier | Qualifier}.
   * @param index - the index of the qualifier to be constructed.
   * @param name - the name of the qualifier to be constructed.
   * @param type - the {@link IQualifierType | type} of the qualifier to be constructed.
   */
  protected constructor(index: number, name: Common.QualifierName, type: IQualifierType) {
    this.name = name;
    this.index = Common.Validate.qualifierIndex.validate(index).orThrow();
    this.qualifierType = type;
  }

  /**
   * Creates a new {@link Qualifier | Qualifier} from the supplied parameters.
   * @param init - {@link IQualifierCreateParams | Parameters} required to create the qualifier.
   * @returns `Success` with the new {@link Qualifier | Qualifier} if successful, `Failure` with
   * error details otherwise.
   */
  public static create(init: IQualifierCreateParams): Result<Qualifier> {
    return verifySuppliedIndex(init.index, init.from.index, `qualifier ${init.from.name}`).onSuccess(
      (index) => {
        return init.qualifierTypes
          .get(init.from.qualifierTypeIndex)
          .onSuccess((type) => captureResult(() => new Qualifier(index, init.from.name, type)));
      }
    );
  }
}
