import { Result, fail } from '@fgv/ts-utils';
import { QualifierTypes } from '@fgv/ts-res';
import { JsonObject } from '@fgv/ts-json-base';
import { ObservabilityTools } from '@fgv/ts-res-ui-components';
import { ObservableContrastQualifierTypeFactory } from './ObservableContrastQualifierTypeFactory';
import { logFactoryChainResolution } from '../utils/observability';

/**
 * Composite factory that chains custom qualifier type factories with built-in factories.
 * This ensures both custom types (like "contrast") and standard types (like "language", "territory", "literal")
 * can be properly created.
 *
 * The factory chain works as follows:
 * 1. First tries custom factories (like ContrastQualifierTypeFactory)
 * 2. Falls back to built-in factories for standard types
 * 3. Provides detailed observability into the resolution process
 *
 * @public
 */
export class CompositeQualifierTypeFactory implements QualifierTypes.IConfigInitFactory {
  /**
   * System type handled by this composite factory (handles all types).
   */
  public readonly systemType = '*'; // Indicates this factory can handle any type through chaining

  /**
   * The chain of factories to try in order.
   */
  private readonly factoryChain: QualifierTypes.IConfigInitFactory[];

  /**
   * Observability context for diagnostic logging.
   */
  private readonly o11y: ObservabilityTools.IObservabilityContext;

  /**
   * Creates a new CompositeQualifierTypeFactory.
   * @param o11y - Observability context for logging
   */
  constructor(o11y?: ObservabilityTools.IObservabilityContext) {
    this.o11y = o11y || ObservabilityTools.DefaultObservabilityContext;

    // Initialize the factory chain with only custom factories
    // The ts-res system automatically appends built-in factories to the chain
    this.factoryChain = [new ObservableContrastQualifierTypeFactory(this.o11y)];

    this.o11y.diag.info('[CompositeQualifierTypeFactory] Initialized with custom factories:', {
      customFactories: this.factoryChain.length,
      note: 'Built-in factories will be automatically appended by ts-res'
    });
  }

  /**
   * Creates a qualifier type by trying each factory in the chain until one succeeds.
   *
   * @param config - The configuration object containing name, systemType, and optional configuration
   * @returns Success with the created qualifier type, or Failure with an error message
   */
  public create(
    config: QualifierTypes.Config.IQualifierTypeConfig<JsonObject>
  ): Result<QualifierTypes.IQualifierType> {
    this.o11y.diag.info('[CompositeQualifierTypeFactory] Attempting to create qualifier type:', {
      name: config.name,
      systemType: config.systemType
    });

    const triedFactories: string[] = [];
    let lastError: string = '';

    // Try each factory in the chain
    for (let i = 0; i < this.factoryChain.length; i++) {
      const factory = this.factoryChain[i];
      const factoryName = this.getFactoryName(factory, i);
      triedFactories.push(factoryName);

      this.o11y.diag.info(
        `[CompositeQualifierTypeFactory] Trying factory ${i + 1}/${this.factoryChain.length}: ${factoryName}`
      );

      const result = factory.create(config);

      if (result.isSuccess()) {
        // Success! Log and return
        logFactoryChainResolution(this.o11y, config.systemType, triedFactories, factoryName);
        this.o11y.diag.info(
          `[CompositeQualifierTypeFactory] ✅ Successfully created "${config.name}" using ${factoryName}`
        );
        return result;
      } else {
        // Failed, log and continue to next factory
        lastError = result.message;
        this.o11y.diag.info(
          `[CompositeQualifierTypeFactory] Factory ${factoryName} could not handle type: ${lastError}`
        );
      }
    }

    // All factories failed
    logFactoryChainResolution(this.o11y, config.systemType, triedFactories);

    const errorMessage = `No factory in chain could create qualifier type "${config.name}" (${config.systemType}). Last error: ${lastError}`;
    this.o11y.diag.error(`[CompositeQualifierTypeFactory] ${errorMessage}`);
    this.o11y.user.error(
      `Configuration error: Unable to create qualifier type "${config.name}" of type "${config.systemType}"`
    );

    return fail(errorMessage);
  }

  /**
   * Gets a human-readable name for a factory.
   */
  private getFactoryName(factory: QualifierTypes.IConfigInitFactory, index: number): string {
    if (factory instanceof ObservableContrastQualifierTypeFactory) {
      return 'ContrastQualifierTypeFactory';
    } else if ((factory as any).constructor?.name) {
      return (factory as any).constructor.name;
    } else if ((factory as any).systemType) {
      return `Factory[${(factory as any).systemType}]`;
    } else {
      return `Factory[${index}]`;
    }
  }
}

/**
 * Creates a composite qualifier type factory with observability.
 * This is the recommended factory to use in the playground to support both
 * custom and standard qualifier types.
 *
 * @param o11y - Optional observability context for logging
 * @returns A new composite factory instance that chains custom and built-in factories
 * @public
 */
export function createCompositeQualifierTypeFactory(
  o11y?: ObservabilityTools.IObservabilityContext
): CompositeQualifierTypeFactory {
  return new CompositeQualifierTypeFactory(o11y);
}
