import { Result, succeed, fail } from '@fgv/ts-utils';
import { QualifierTypes } from '@fgv/ts-res';
import { JsonObject } from '@fgv/ts-json-base';
import { ContrastQualifierType, IContrastQualifierTypeConfig } from './ContrastQualifierType';

/**
 * Factory for creating ContrastQualifierType instances from configuration.
 *
 * This factory implements the IConfigInitFactory interface to allow
 * the ts-res system to create custom qualifier types from JSON configuration.
 *
 * @public
 */
export class ContrastQualifierTypeFactory implements QualifierTypes.IConfigInitFactory {
  /**
   * The system type name this factory handles.
   */
  public readonly systemType = 'contrast';

  /**
   * Creates a ContrastQualifierType instance from configuration.
   *
   * @param config - The configuration object containing name, systemType, and optional configuration
   * @returns Success with the created qualifier type, or Failure with an error message
   */
  public create(
    config: QualifierTypes.Config.IQualifierTypeConfig<JsonObject>
  ): Result<QualifierTypes.IQualifierType> {
    // Validate that this is a contrast configuration
    if (config.systemType !== 'contrast') {
      return fail(
        `ContrastQualifierTypeFactory can only create 'contrast' types, received '${config.systemType}'`
      );
    }

    // Extract and validate configuration
    const contrastConfig: IContrastQualifierTypeConfig = {};

    if (config.configuration && typeof config.configuration === 'object') {
      const cfg = config.configuration as Record<string, unknown>;

      // Extract allowContextList
      if (cfg.allowContextList !== undefined) {
        if (typeof cfg.allowContextList === 'boolean') {
          contrastConfig.allowContextList = cfg.allowContextList;
        } else {
          return fail('allowContextList must be a boolean');
        }
      }

      // Extract highContrastValues
      if (cfg.highContrastValues !== undefined) {
        if (
          Array.isArray(cfg.highContrastValues) &&
          cfg.highContrastValues.every((v) => typeof v === 'string')
        ) {
          contrastConfig.highContrastValues = cfg.highContrastValues as string[];
        } else {
          return fail('highContrastValues must be an array of strings');
        }
      }

      // Extract defaultValue
      if (cfg.defaultValue !== undefined) {
        if (typeof cfg.defaultValue === 'string') {
          contrastConfig.defaultValue = cfg.defaultValue;
        } else {
          return fail('defaultValue must be a string');
        }
      }
    }

    // Create the qualifier type
    return ContrastQualifierType.create({
      name: config.name,
      configuration: contrastConfig
    });
  }
}

/**
 * Default instance of the ContrastQualifierTypeFactory.
 * Use this in ResourceOrchestrator to enable contrast qualifier type support.
 *
 * @public
 */
export const contrastQualifierTypeFactory = new ContrastQualifierTypeFactory();
