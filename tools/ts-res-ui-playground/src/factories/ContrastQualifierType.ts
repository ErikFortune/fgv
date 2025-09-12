import { Result, succeed, fail, captureResult, Validators, Converters } from '@fgv/ts-utils';
import {
  ConditionOperator,
  Convert,
  NoMatch,
  PerfectMatch,
  QualifierConditionValue,
  QualifierContextValue,
  QualifierMatchScore,
  QualifierTypeName,
  QualifierTypes,
  Validate
} from '@fgv/ts-res';
import { QualifierType } from '@fgv/ts-res';
import { JsonObject } from '@fgv/ts-json-base';

/**
 * Configuration interface for the ContrastQualifierType.
 * Defines which values match "high" contrast and other behavior.
 */
export interface IContrastQualifierTypeConfig {
  /** Whether to allow multiple values in context (defaults to false) */
  allowContextList?: boolean;
  /** Values that should match "high" contrast (defaults to ["high", "black", "white"]) */
  highContrastValues?: string[];
  /** Default contrast value (defaults to "standard") */
  defaultValue?: string;
}

const contrastQualifierTypeConfig = Converters.strictObject<IContrastQualifierTypeConfig>({
  allowContextList: Validators.boolean.optional(),
  highContrastValues: Validators.arrayOf(Validators.string).optional(),
  defaultValue: Validators.string.optional()
});

const systemContrastQualifierTypeConfig =
  QualifierTypes.Config.Convert.qualifierTypeConfig(contrastQualifierTypeConfig);

/**
 * Parameters for creating a ContrastQualifierType instance.
 */
export interface IContrastQualifierTypeCreateParams {
  /** Name for the qualifier type (defaults to "contrast") */
  name?: string;
  /** Global index for this qualifier type */
  index?: number;
  /** Configuration options */
  configuration?: IContrastQualifierTypeConfig;
}

/**
 * Custom qualifier type for handling contrast accessibility levels.
 *
 * This qualifier type supports:
 * - Standard values: "standard", "high", "black", "white"
 * - Hierarchical matching: "high" matches "high", "black", or "white"
 * - Default matching behavior for accessibility theming
 *
 * @public
 */
export class ContrastQualifierType extends QualifierType {
  /**
   * {@inheritdoc QualifierTypes.IQualifierType.systemTypeName}
   */
  public readonly systemTypeName: QualifierTypeName = Convert.qualifierTypeName.convert('contrast').orThrow();

  /**
   * Configuration options for this contrast qualifier type.
   */
  public readonly configuration: IContrastQualifierTypeConfig;

  /**
   * Values that match "high" contrast requirements.
   */
  public readonly highContrastValues: readonly string[];

  /**
   * Default contrast value.
   */
  public readonly defaultValue: string;

  /**
   * All valid contrast values.
   */
  public readonly validValues: readonly string[];

  /**
   * Creates a new ContrastQualifierType instance.
   * @param params - Creation parameters
   */
  protected constructor({
    name = 'contrast',
    index,
    configuration = {}
  }: IContrastQualifierTypeCreateParams) {
    const allowContextList = configuration.allowContextList === true;
    const validIndex = index !== undefined ? Convert.qualifierTypeIndex.convert(index).orThrow() : undefined;

    super({
      name,
      allowContextList,
      index: validIndex
    });

    this.configuration = configuration;
    this.highContrastValues = configuration.highContrastValues || ['high', 'black', 'white'];
    this.defaultValue = configuration.defaultValue || 'standard';
    this.validValues = ['standard', ...this.highContrastValues];
  }

  /**
   * Creates a new ContrastQualifierType instance.
   * @param params - Optional creation parameters
   * @returns Success with the new instance, or Failure with an error message
   * @public
   */
  public static create(params?: IContrastQualifierTypeCreateParams): Result<ContrastQualifierType> {
    return captureResult(() => new ContrastQualifierType(params || {}));
  }

  /**
   * {@inheritdoc QualifierTypes.IQualifierType.isValidConditionValue}
   */
  public isValidConditionValue(value: string): value is QualifierConditionValue {
    return this.validValues.includes(value.toLowerCase());
  }

  /**
   * {@inheritdoc QualifierTypes.IQualifierType.getConfigurationJson}
   */
  public getConfigurationJson(): Result<JsonObject> {
    return succeed({
      name: this.name,
      systemType: 'contrast',
      configuration: {
        allowContextList: this.allowContextList,
        highContrastValues: [...this.highContrastValues],
        defaultValue: this.defaultValue
      }
    });
  }

  /**
   * {@inheritdoc QualifierTypes.IQualifierType.validateConfigurationJson}
   */
  public validateConfigurationJson(from: unknown): Result<JsonObject> {
    return contrastQualifierTypeConfig.convert(from);
  }

  /**
   * Validates a strongly typed configuration object for this qualifier type.
   * @param from - The unknown data to validate
   * @returns Success with validated configuration, or Failure with error message
   */
  public validateConfiguration(
    from: unknown
  ): Result<QualifierTypes.Config.IQualifierTypeConfig<IContrastQualifierTypeConfig>> {
    return systemContrastQualifierTypeConfig.convert(from);
  }

  /**
   * {@inheritdoc QualifierTypes.QualifierType._matchOne}
   */
  protected _matchOne(
    condition: QualifierConditionValue,
    context: QualifierContextValue,
    operator: ConditionOperator
  ): QualifierMatchScore {
    if (operator !== 'matches') {
      return NoMatch;
    }

    const normalizedCondition = condition.toLowerCase();
    const normalizedContext = context.toLowerCase();

    // Exact match gets perfect score
    if (normalizedCondition === normalizedContext) {
      return PerfectMatch;
    }

    // Special rule: "high" matches any high contrast value
    if (
      normalizedCondition === 'high' &&
      this.highContrastValues.map((v) => v.toLowerCase()).includes(normalizedContext)
    ) {
      return 0.8 as QualifierMatchScore; // High score but not perfect
    }

    // Special rule: any high contrast value matches "high"
    if (
      normalizedContext === 'high' &&
      this.highContrastValues.map((v) => v.toLowerCase()).includes(normalizedCondition)
    ) {
      return 0.8 as QualifierMatchScore;
    }

    return NoMatch;
  }
}
