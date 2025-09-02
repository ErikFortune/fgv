'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.GridValidationState = exports.ValidationFunctions = exports.ValidationPatterns = void 0;
exports.validateCellValue = validateCellValue;
const ts_utils_1 = require('@fgv/ts-utils');
/**
 * Validates a cell value according to the column's validation rules.
 *
 * @param value - The value to validate
 * @param validation - Validation configuration
 * @returns Result containing validation outcome
 * @public
 */
function validateCellValue(value, validation) {
  if (!validation) {
    return (0, ts_utils_1.succeed)({ isValid: true, normalizedValue: value });
  }
  try {
    // Handle null/undefined values
    const isEmpty = value === null || value === undefined || value === '';
    // Required field validation
    if (validation.required && isEmpty) {
      return (0, ts_utils_1.succeed)({
        isValid: false,
        error: 'This field is required',
        normalizedValue: value
      });
    }
    // If empty and not required, it's valid
    if (isEmpty && !validation.required) {
      return (0, ts_utils_1.succeed)({ isValid: true, normalizedValue: value });
    }
    // String-specific validations
    if (typeof value === 'string') {
      const trimmedValue = value.trim();
      // Length validations
      if (validation.minLength !== undefined && trimmedValue.length < validation.minLength) {
        return (0, ts_utils_1.succeed)({
          isValid: false,
          error: `Minimum length is ${validation.minLength} characters`,
          normalizedValue: trimmedValue
        });
      }
      if (validation.maxLength !== undefined && trimmedValue.length > validation.maxLength) {
        return (0, ts_utils_1.succeed)({
          isValid: false,
          error: `Maximum length is ${validation.maxLength} characters`,
          normalizedValue: trimmedValue
        });
      }
      // Pattern validation
      if (validation.pattern && !validation.pattern.test(trimmedValue)) {
        return (0, ts_utils_1.succeed)({
          isValid: false,
          error: 'Value does not match the required format',
          normalizedValue: trimmedValue
        });
      }
      // Custom validation
      if (validation.custom) {
        const customError = validation.custom(trimmedValue);
        if (customError) {
          return (0, ts_utils_1.succeed)({
            isValid: false,
            error: customError,
            normalizedValue: trimmedValue
          });
        }
      }
      return (0, ts_utils_1.succeed)({ isValid: true, normalizedValue: trimmedValue });
    }
    // Non-string values: only custom validation applies
    if (validation.custom) {
      const customError = validation.custom(value);
      if (customError) {
        return (0, ts_utils_1.succeed)({
          isValid: false,
          error: customError,
          normalizedValue: value
        });
      }
    }
    return (0, ts_utils_1.succeed)({ isValid: true, normalizedValue: value });
  } catch (error) {
    return (0, ts_utils_1.fail)(
      `Validation error: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
/**
 * Common validation patterns for reuse.
 * @public
 */
exports.ValidationPatterns = {
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
exports.ValidationFunctions = {
  /** Validates that a string represents a valid JSON */
  validJson: (value) => {
    if (typeof value !== 'string') return null;
    try {
      JSON.parse(value);
      return null;
    } catch {
      return 'Must be valid JSON';
    }
  },
  /** Validates that a number is within a range */
  numberRange: (min, max) => (value) => {
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
  oneOf: (allowedValues) => (value) => {
    if (!allowedValues.includes(value)) {
      return `Must be one of: ${allowedValues.join(', ')}`;
    }
    return null;
  },
  /** Validates that a string doesn't contain certain characters */
  excludeCharacters: (forbiddenChars) => (value) => {
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
class GridValidationState {
  constructor() {
    this.cellErrors = new Map();
  }
  /**
   * Set validation error for a specific cell.
   *
   * @param resourceId - Resource ID for the row
   * @param columnId - Column ID for the cell
   * @param error - Error message, or null to clear error
   */
  setCellError(resourceId, columnId, error) {
    if (!this.cellErrors.has(resourceId)) {
      this.cellErrors.set(resourceId, new Map());
    }
    const resourceErrors = this.cellErrors.get(resourceId);
    if (error) {
      resourceErrors.set(columnId, error);
    } else {
      resourceErrors.delete(columnId);
      // Clean up empty resource error maps
      if (resourceErrors.size === 0) {
        this.cellErrors.delete(resourceId);
      }
    }
  }
  /**
   * Get validation error for a specific cell.
   */
  getCellError(resourceId, columnId) {
    return this.cellErrors.get(resourceId)?.get(columnId) || null;
  }
  /**
   * Check if a specific cell has validation errors.
   */
  hasCellError(resourceId, columnId) {
    return !!this.getCellError(resourceId, columnId);
  }
  /**
   * Get all validation errors for a resource.
   */
  getResourceErrors(resourceId) {
    return this.cellErrors.get(resourceId) || new Map();
  }
  /**
   * Check if any cells have validation errors.
   */
  get hasErrors() {
    return this.cellErrors.size > 0;
  }
  /**
   * Get total count of validation errors.
   */
  get errorCount() {
    let count = 0;
    for (const resourceErrors of this.cellErrors.values()) {
      count += resourceErrors.size;
    }
    return count;
  }
  /**
   * Get all error messages as a flat array.
   */
  getAllErrors() {
    const errors = [];
    for (const [resourceId, resourceErrors] of this.cellErrors.entries()) {
      for (const [columnId, error] of resourceErrors.entries()) {
        errors.push({ resourceId, columnId, error });
      }
    }
    return errors;
  }
  /**
   * Clear all validation errors.
   */
  clearAll() {
    this.cellErrors.clear();
  }
  /**
   * Clear validation errors for a specific resource.
   */
  clearResource(resourceId) {
    this.cellErrors.delete(resourceId);
  }
  /**
   * Clear validation error for a specific cell.
   */
  clearCell(resourceId, columnId) {
    this.setCellError(resourceId, columnId, null);
  }
}
exports.GridValidationState = GridValidationState;
//# sourceMappingURL=cellValidation.js.map
