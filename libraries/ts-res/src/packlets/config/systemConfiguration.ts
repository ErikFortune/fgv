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

import { captureResult, mapResults, Result } from '@fgv/ts-utils';
import * as QualifierTypes from '../qualifier-types';
import * as ResourceTypes from '../resource-types';
import { QualifierTypeCollector, ReadOnlyQualifierTypeCollector } from '../qualifier-types';
import { IReadOnlyQualifierCollector, QualifierCollector } from '../qualifiers';
import { ReadOnlyResourceTypeCollector, ResourceTypeCollector } from '../resource-types';
import { ISystemConfiguration } from './json';

/**
 * A system configuration for both runtime or build.
 * @public
 */
export class SystemConfiguration {
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

  /**
   * Constructs a new instance of a {@link Config.SystemConfiguration | SystemConfiguration} from the
   * supplied {@link Config.Model.ISystemConfiguration | system configuration}.
   * @param config - The {@link Config.Model.ISystemConfiguration | system configuration} to use.
   * @public
   */
  protected constructor(config: ISystemConfiguration) {
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
   * @returns `Success` with the new {@link Config.SystemConfiguration | SystemConfiguration}
   * if successful, `Failure` with an error message otherwise.
   * @public
   */
  public static create(config: ISystemConfiguration): Result<SystemConfiguration> {
    return captureResult(() => new SystemConfiguration(config));
  }
}
