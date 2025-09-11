import { Result, succeed, fail } from '@fgv/ts-utils';
import { JsonValue } from '@fgv/ts-json-base';
import { IGridCellValidation } from '../types';

/**
 * Validation result for a grid cell value.
 */
export interface ICellValidationResult {
  /** Whether the value is valid */
  isValid: boolean;
  /** Error message if validation failed */
  error?: string;
  /** Cleaned/normalized value (e.g., trimmed strings) */
  normalizedValue?: JsonValue;
}

/**
 * Validates a cell value according to the column's validation rules.
 *
 * @param value - The value to validate
 * @param validation - Validation configuration
 * @returns Result containing validation outcome
 * @public
 */
export function validateCellValue(
  value: JsonValue,
  validation?: IGridCellValidation
): Result<ICellValidationResult> {
  if (!validation) {
    return succeed({ isValid: true, normalizedValue: value });
  }

  try {
    // Handle null/undefined values
    const isEmpty = value === null || value === undefined || value === '';

    // Required field validation
    if (validation.required && isEmpty) {
      return succeed({
        isValid: false,
        error: 'This field is required',
        normalizedValue: value
      });
    }

    // If empty and not required, it's valid
    if (isEmpty && !validation.required) {
      return succeed({ isValid: true, normalizedValue: value });
    }

    // String-specific validations
    if (typeof value === 'string') {
      const trimmedValue = value.trim();

      // Length validations
      if (validation.minLength !== undefined && trimmedValue.length < validation.minLength) {
        return succeed({
          isValid: false,
          error: `Minimum length is ${validation.minLength} characters`,
          normalizedValue: trimmedValue
        });
      }

      if (validation.maxLength !== undefined && trimmedValue.length > validation.maxLength) {
        return succeed({
          isValid: false,
          error: `Maximum length is ${validation.maxLength} characters`,
          normalizedValue: trimmedValue
        });
      }

      // Pattern validation
      if (validation.pattern && !validation.pattern.test(trimmedValue)) {
        return succeed({
          isValid: false,
          error: 'Value does not match the required format',
          normalizedValue: trimmedValue
        });
      }

      // Custom validation
      if (validation.custom) {
        const customError = validation.custom(trimmedValue);
        if (customError) {
          return succeed({
            isValid: false,
            error: customError,
            normalizedValue: trimmedValue
          });
        }
      }

      return succeed({ isValid: true, normalizedValue: trimmedValue });
    }

    // Non-string values: only custom validation applies
    if (validation.custom) {
      const customError = validation.custom(value);
      if (customError) {
        return succeed({
          isValid: false,
          error: customError,
          normalizedValue: value
        });
      }
    }

    return succeed({ isValid: true, normalizedValue: value });
  } catch (error) {
    return fail(`Validation error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Common validation patterns for reuse.
 * @public
 */
export const ValidationPatterns: Record<string, RegExp> = {
  /** Email address validation */
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  /** URL validation (basic) */
  url: /^https?:\/\/.+/,
  /** Phone number (flexible format) */
  phone: /^[\+]?[1-9][\d]{0,15}$/,
  /** Alphanumeric only */
  alphanumeric: /^[a-zA-Z0-9]+$/,
  /** No whitespace */
  noWhitespace: /^\S+$/,
  /** Positive integer */
  positiveInteger: /^[1-9]\d*$/,
  /** Non-negative integer (including 0) */
  nonNegativeInteger: /^\d+$/
};

/**
 * Common validation functions for reuse.
 * @public
 */
export const ValidationFunctions: {
  validJson: (value: JsonValue) => string | null;
  numberRange: (min: number, max: number) => (value: JsonValue) => string | null;
  oneOf: (allowedValues: JsonValue[]) => (value: JsonValue) => string | null;
  excludeCharacters: (forbiddenChars: string) => (value: JsonValue) => string | null;
} = {
  /** Validates that a string represents a valid JSON */
  validJson: (value: JsonValue): string | null => {
    if (typeof value !== 'string') return null;
    try {
      JSON.parse(value);
      return null;
    } catch {
      return 'Must be valid JSON';
    }
  },

  /** Validates that a number is within a range */
  numberRange:
    (min: number, max: number) =>
    (value: JsonValue): string | null => {
      const num = typeof value === 'string' ? parseFloat(value) : value;
      if (typeof num !== 'number' || isNaN(num)) {
        return 'Must be a valid number';
      }
      if (num < min || num > max) {
        return `Must be between ${min} and ${max}`;
      }
      return null;
    },

  /** Validates that a value is one of the allowed options */
  oneOf:
    (allowedValues: JsonValue[]) =>
    (value: JsonValue): string | null => {
      if (!allowedValues.includes(value)) {
        return `Must be one of: ${allowedValues.join(', ')}`;
      }
      return null;
    },

  /** Validates that a string doesn't contain certain characters */
  excludeCharacters:
    (forbiddenChars: string) =>
    (value: JsonValue): string | null => {
      if (typeof value !== 'string') return null;

      for (const char of forbiddenChars) {
        if (value.includes(char)) {
          return `Cannot contain the character: ${char}`;
        }
      }
      return null;
    }
};

/**
 * Grid validation state management utility.
 * @public
 */
export class GridValidationState {
  private _cellErrors: Map<string, Map<string, string>> = new Map<string, Map<string, string>>();

  /**
   * Set validation error for a specific cell.
   *
   * @param resourceId - Resource ID for the row
   * @param columnId - Column ID for the cell
   * @param error - Error message, or null to clear error
   */
  public setCellError(resourceId: string, columnId: string, error: string | null): void {
    if (!this._cellErrors.has(resourceId)) {
      this._cellErrors.set(resourceId, new Map());
    }

    const resourceErrors = this._cellErrors.get(resourceId)!;

    if (error) {
      resourceErrors.set(columnId, error);
    } else {
      resourceErrors.delete(columnId);

      // Clean up empty resource error maps
      if (resourceErrors.size === 0) {
        this._cellErrors.delete(resourceId);
      }
    }
  }

  /**
   * Get validation error for a specific cell.
   */
  public getCellError(resourceId: string, columnId: string): string | null {
    return this._cellErrors.get(resourceId)?.get(columnId) || null;
  }

  /**
   * Check if a specific cell has validation errors.
   */
  public hasCellError(resourceId: string, columnId: string): boolean {
    return !!this.getCellError(resourceId, columnId);
  }

  /**
   * Get all validation errors for a resource.
   */
  public getResourceErrors(resourceId: string): Map<string, string> {
    return this._cellErrors.get(resourceId) || new Map();
  }

  /**
   * Check if any cells have validation errors.
   */
  public get hasErrors(): boolean {
    return this._cellErrors.size > 0;
  }

  /**
   * Get total count of validation errors.
   */
  public get errorCount(): number {
    let count = 0;
    for (const resourceErrors of this._cellErrors.values()) {
      count += resourceErrors.size;
    }
    return count;
  }

  /**
   * Get all error messages as a flat array.
   */
  public getAllErrors(): Array<{ resourceId: string; columnId: string; error: string }> {
    const errors: Array<{ resourceId: string; columnId: string; error: string }> = [];

    for (const [resourceId, resourceErrors] of this._cellErrors.entries()) {
      for (const [columnId, error] of resourceErrors.entries()) {
        errors.push({ resourceId, columnId, error });
      }
    }

    return errors;
  }

  /**
   * Clear all validation errors.
   */
  public clearAll(): void {
    this._cellErrors.clear();
  }

  /**
   * Clear validation errors for a specific resource.
   */
  public clearResource(resourceId: string): void {
    this._cellErrors.delete(resourceId);
  }

  /**
   * Clear validation error for a specific cell.
   */
  public clearCell(resourceId: string, columnId: string): void {
    this.setCellError(resourceId, columnId, null);
  }
}
