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
import { QualifierType } from '../qualifier-types';
import * as QualifierTypes from '../qualifier-types';
import * as ResourceTypes from '../resource-types';
import { ResourceType } from '../resource-types';
/**
 * Interface for a factory that creates a new instance of a configuration object.
 * @public
 */
export interface IConfigInitFactory<TConfig, T> {
  /**
   * Creates a new instance of a configuration object.
   * @param config - The configuration object to create.
   * @returns A result containing the new instance of the configuration object.
   */
  create(config: TConfig): Result<T>;
}

/**
 * A factory that chains multiple factories together.
 * @public
 */
export class ChainedConfigInitFactory<TConfig, T> implements IConfigInitFactory<TConfig, T> {
  public readonly factories: IConfigInitFactory<TConfig, T>[];

  /**
   * Constructor for a chained config init factory.
   * @param factories - The factories to chain.
   */
  public constructor(factories: IConfigInitFactory<TConfig, T>[]) {
    this.factories = factories;
  }

  /**
   * Creates a new instance of a configuration object.
   * @param config - The configuration object to create.
   * @returns A result containing the new instance of the configuration object.
   */
  public create(config: TConfig): Result<T> {
    for (const factory of this.factories) {
      const result = factory.create(config);
      if (result.isSuccess()) {
        return result;
      }
    }
    return fail('No factory was able to create the configuration object');
  }
}

/**
 * A factory that creates a {@link QualifierTypes.QualifierType | QualifierType} from a {@link QualifierTypes.Config.ISystemQualifierTypeConfig | system qualifier type configuration}.
 * @public
 */
export class BuiltInQualifierTypeFactory
  implements IConfigInitFactory<QualifierTypes.Config.IAnyQualifierTypeConfig, QualifierType>
{
  /** {@inheritDoc Config.IConfigInitFactory.create} */
  public create(config: QualifierTypes.Config.IAnyQualifierTypeConfig): Result<QualifierType> {
    if (QualifierTypes.Config.isSystemQualifierTypeConfig(config)) {
      return QualifierTypes.createQualifierTypeFromSystemConfig(config);
    }
    return fail(`${config.name}: unknown built-in qualifier type (${config.systemType})`);
  }
}

/**
 * A factory that creates a {@link QualifierTypes.QualifierType | QualifierType} from a {@link QualifierTypes.Config.IAnyQualifierTypeConfig | system qualifier type configuration}
 * by chaining a supplied factory with a {@link Config.BuiltInQualifierTypeFactory | built-in factory} that handles built-in qualifier types.
 * @public
 */
export class QualifierTypeFactory extends ChainedConfigInitFactory<
  QualifierTypes.Config.IAnyQualifierTypeConfig,
  QualifierType
> {
  /**
   * Constructor for a {@link Config.QualifierTypeFactory | qualifier type factory}.
   * @param factories - The {@link Config.IConfigInitFactory | factories} to chain.
   * @remarks The {@link Config.BuiltInQualifierTypeFactory | built-in factory} is always added to the end of the chain.
   */
  public constructor(
    factories: IConfigInitFactory<QualifierTypes.Config.IAnyQualifierTypeConfig, QualifierType>[]
  ) {
    super([...factories, new BuiltInQualifierTypeFactory()]);
  }
}

/**
 * A factory that creates a {@link ResourceTypes.ResourceType | ResourceType} from a {@link ResourceTypes.Config.IResourceTypeConfig | resource type configuration}.
 * @public
 */
export class BuiltInResourceTypeFactory
  implements IConfigInitFactory<ResourceTypes.Config.IResourceTypeConfig, ResourceType>
{
  /** {@inheritDoc Config.IConfigInitFactory.create} */
  public create(config: ResourceTypes.Config.IResourceTypeConfig): Result<ResourceType> {
    return ResourceTypes.createResourceTypeFromConfig(config);
  }
}

/**
 * A factory that creates a {@link ResourceTypes.ResourceType | ResourceType} from a {@link ResourceTypes.Config.IResourceTypeConfig | resource type configuration}
 * by chaining a supplied factory with a {@link Config.BuiltInResourceTypeFactory | built-in factory} that handles built-in resource types.
 * @public
 */
export class ResourceTypeFactory extends ChainedConfigInitFactory<
  ResourceTypes.Config.IResourceTypeConfig,
  ResourceType
> {
  /**
   * Constructor for a resource type factory.
   * @param factories - The {@link Config.IConfigInitFactory | factories}  to chain.
   * @remarks The {@link Config.BuiltInResourceTypeFactory | built-in factory} is always added to the end of the chain.
   */
  public constructor(
    factories: IConfigInitFactory<ResourceTypes.Config.IResourceTypeConfig, ResourceType>[]
  ) {
    factories = factories ?? [];
    super([...factories, new BuiltInResourceTypeFactory()]);
  }
}
