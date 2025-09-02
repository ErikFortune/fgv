import { Result, Converters } from '@fgv/ts-utils';
import { QualifierTypes } from '@fgv/ts-res';
import { JsonObject } from '@fgv/ts-json-base';
import { ContrastQualifierType, IContrastQualifierTypeConfig } from './ContrastQualifierType';

/**
 * Converter for ContrastQualifierType configuration objects.
 */
const contrastQualifierTypeConfig = Converters.strictObject<IContrastQualifierTypeConfig>({
  allowContextList: Converters.boolean.optional(),
  highContrastValues: Converters.arrayOf(Converters.string).optional(),
  defaultValue: Converters.string.optional()
});

/**
 * Converter for system contrast qualifier type configuration.
 */
const systemContrastQualifierTypeConfig = Converters.strictObject<{
  name: string;
  systemType: 'contrast';
  configuration?: IContrastQualifierTypeConfig;
}>({
  name: Converters.string,
  systemType: Converters.literal('contrast'),
  configuration: contrastQualifierTypeConfig.optional()
});

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
    // Use the converter to validate and extract the configuration
    return systemContrastQualifierTypeConfig.convert(config).onSuccess((validatedConfig) =>
      ContrastQualifierType.create({
        name: validatedConfig.name,
        configuration: validatedConfig.configuration || {}
      })
    );
  }
}

/**
 * Default instance of the ContrastQualifierTypeFactory.
 * Use this in ResourceOrchestrator to enable contrast qualifier type support.
 *
 * @public
 */
export const contrastQualifierTypeFactory = new ContrastQualifierTypeFactory();
