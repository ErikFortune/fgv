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

import { JsonObject } from '@fgv/ts-json-base';

/**
 * Templated configuration for {@link QualifierTypes.QualifierType | qualifier type} configuration.
 * @public
 */
export interface IQualifierTypeConfig<T = JsonObject> {
  name: string;
  systemType: string;
  configuration?: T;
}

/**
 * Configuration for {@link QualifierTypes.LanguageQualifierType | language qualifier type} configuration.
 * @public
 */
export interface ILanguageQualifierTypeConfig {
  allowContextList?: boolean;
}

/**
 * Declares a hierarchy of literal values. The keys are the names of the values, and the
 * values are the names of their parents.
 * @remarks
 * The hierarchy is defined as a tree, where each value can have multiple children but
 * only one parent. The root of the tree has no parent. The hierarchy is used to
 * determine the relationship between values when matching conditions and contexts.
 * @public
 */
export type LiteralValueHierarchyDecl<T extends string> = Partial<Record<T, T>>;

/**
 * Configuration for {@link QualifierTypes.TerritoryQualifierType | territory qualifier type} configuration.
 * @public
 */
export interface ITerritoryQualifierTypeConfig {
  allowContextList?: boolean;

  acceptLowercase?: boolean;
  allowedTerritories?: string[];

  /**
   * Optional {@link QualifierTypes.Config.LiteralValueHierarchyDecl | hierarchy declaration}
   * of territory values to use for matching. If not provided, no hierarchy will be used.
   */
  hierarchy?: LiteralValueHierarchyDecl<string>;
}

/**
 * Configuration for {@link QualifierTypes.LiteralQualifierType | literal qualifier type} configuration.
 * @public
 */
export interface ILiteralQualifierTypeConfig {
  allowContextList?: boolean;
  caseSensitive?: boolean;
  enumeratedValues?: string[];
  hierarchy?: LiteralValueHierarchyDecl<string>;
}

/**
 * Discriminated configuration for {@link QualifierTypes.LanguageQualifierType | language qualifier type} configuration.
 * @public
 */
export interface ISystemLanguageQualifierTypeConfig
  extends IQualifierTypeConfig<ILanguageQualifierTypeConfig> {
  systemType: 'language';
}

/**
 * Discriminated configuration for {@link QualifierTypes.TerritoryQualifierType | territory qualifier type} configuration.
 * @public
 */
export interface ISystemTerritoryQualifierTypeConfig
  extends IQualifierTypeConfig<ITerritoryQualifierTypeConfig> {
  systemType: 'territory';
}

/**
 * Discriminated configuration for {@link QualifierTypes.LiteralQualifierType | literal qualifier type} configuration.
 * @public
 */
export interface ISystemLiteralQualifierTypeConfig extends IQualifierTypeConfig<ILiteralQualifierTypeConfig> {
  systemType: 'literal';
}

/**
 * Discriminated configuration for {@link QualifierTypes.QualifierType | qualifier type} configuration.
 * @public
 */
export type ISystemQualifierTypeConfig =
  | ISystemLanguageQualifierTypeConfig
  | ISystemTerritoryQualifierTypeConfig
  | ISystemLiteralQualifierTypeConfig;

/**
 * A union of all qualifier type configurations.
 * @public
 */
export type IAnyQualifierTypeConfig = IQualifierTypeConfig | ISystemQualifierTypeConfig;

/**
 * Checks if a {@link QualifierTypes.Config.IAnyQualifierTypeConfig | qualifier type configuration} is a
 * {@link QualifierTypes.Config.ISystemQualifierTypeConfig | system qualifier type configuration}.
 * @param config - The {@link QualifierTypes.Config.IAnyQualifierTypeConfig | qualifier type configuration} to check.
 * @returns `true` if the configuration is a system qualifier type configuration, `false` otherwise.
 * @public
 */
export function isSystemQualifierTypeConfig(
  config: IAnyQualifierTypeConfig
): config is ISystemQualifierTypeConfig {
  return (
    config.systemType === 'language' || config.systemType === 'territory' || config.systemType === 'literal'
  );
}
