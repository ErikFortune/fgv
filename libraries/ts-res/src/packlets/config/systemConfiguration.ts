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

import { captureResult, mapResults, Result, fail, succeed } from '@fgv/ts-utils';
import * as QualifierTypes from '../qualifier-types';
import * as ResourceTypes from '../resource-types';
import { QualifierTypeCollector, ReadOnlyQualifierTypeCollector } from '../qualifier-types';
import { IReadOnlyQualifierCollector, QualifierCollector } from '../qualifiers';
import { ReadOnlyResourceTypeCollector, ResourceTypeCollector } from '../resource-types';
import { ISystemConfiguration } from './json';
import { systemConfiguration } from './convert';
import { sanitizeJsonObject } from '@fgv/ts-json-base';

/**
 * Parameters used to initialize a {@link Config.SystemConfiguration | SystemConfiguration}.
 * @public
 */
export interface ISystemConfigurationInitParams {
  /**
   * Optional map of qualifier names to default values. If provided, qualifiers
   * in the system configuration will be updated with these default values.
   * Use `null` as the value to remove an existing default value.
   */
  qualifierDefaultValues?: Record<string, string | null>; // eslint-disable-line @rushstack/no-new-null
}

/**
 * Creates a copy of the provided {@link Config.Model.ISystemConfiguration | system configuration}
 * with updated qualifier default values.
 * @param config - The base {@link Config.Model.ISystemConfiguration | system configuration} to copy.
 * @param qualifierDefaultValues - Map of qualifier names to default values. Use `null` to remove existing values.
 * @returns `Success` with the updated {@link Config.Model.ISystemConfiguration | system configuration}
 * if successful, `Failure` with an error message otherwise.
 * @public
 */
export function updateSystemConfigurationQualifierDefaultValues(
  config: ISystemConfiguration,
  qualifierDefaultValues: Record<string, string | null> // eslint-disable-line @rushstack/no-new-null
): Result<ISystemConfiguration> {
  // Create a copy of the config
  return sanitizeJsonObject<ISystemConfiguration>(config).onSuccess((updatedConfig) => {
    // Create a map of existing qualifier names for validation
    const existingQualifierNames = new Set(updatedConfig.qualifiers.map((q) => q.name));

    // Validate that all specified qualifiers exist in the configuration
    for (const qualifierName of Object.keys(qualifierDefaultValues)) {
      if (!existingQualifierNames.has(qualifierName)) {
        return fail(`Qualifier '${qualifierName}' not found in system configuration`);
      }
    }

    // Update qualifier default values
    updatedConfig.qualifiers = updatedConfig.qualifiers.map((qualifier) => {
      if (qualifier.name in qualifierDefaultValues) {
        const newDefaultValue = qualifierDefaultValues[qualifier.name];

        // Create a copy of the qualifier
        const updatedQualifier = { ...qualifier };

        if (newDefaultValue === null) {
          // Remove the default value
          delete updatedQualifier.defaultValue;
        } else {
          // Set the new default value
          updatedQualifier.defaultValue = newDefaultValue;
        }

        return updatedQualifier;
      }
      return qualifier;
    });

    return succeed(updatedConfig);
  });
}

/**
 * A system configuration for both runtime or build.
 * @public
 */
export class SystemConfiguration {
  /**
   * The name of this system configuration.
   */
  public get name(): string | undefined {
    return this._config.name;
  }

  /**
   * The description of this system configuration.
   */
  public get description(): string | undefined {
    return this._config.description;
  }

  /**
   * The {@link QualifierTypes.QualifierTypeCollector | qualifier types} that this system configuration uses.
   */
  public readonly qualifierTypes: ReadOnlyQualifierTypeCollector;

  /**
   * The {@link QualifierTypes.QualifierTypeCollector | qualifier types} that this system configuration uses.
   * @public
   */
  public readonly qualifiers: IReadOnlyQualifierCollector;

  /**
   * The {@link ResourceTypes.ResourceTypeCollector | resource types} that this system configuration uses.
   */
  public readonly resourceTypes: ReadOnlyResourceTypeCollector;

  private readonly _config: ISystemConfiguration;

  /**
   * Constructs a new instance of a {@link Config.SystemConfiguration | SystemConfiguration} from the
   * supplied {@link Config.Model.ISystemConfiguration | system configuration}.
   * @param config - The {@link Config.Model.ISystemConfiguration | system configuration} to use.
   * @public
   */
  protected constructor(config: ISystemConfiguration) {
    this._config = config;

    this.qualifierTypes = QualifierTypeCollector.create({
      qualifierTypes: mapResults(
        config.qualifierTypes.map(QualifierTypes.createQualifierTypeFromSystemConfig)
      ).orThrow()
    }).orThrow();

    this.qualifiers = QualifierCollector.create({
      qualifierTypes: this.qualifierTypes,
      qualifiers: config.qualifiers
    }).orThrow();

    this.resourceTypes = ResourceTypeCollector.create({
      resourceTypes: mapResults(
        config.resourceTypes.map(ResourceTypes.createResourceTypeFromConfig)
      ).orThrow()
    }).orThrow();
  }

  /**
   * Creates a new {@link Config.SystemConfiguration | SystemConfiguration} from the supplied
   * {@link Config.Model.ISystemConfiguration | system configuration}.
   * @param config - The {@link Config.Model.ISystemConfiguration | system configuration} to use.
   * @param initParams - Optional {@link Config.ISystemConfigurationInitParams | initialization parameters}.
   * @returns `Success` with the new {@link Config.SystemConfiguration | SystemConfiguration}
   * if successful, `Failure` with an error message otherwise.
   * @public
   */
  public static create(
    config: ISystemConfiguration,
    initParams?: ISystemConfigurationInitParams
  ): Result<SystemConfiguration> {
    if (initParams?.qualifierDefaultValues) {
      return updateSystemConfigurationQualifierDefaultValues(
        config,
        initParams.qualifierDefaultValues
      ).onSuccess((updatedConfig) => captureResult(() => new SystemConfiguration(updatedConfig)));
    }
    return captureResult(() => new SystemConfiguration(config));
  }

  /**
   * Returns the {@link Config.Model.ISystemConfiguration | system configuration} that this
   * {@link Config.SystemConfiguration | SystemConfiguration} was created from.
   * @returns `Success` with the {@link Config.Model.ISystemConfiguration | system configuration}
   * if successful, `Failure` with an error message otherwise.
   * @public
   */
  public getConfig(): Result<ISystemConfiguration> {
    return systemConfiguration.convert(this._config);
  }
}
