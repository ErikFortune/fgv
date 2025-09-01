import { Result, succeed, fail } from '@fgv/ts-utils';
import { QualifierTypes } from '@fgv/ts-res';
import { JsonObject } from '@fgv/ts-json-base';
import { ObservabilityTools } from '@fgv/ts-res-ui-components';
import { ContrastQualifierType, IContrastQualifierTypeConfig } from './ContrastQualifierType';
import { logFactoryAttempt, logFactorySuccess, logFactoryFailure } from '../utils/observability';

/**
 * Observable factory for creating ContrastQualifierType instances with detailed diagnostic logging.
 * This enhanced version provides visibility into the factory chain resolution process.
 *
 * @public
 */
export class ObservableContrastQualifierTypeFactory implements QualifierTypes.IConfigInitFactory {
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
  public create(
    config: QualifierTypes.Config.IQualifierTypeConfig<JsonObject>
  ): Result<QualifierTypes.IQualifierType> {
    // Log the factory attempt
    logFactoryAttempt(this.o11y, this.factoryName, config);

    // Validate that this is a contrast configuration
    if (config.systemType !== 'contrast') {
      const reason = `Factory only handles 'contrast' types, not '${config.systemType}'`;
      logFactoryFailure(this.o11y, this.factoryName, config, reason);
      return fail(`${this.factoryName} can only create 'contrast' types, received '${config.systemType}'`);
    }

    this.o11y.diag.info(`[${this.factoryName}] Processing contrast configuration for "${config.name}"`);

    // Extract and validate configuration
    const contrastConfig: IContrastQualifierTypeConfig = {};

    if (config.configuration && typeof config.configuration === 'object') {
      const cfg = config.configuration as Record<string, unknown>;

      this.o11y.diag.info(`[${this.factoryName}] Parsing configuration:`, cfg);

      // Extract allowContextList
      if (cfg.allowContextList !== undefined) {
        if (typeof cfg.allowContextList === 'boolean') {
          contrastConfig.allowContextList = cfg.allowContextList;
          this.o11y.diag.info(`[${this.factoryName}] Set allowContextList: ${cfg.allowContextList}`);
        } else {
          const error = 'allowContextList must be a boolean';
          this.o11y.diag.error(`[${this.factoryName}] Configuration error: ${error}`);
          logFactoryFailure(this.o11y, this.factoryName, config, error);
          return fail(error);
        }
      }

      // Extract highContrastValues
      if (cfg.highContrastValues !== undefined) {
        if (
          Array.isArray(cfg.highContrastValues) &&
          cfg.highContrastValues.every((v) => typeof v === 'string')
        ) {
          contrastConfig.highContrastValues = cfg.highContrastValues as string[];
          this.o11y.diag.info(`[${this.factoryName}] Set highContrastValues:`, cfg.highContrastValues);
        } else {
          const error = 'highContrastValues must be an array of strings';
          this.o11y.diag.error(`[${this.factoryName}] Configuration error: ${error}`);
          logFactoryFailure(this.o11y, this.factoryName, config, error);
          return fail(error);
        }
      }

      // Extract defaultValue
      if (cfg.defaultValue !== undefined) {
        if (typeof cfg.defaultValue === 'string') {
          contrastConfig.defaultValue = cfg.defaultValue;
          this.o11y.diag.info(`[${this.factoryName}] Set defaultValue: ${cfg.defaultValue}`);
        } else {
          const error = 'defaultValue must be a string';
          this.o11y.diag.error(`[${this.factoryName}] Configuration error: ${error}`);
          logFactoryFailure(this.o11y, this.factoryName, config, error);
          return fail(error);
        }
      }
    }

    // Create the qualifier type
    this.o11y.diag.info(`[${this.factoryName}] Creating ContrastQualifierType with config:`, contrastConfig);

    const result = ContrastQualifierType.create({
      name: config.name,
      configuration: contrastConfig
    });

    if (result.isSuccess()) {
      logFactorySuccess(this.o11y, this.factoryName, config.name, 'contrast');
      this.o11y.user.info(`Created custom contrast qualifier type: ${config.name}`);
    } else {
      this.o11y.diag.error(`[${this.factoryName}] Failed to create ContrastQualifierType:`, result.message);
      logFactoryFailure(this.o11y, this.factoryName, config, result.message);
    }

    return result;
  }
}

/**
 * Creates an observable contrast qualifier type factory with the given observability context.
 * @param o11y - Observability context for logging
 * @returns A new observable factory instance
 * @public
 */
export function createObservableContrastFactory(
  o11y?: ObservabilityTools.IObservabilityContext
): ObservableContrastQualifierTypeFactory {
  return new ObservableContrastQualifierTypeFactory(o11y);
}
