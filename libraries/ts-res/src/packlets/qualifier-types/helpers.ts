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
import * as Config from './config';
import { QualifierType } from './qualifierType';
import { LanguageQualifierType } from './languageQualifierType';
import { TerritoryQualifierType } from './territoryQualifierType';
import { LiteralQualifierType } from './literalQualifierType';
import { JsonObject } from '@fgv/ts-json-base';

/**
 * Creates a {@link QualifierTypes.QualifierType | QualifierType} from a configuration object.
 * This factory function determines the appropriate qualifier type based on the systemType
 * and delegates to the appropriate type-specific createFromConfig method.
 * @param typeConfig - The {@link QualifierTypes.Config.IQualifierTypeConfig | configuration object}
 * containing the name, systemType, and optional type-specific configuration.
 * @returns `Success` with the new {@link QualifierTypes.QualifierType | QualifierType}
 * if successful, `Failure` with an error message otherwise.
 * @public
 */
export function createQualifierTypeFromConfig(
  typeConfig: Config.IQualifierTypeConfig<JsonObject>
): Result<QualifierType> {
  /* c8 ignore next 1 - defense in depth */
  const childConfig = typeConfig.configuration ?? {};
  switch (typeConfig.systemType) {
    case 'language':
      return Config.Convert.languageQualifierTypeConfig
        .convert(childConfig)
        .onSuccess((configuration) =>
          LanguageQualifierType.createFromConfig({ ...typeConfig, configuration })
        );
    case 'territory':
      return Config.Convert.territoryQualifierTypeConfig
        .convert(childConfig)
        .onSuccess((configuration) =>
          TerritoryQualifierType.createFromConfig({ ...typeConfig, configuration })
        );
    case 'literal':
      return Config.Convert.literalQualifierTypeConfig
        .convert(childConfig)
        .onSuccess((configuration) =>
          LiteralQualifierType.createFromConfig({ ...typeConfig, configuration })
        );
    default:
      return fail(`Unknown qualifier type: ${typeConfig.systemType}`);
  }
}

/**
 * Creates a {@link QualifierTypes.QualifierType | QualifierType} from a system configuration object.
 * This factory function determines the appropriate qualifier type based on the systemType
 * and delegates to the appropriate type-specific createFromConfig method.
 * @param typeConfig - The {@link QualifierTypes.Config.ISystemQualifierTypeConfig | configuration object}
 * containing the name, systemType, and optional type-specific configuration.
 * @returns `Success` with the new {@link QualifierTypes.QualifierType | QualifierType}
 * if successful, `Failure` with an error message otherwise.
 * @public
 */
export function createQualifierTypeFromSystemConfig(
  typeConfig: Config.ISystemQualifierTypeConfig
): Result<QualifierType> {
  const { systemType } = typeConfig;
  switch (systemType) {
    case 'language':
      return LanguageQualifierType.createFromConfig(typeConfig);
    case 'territory':
      return TerritoryQualifierType.createFromConfig(typeConfig);
    case 'literal':
      return LiteralQualifierType.createFromConfig(typeConfig);
    default:
      return fail(`${systemType}: Unknown system qualifier type.`);
  }
}
