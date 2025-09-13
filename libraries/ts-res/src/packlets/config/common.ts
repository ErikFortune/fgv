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

import { Result, fail } from '@fgv/ts-utils';
import { ISystemConfiguration } from './json';
import {
  SystemConfiguration,
  ISystemConfigurationInitParams,
  updateSystemConfigurationQualifierDefaultValues
} from './systemConfiguration';
import { sanitizeJsonObject } from '@fgv/ts-json-base';
import { Default, Example } from './predefined';

/**
 * A `string` literal type representing a well-known predefined system configuration.
 * @public
 */
export type PredefinedSystemConfiguration =
  | 'default'
  | 'language-priority'
  | 'territory-priority'
  | 'extended-example';

/**
 * An array of all well-known predefined system configurations.
 * @public
 */
export const allPredefinedSystemConfigurations: ReadonlyArray<PredefinedSystemConfiguration> = [
  'default',
  'language-priority',
  'territory-priority',
  'extended-example'
];

export * from './predefined';

const predefinedDecls: Record<PredefinedSystemConfiguration, ISystemConfiguration> = {
  default: Default.DefaultSystemConfiguration,
  'language-priority': Default.LanguagePrioritySystemConfiguration,
  'territory-priority': Default.TerritoryPrioritySystemConfiguration,
  'extended-example': Example.ExtendedSystemConfiguration
};

/**
 * Returns the {@link Config.Model.ISystemConfiguration | system configuration} declaration for the
 * specified predefined system configuration.
 * @param name - The name of the predefined system configuration.
 * @param initParams - Optional {@link Config.ISystemConfigurationInitParams | initialization parameters}.
 * @returns `Success` with the {@link Config.Model.ISystemConfiguration | system configuration}
 * declaration if successful, `Failure` with an error message otherwise.
 * @public
 */
export function getPredefinedDeclaration(
  name: PredefinedSystemConfiguration,
  initParams?: ISystemConfigurationInitParams
): Result<ISystemConfiguration> {
  if (name in predefinedDecls) {
    const baseConfig = sanitizeJsonObject(predefinedDecls[name]);
    if (initParams?.qualifierDefaultValues) {
      return baseConfig.onSuccess((config) =>
        updateSystemConfigurationQualifierDefaultValues(config, initParams.qualifierDefaultValues!)
      );
    }
    return baseConfig;
  }

  return fail(`Unknown predefined system configuration: ${name}`);
}

/**
 * Returns the {@link Config.SystemConfiguration | SystemConfiguration} for the specified
 * predefined system configuration.
 * @param name - The name of the predefined system configuration.
 * @param initParams - Optional {@link Config.ISystemConfigurationInitParams | initialization parameters}.
 * @returns `Success` with the {@link Config.SystemConfiguration | SystemConfiguration}
 * if successful, `Failure` with an error message otherwise.
 * @public
 */
export function getPredefinedSystemConfiguration(
  name: PredefinedSystemConfiguration,
  initParams?: ISystemConfigurationInitParams
): Result<SystemConfiguration> {
  if (name in predefinedDecls) {
    return SystemConfiguration.create(predefinedDecls[name], initParams);
  }

  return fail(`Unknown predefined system configuration: ${name}`);
}
