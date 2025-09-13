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

import { Converter, Converters, Result, fail, succeed } from '@fgv/ts-utils';
import { JsonObject } from '@fgv/ts-json-base';
import { QualifierType, SystemQualifierType } from '../qualifier-types';
import * as QualifierTypes from '../qualifier-types';
import * as ResourceTypes from '../resource-types';
import { ResourceType } from '../resource-types';

/**
 * Function signature for creating a qualifier type from configuration.
 * @public
 */
export type QualifierTypeFactoryFunction<T extends QualifierType = QualifierType> = (
  config: QualifierTypes.Config.IAnyQualifierTypeConfig
) => Result<T>;

/**
 * Function signature for creating a resource type from configuration.
 * @public
 */
export type ResourceTypeFactoryFunction = (
  config: ResourceTypes.Config.IResourceTypeConfig
) => Result<ResourceType>;

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
 * Creates a {@link Config.IConfigInitFactory | IConfigInitFactory} from a factory function.
 * @param fn - The factory function to wrap.
 * @returns An `IConfigInitFactory` instance that delegates to the function.
 * @public
 */
export function createQualifierTypeFactory<T extends QualifierType = QualifierType>(
  fn: QualifierTypeFactoryFunction<T>
): IConfigInitFactory<QualifierTypes.Config.IAnyQualifierTypeConfig, T> {
  return {
    create: fn
  };
}

/**
 * Creates a {@link Config.IConfigInitFactory | IConfigInitFactory} from a resource type factory function.
 * @param fn - The factory function to wrap.
 * @returns An `IConfigInitFactory` instance that delegates to the function.
 * @public
 */
export function createResourceTypeFactory(
  fn: ResourceTypeFactoryFunction
): IConfigInitFactory<ResourceTypes.Config.IResourceTypeConfig, ResourceType> {
  return {
    create: fn
  };
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
 * A factory that creates a {@link QualifierTypes.SystemQualifierType | SystemQualifierType} from
 * {@link QualifierTypes.Config.IAnyQualifierTypeConfig | any qualifier type configuration}.
 * @returns `Success` with the new {@link QualifierTypes.SystemQualifierType | SystemQualifierType}
 * if successful, `Failure` with an error message otherwise.
 * @public
 */
export class BuiltInQualifierTypeFactory
  implements IConfigInitFactory<QualifierTypes.Config.ISystemQualifierTypeConfig, SystemQualifierType>
{
  /** {@inheritDoc Config.IConfigInitFactory.create} */
  public create(config: QualifierTypes.Config.IAnyQualifierTypeConfig): Result<SystemQualifierType> {
    if (QualifierTypes.Config.isSystemQualifierTypeConfig(config)) {
      return QualifierTypes.createQualifierTypeFromSystemConfig(config);
    }
    return fail(`${config.name}: unknown built-in qualifier type (${config.systemType})`);
  }
}

/**
 * A factory that creates {@link QualifierTypes.QualifierType | QualifierType} instances from configuration,
 * supporting both built-in system types and custom external types.
 *
 * This factory allows external consumers to extend the qualifier type system with their own custom types
 * while maintaining support for all built-in types (Language, Territory, Literal).
 *
 * @typeParam T - The custom qualifier type(s) to support. Defaults to {@link QualifierTypes.SystemQualifierType | SystemQualifierType}.
 *
 * @example Creating a factory with custom qualifier types
 * ```typescript
 * // Define a custom qualifier type
 * class CustomQualifierType extends QualifierType {
 *   // ... implementation
 * }
 *
 * // Define a discriminated union of all types
 * type AppQualifierType = SystemQualifierType | CustomQualifierType;
 *
 * // Create a factory that handles custom types
 * const customFactory: IConfigInitFactory<IAnyQualifierTypeConfig, CustomQualifierType> = {
 *   create(config) {
 *     // ... handle custom type creation
 *   }
 * };
 *
 * // Create the combined factory
 * const qualifierTypeFactory = new QualifierTypeFactory<AppQualifierType>([customFactory]);
 *
 * // The factory returns T | SystemQualifierType, supporting all types
 * const result = qualifierTypeFactory.create(config); // Result<AppQualifierType | SystemQualifierType>
 * ```
 *
 * @remarks
 * - The factory chains custom factories with the built-in factory
 * - Custom factories are tried first, falling back to built-in types
 * - The return type is a union of custom types (T) and system types
 *
 * @public
 */
export class QualifierTypeFactory<
  T extends QualifierType = SystemQualifierType
> extends ChainedConfigInitFactory<QualifierTypes.Config.IAnyQualifierTypeConfig, T | SystemQualifierType> {
  /**
   * Constructor for a {@link Config.QualifierTypeFactory | qualifier type factory}.
   * @param factories - Array of factories for custom qualifier types. Can be:
   *                    - {@link Config.IConfigInitFactory | IConfigInitFactory} instances
   *                    - {@link Config.QualifierTypeFactoryFunction | Factory functions}
   *                    - A mix of both
   *                    These are tried in order before falling back to built-in types.
   * @remarks The {@link Config.BuiltInQualifierTypeFactory | built-in factory} is always appended to handle
   *          system qualifier types (Language, Territory, Literal).
   */
  public constructor(
    factories: Array<
      IConfigInitFactory<QualifierTypes.Config.IAnyQualifierTypeConfig, T> | QualifierTypeFactoryFunction<T>
    >
  ) {
    const normalizedFactories = factories.map((f) =>
      typeof f === 'function' ? createQualifierTypeFactory(f) : f
    );
    super([...normalizedFactories, new BuiltInQualifierTypeFactory()]);
  }
}

/**
 * A factory that validates and creates {@link QualifierTypes.QualifierType | QualifierType} instances
 * from weakly-typed configuration objects. This factory accepts configurations with unvalidated
 * string properties and validates them before delegating to the underlying factory chain.
 *
 * This pattern is useful at package boundaries where type identity issues may occur with
 * branded types across different package instances.
 *
 * @example
 * ```typescript
 * // Accept weakly-typed config from external source
 * const validatingFactory = new ValidatingQualifierTypeFactory([customFactory]);
 *
 * // Config can have plain string types instead of branded types
 * const config = {
 *   name: 'my-qualifier',  // plain string, not QualifierTypeName
 *   systemType: 'custom',   // plain string
 *   configuration: { ... }
 * };
 *
 * const result = validatingFactory.create(config); // Validates and converts internally
 * ```
 *
 * @public
 */
export class ValidatingQualifierTypeFactory<T extends QualifierType = SystemQualifierType>
  implements IConfigInitFactory<unknown, T | SystemQualifierType>
{
  private readonly _innerFactory: QualifierTypeFactory<T>;
  private readonly _configConverter: Converter<unknown, QualifierTypes.Config.IAnyQualifierTypeConfig>;

  /**
   * Constructor for a validating qualifier type factory.
   * @param factories - Array of factories for custom qualifier types. Can be:
   *                    - {@link Config.IConfigInitFactory | IConfigInitFactory} instances
   *                    - {@link Config.QualifierTypeFactoryFunction | Factory functions}
   *                    - A mix of both
   */
  public constructor(
    factories: Array<
      IConfigInitFactory<QualifierTypes.Config.IAnyQualifierTypeConfig, T> | QualifierTypeFactoryFunction<T>
    >
  ) {
    this._innerFactory = new QualifierTypeFactory(factories);

    // Create a converter that validates the config structure from unknown input
    this._configConverter = Converters.generic<unknown, QualifierTypes.Config.IAnyQualifierTypeConfig>(
      (from: unknown) => {
        if (typeof from !== 'object' || from === null) {
          return fail('Configuration must be an object');
        }

        const obj = from as Record<string, unknown>;

        if (typeof obj.name !== 'string') {
          return fail('Configuration field name not found or not a string');
        }
        if (typeof obj.systemType !== 'string') {
          return fail('Configuration field systemType not found or not a string');
        }

        // Build validated config
        const config: QualifierTypes.Config.IAnyQualifierTypeConfig = {
          name: obj.name,
          systemType: obj.systemType
        };

        if (obj.configuration !== undefined && obj.configuration !== null) {
          // Cast to JsonObject - the actual validation happens in the factory
          config.configuration = obj.configuration as Record<string, unknown> as JsonObject;
        }

        return succeed(config);
      }
    );
  }

  /**
   * Creates a qualifier type from a weakly-typed configuration object.
   * @param config - The configuration object to validate and use for creation.
   * @returns A result containing the new qualifier type if successful.
   */
  public create(config: unknown): Result<T | SystemQualifierType> {
    return this._configConverter.convert(config).onSuccess((validatedConfig) => {
      return this._innerFactory.create(validatedConfig as QualifierTypes.Config.IAnyQualifierTypeConfig);
    });
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
   * @param factories - Array of factories for resource types. Can be:
   *                    - {@link Config.IConfigInitFactory | IConfigInitFactory} instances
   *                    - {@link Config.ResourceTypeFactoryFunction | Factory functions}
   *                    - A mix of both
   * @remarks The {@link Config.BuiltInResourceTypeFactory | built-in factory} is always added to the end of the chain.
   */
  public constructor(
    factories: Array<
      IConfigInitFactory<ResourceTypes.Config.IResourceTypeConfig, ResourceType> | ResourceTypeFactoryFunction
    >
  ) {
    factories = factories ?? [];
    const normalizedFactories = factories.map((f) =>
      typeof f === 'function' ? createResourceTypeFactory(f) : f
    );
    super([...normalizedFactories, new BuiltInResourceTypeFactory()]);
  }
}

/**
 * A factory that validates and creates {@link ResourceTypes.ResourceType | ResourceType} instances
 * from weakly-typed configuration objects. This factory accepts configurations with unvalidated
 * string properties and validates them before delegating to the underlying factory chain.
 *
 * This pattern is useful at package boundaries where type identity issues may occur with
 * branded types across different package instances.
 *
 * @public
 */
export class ValidatingResourceTypeFactory implements IConfigInitFactory<unknown, ResourceType> {
  private readonly _innerFactory: ResourceTypeFactory;
  private readonly _configConverter: Converter<unknown, ResourceTypes.Config.IResourceTypeConfig>;

  /**
   * Constructor for a validating resource type factory.
   * @param factories - Array of factories for resource types. Can be:
   *                    - {@link Config.IConfigInitFactory | IConfigInitFactory} instances
   *                    - {@link Config.ResourceTypeFactoryFunction | Factory functions}
   *                    - A mix of both
   */
  public constructor(
    factories: Array<
      IConfigInitFactory<ResourceTypes.Config.IResourceTypeConfig, ResourceType> | ResourceTypeFactoryFunction
    >
  ) {
    this._innerFactory = new ResourceTypeFactory(factories);

    // Create a converter that validates the config structure from unknown input
    this._configConverter = Converters.generic<unknown, ResourceTypes.Config.IResourceTypeConfig>(
      (from: unknown) => {
        if (typeof from !== 'object' || from === null) {
          return fail('Configuration must be an object');
        }

        const obj = from as Record<string, unknown>;

        if (typeof obj.name !== 'string') {
          return fail('Configuration field name not found or not a string');
        }
        if (typeof obj.typeName !== 'string') {
          return fail('Configuration field typeName not found or not a string');
        }

        // Build validated config
        const config: ResourceTypes.Config.IResourceTypeConfig = {
          name: obj.name,
          typeName: obj.typeName
        };

        return succeed(config);
      }
    );
  }

  /**
   * Creates a resource type from a weakly-typed configuration object.
   * @param config - The configuration object to validate and use for creation.
   * @returns A result containing the new resource type if successful.
   */
  public create(config: unknown): Result<ResourceType> {
    return this._configConverter.convert(config).onSuccess((validatedConfig) => {
      return this._innerFactory.create(validatedConfig as ResourceTypes.Config.IResourceTypeConfig);
    });
  }
}
