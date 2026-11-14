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

import { fail, Result } from '@fgv/ts-utils';
import { Config, QualifierTypes } from '@fgv/ts-res';
import { DensityQualifierType } from './densityQualifierType';

/**
 * A {@link Config.IConfigInitFactory | config init factory} that knows how
 * to build a {@link DensityQualifierType} from a YAML/JSON qualifier type
 * declaration whose `systemType` is `"density"`.
 *
 * @remarks
 * The factory signature is the ts-res extension point for adding custom
 * qualifier types. Factories are tried in order; ours returns
 * {@link Result | fail} for anything it doesn't recognise so the chain can
 * continue to the built-in factory for things like `language` / `territory`
 * / `literal`.
 *
 * Wiring:
 *
 * ```ts
 * const factory = new Config.QualifierTypeFactory([
 *   new DensityQualifierTypeFactory()  // tried first
 *   // BuiltInQualifierTypeFactory is appended automatically
 * ]);
 *
 * const systemConfig = Config.SystemConfiguration.create(declaration, {
 *   qualifierTypeFactory: factory
 * }).orThrow();
 * ```
 *
 * See `src/lessons/lesson03-runtime.ts` for the full picture.
 *
 * @public
 */
export class DensityQualifierTypeFactory
  implements Config.IConfigInitFactory<QualifierTypes.Config.IAnyQualifierTypeConfig, DensityQualifierType>
{
  /**
   * Attempts to create a {@link DensityQualifierType} from the supplied
   * qualifier type declaration.
   *
   * @param config - A `qualifierTypes[]` entry from a system configuration.
   * @returns `Success` with the new qualifier type if `config.systemType`
   * is `"density"`, `Failure` otherwise.
   */
  public create(config: QualifierTypes.Config.IAnyQualifierTypeConfig): Result<DensityQualifierType> {
    if (config.systemType !== DensityQualifierType.systemType) {
      // Factories in a chain communicate "not mine" via Failure. The next
      // factory in the chain (ultimately the built-in factory) will get
      // a chance to handle configs we reject.
      return fail(`DensityQualifierTypeFactory: unknown systemType '${config.systemType}'`);
    }
    return DensityQualifierType.create({ name: config.name });
  }
}
