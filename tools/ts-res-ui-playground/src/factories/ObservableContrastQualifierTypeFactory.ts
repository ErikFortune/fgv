import { Result, Converters, fail, succeed } from '@fgv/ts-utils';
import { QualifierTypes } from '@fgv/ts-res';
import { JsonObject } from '@fgv/ts-json-base';
import { ObservabilityTools } from '@fgv/ts-res-ui-components';
import { ContrastQualifierType, IContrastQualifierTypeConfig } from './ContrastQualifierType';
import { logFactoryAttempt, logFactorySuccess, logFactoryFailure } from '../utils/observability';

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
 * Observable factory for creating ContrastQualifierType instances with detailed diagnostic logging.
 * This enhanced version provides visibility into the factory chain resolution process.
 *
 * @template T - The target discriminated union type that includes ContrastQualifierType
 * @public
 */
export class ObservableContrastQualifierTypeFactory<
  T extends QualifierTypes.QualifierType = QualifierTypes.QualifierType
> implements
    QualifierTypes.Config.IConfigInitFactory<QualifierTypes.Config.IQualifierTypeConfig<JsonObject>, T>
{
  /**
   * The system type name this factory handles.
   */
  public readonly systemType = 'contrast';

  /**
   * Observability context for diagnostic logging.
   */
  private readonly o11y: ObservabilityTools.IObservabilityContext;

  /**
   * Name of this factory for logging purposes.
   */
  private readonly factoryName = 'ContrastQualifierTypeFactory';

  /**
   * Creates a new ObservableContrastQualifierTypeFactory.
   * @param o11y - Observability context for logging
   */
  constructor(o11y?: ObservabilityTools.IObservabilityContext) {
    this.o11y = o11y || ObservabilityTools.DefaultObservabilityContext;
  }

  /**
   * Creates a ContrastQualifierType instance from configuration with detailed logging.
   *
   * @param config - The configuration object containing name, systemType, and optional configuration
   * @returns Success with the created qualifier type, or Failure with an error message
   */
  public create(config: QualifierTypes.Config.IQualifierTypeConfig<JsonObject>): Result<T> {
    // Log the factory attempt
    logFactoryAttempt(this.o11y, this.factoryName, config);

    // Use the converter to validate and extract the configuration
    return systemContrastQualifierTypeConfig
      .convert(config)
      .onSuccess((validatedConfig) => {
        this.o11y.diag.info(
          `[${this.factoryName}] Processing contrast configuration for "${validatedConfig.name}"`
        );
        this.o11y.diag.info(`[${this.factoryName}] Validated configuration:`, validatedConfig.configuration);

        // Log individual config properties if present
        if (validatedConfig.configuration) {
          const cfg = validatedConfig.configuration;
          if (cfg.allowContextList !== undefined) {
            this.o11y.diag.info(`[${this.factoryName}] Set allowContextList: ${cfg.allowContextList}`);
          }
          if (cfg.highContrastValues) {
            this.o11y.diag.info(`[${this.factoryName}] Set highContrastValues:`, cfg.highContrastValues);
          }
          if (cfg.defaultValue) {
            this.o11y.diag.info(`[${this.factoryName}] Set defaultValue: ${cfg.defaultValue}`);
          }
        }

        // Create the qualifier type
        this.o11y.diag.info(`[${this.factoryName}] Creating ContrastQualifierType`);

        return ContrastQualifierType.create({
          name: validatedConfig.name,
          configuration: validatedConfig.configuration || {}
        })
          .onSuccess((qualifierType) => {
            logFactorySuccess(this.o11y, this.factoryName, validatedConfig.name, 'contrast');
            this.o11y.user.info(`Created custom contrast qualifier type: ${validatedConfig.name}`);
            return succeed(qualifierType as unknown as T);
          })
          .onFailure((error) => {
            this.o11y.diag.error(`[${this.factoryName}] Failed to create ContrastQualifierType:`, error);
            logFactoryFailure(this.o11y, this.factoryName, config, error);
            return fail(error);
          });
      })
      .onFailure((error) => {
        logFactoryFailure(this.o11y, this.factoryName, config, error);
        return fail(error);
      });
  }
}

/**
 * Creates an observable contrast qualifier type factory with the given observability context.
 * @template T - The target discriminated union type that includes ContrastQualifierType
 * @param o11y - Observability context for logging
 * @returns A new observable factory instance
 * @public
 */
export function createObservableContrastFactory<
  T extends QualifierTypes.QualifierType = QualifierTypes.QualifierType
>(o11y?: ObservabilityTools.IObservabilityContext): ObservableContrastQualifierTypeFactory<T> {
  return new ObservableContrastQualifierTypeFactory<T>(o11y);
}
