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

/* eslint-disable @rushstack/typedef-var */

import { Converters } from '@fgv/ts-utils';
import * as Model from './json';

/**
 * A `Converter` for {@link QualifierTypes.Config.ILanguageQualifierTypeConfig | LanguageQualifierTypeConfig} objects.
 * @returns A `Converter` for {@link QualifierTypes.Config.ILanguageQualifierTypeConfig | LanguageQualifierTypeConfig} objects.
 * @public
 */
export const languageQualifierTypeConfig = Converters.strictObject<Model.ILanguageQualifierTypeConfig>({
  allowContextList: Converters.boolean.optional()
});

/**
 * A `Converter` for {@link QualifierTypes.Config.ITerritoryQualifierTypeConfig | TerritoryQualifierTypeConfig} objects.
 * @returns A `Converter` for {@link QualifierTypes.Config.ITerritoryQualifierTypeConfig | TerritoryQualifierTypeConfig} objects.
 * @public
 */
export const territoryQualifierTypeConfig = Converters.strictObject<Model.ITerritoryQualifierTypeConfig>({
  allowContextList: Converters.boolean,
  acceptLowercase: Converters.boolean.optional(),
  allowedTerritories: Converters.arrayOf(Converters.string).optional()
});

/**
 * A `Converter` for {@link QualifierTypes.Config.ILiteralQualifierTypeConfig | LiteralQualifierTypeConfig} objects.
 * @returns A `Converter` for {@link QualifierTypes.Config.ILiteralQualifierTypeConfig | LiteralQualifierTypeConfig} objects.
 * @public
 */
export const literalQualifierTypeConfig = Converters.strictObject<Model.ILiteralQualifierTypeConfig>({
  allowContextList: Converters.boolean.optional(),
  caseSensitive: Converters.boolean.optional(),
  enumeratedValues: Converters.arrayOf(Converters.string).optional(),
  hierarchy: Converters.recordOf(Converters.string).optional()
});

/**
 * A `Converter` for {@link QualifierTypes.Config.ISystemLanguageQualifierTypeConfig | SystemLanguageQualifierTypeConfig} objects.
 * @returns A `Converter` for {@link QualifierTypes.Config.ISystemLanguageQualifierTypeConfig | SystemLanguageQualifierTypeConfig} objects.
 * @public
 */
export const systemLanguageQualifierTypeConfig =
  Converters.strictObject<Model.ISystemLanguageQualifierTypeConfig>({
    name: Converters.string,
    systemType: Converters.literal('language'),
    configuration: languageQualifierTypeConfig.optional()
  });

/**
 * A `Converter` for {@link QualifierTypes.Config.ISystemTerritoryQualifierTypeConfig | SystemTerritoryQualifierTypeConfig} objects.
 * @returns A `Converter` for {@link QualifierTypes.Config.ISystemTerritoryQualifierTypeConfig | SystemTerritoryQualifierTypeConfig} objects.
 * @public
 */
export const systemTerritoryQualifierTypeConfig =
  Converters.strictObject<Model.ISystemTerritoryQualifierTypeConfig>({
    name: Converters.string,
    systemType: Converters.literal('territory'),
    configuration: territoryQualifierTypeConfig.optional()
  });

/**
 * A `Converter` for {@link QualifierTypes.Config.ISystemLiteralQualifierTypeConfig | SystemLiteralQualifierTypeConfig} objects.
 * @returns A `Converter` for {@link QualifierTypes.Config.ISystemLiteralQualifierTypeConfig | SystemLiteralQualifierTypeConfig} objects.
 * @public
 */
export const systemLiteralQualifierTypeConfig =
  Converters.strictObject<Model.ISystemLiteralQualifierTypeConfig>({
    name: Converters.string,
    systemType: Converters.literal('literal'),
    configuration: literalQualifierTypeConfig.optional()
  });

/**
 * A `Converter` for {@link QualifierTypes.Config.ISystemQualifierTypeConfig | SystemQualifierTypeConfig} objects.
 * @returns A `Converter` for {@link QualifierTypes.Config.ISystemQualifierTypeConfig | SystemQualifierTypeConfig} objects.
 * @public
 */
export const systemQualifierTypeConfig = Converters.discriminatedObject<Model.ISystemQualifierTypeConfig>(
  'systemType',
  {
    language: systemLanguageQualifierTypeConfig,
    territory: systemTerritoryQualifierTypeConfig,
    literal: systemLiteralQualifierTypeConfig
  }
);
