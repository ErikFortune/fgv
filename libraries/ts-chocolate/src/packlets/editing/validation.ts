// Copyright (c) 2024 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import { Result, fail, succeed } from '@fgv/ts-utils';
import { FieldValidators, IFieldValidator, IValidationReport } from './model';

// ============================================================================
// Validation Report Implementation
// ============================================================================

/**
 * Implementation of IValidationReport.
 * Immutable validation report with field and general errors.
 * @public
 */
export class ValidationReport implements IValidationReport {
  /**
   * Map of field paths to error messages.
   */
  public readonly fieldErrors: ReadonlyMap<string, string>;

  /**
   * Array of general error messages.
   */
  public readonly generalErrors: ReadonlyArray<string>;

  /**
   * Create a validation report.
   * @param fieldErrors - Map of field paths to error messages
   * @param generalErrors - Array of general error messages
   */
  public constructor(fieldErrors: ReadonlyMap<string, string>, generalErrors: ReadonlyArray<string>) {
    this.fieldErrors = fieldErrors;
    this.generalErrors = generalErrors;
  }

  /**
   * Overall validation status.
   */
  public get isValid(): boolean {
    return this.fieldErrors.size === 0 && this.generalErrors.length === 0;
  }

  /**
   * Create a successful (no errors) validation report.
   * @returns Empty validation report
   */
  public static success(): ValidationReport {
    return new ValidationReport(new Map(), []);
  }

  /**
   * Create a validation report with field errors.
   * @param errors - Map of field paths to error messages
   * @returns Validation report with field errors
   */
  public static withFieldErrors(errors: Map<string, string>): ValidationReport {
    return new ValidationReport(errors, []);
  }

  /**
   * Create a validation report with general errors.
   * @param errors - Array of general error messages
   * @returns Validation report with general errors
   */
  public static withGeneralErrors(errors: string[]): ValidationReport {
    return new ValidationReport(new Map(), errors);
  }

  /**
   * Create a validation report with both field and general errors.
   * @param fieldErrors - Map of field paths to error messages
   * @param generalErrors - Array of general error messages
   * @returns Validation report with all errors
   */
  public static withErrors(fieldErrors: Map<string, string>, generalErrors: string[]): ValidationReport {
    return new ValidationReport(fieldErrors, generalErrors);
  }
}

// ============================================================================
// Validation Report Builder
// ============================================================================

/**
 * Builder for constructing validation reports.
 * Allows accumulating errors before creating final report.
 * @public
 */
export class ValidationReportBuilder {
  private readonly _fieldErrors: Map<string, string> = new Map();
  private readonly _generalErrors: string[] = [];

  /**
   * Add a field error.
   * @param fieldPath - Field path (dot notation for nested fields)
   * @param errorMessage - Error message
   */
  public addFieldError(fieldPath: string, errorMessage: string): this {
    this._fieldErrors.set(fieldPath, errorMessage);
    return this;
  }

  /**
   * Add a general error.
   * @param errorMessage - Error message
   */
  public addGeneralError(errorMessage: string): this {
    this._generalErrors.push(errorMessage);
    return this;
  }

  /**
   * Add errors from a validation result.
   * If the result is a failure, adds it as a field error.
   * @param fieldPath - Field path for the error
   * @param result - Validation result
   */
  public addValidationResult(fieldPath: string, result: Result<unknown>): this {
    if (result.isFailure()) {
      this.addFieldError(fieldPath, result.message);
    }
    return this;
  }

  /**
   * Check if any errors have been added.
   * @returns True if there are errors
   */
  public hasErrors(): boolean {
    return this._fieldErrors.size > 0 || this._generalErrors.length > 0;
  }

  /**
   * Build the final validation report.
   * @returns Validation report with all accumulated errors
   */
  public build(): ValidationReport {
    return new ValidationReport(new Map(this._fieldErrors), Array.from(this._generalErrors));
  }

  /**
   * Build and return as Result.
   * Returns success(report) if no errors, fail with error summary if errors exist.
   * @returns Result containing validation report or failure
   */
  public buildResult(): Result<ValidationReport> {
    const report = this.build();
    if (report.isValid) {
      return succeed(report);
    }

    // Build error summary
    const errorParts: string[] = [];
    if (report.fieldErrors.size > 0) {
      errorParts.push(
        `Field errors: ${Array.from(report.fieldErrors.entries())
          .map(([field, msg]) => `${field}: ${msg}`)
          .join('; ')}`
      );
    }
    if (report.generalErrors.length > 0) {
      errorParts.push(`General errors: ${report.generalErrors.join('; ')}`);
    }

    return fail(errorParts.join(' | '));
  }
}

// ============================================================================
// Field Validator Base Class
// ============================================================================

/**
 * Base implementation of IFieldValidator.
 * Provides common functionality for field validators.
 *
 * @typeParam T - Entity type
 * @public
 */
export class FieldValidator<T, K extends keyof T> implements IFieldValidator<T, K> {
  /**
   * Name of field to validate.
   */
  public readonly fieldName: K;

  /**
   * Error message template.
   */
  public readonly errorMessage: string;

  /**
   * Validation function.
   */
  private readonly _validatorFn: (value: T[K] | undefined, context?: Partial<T>) => Result<T[K]>;

  /**
   * Create a field validator.
   * @param fieldName - Name of field to validate
   * @param errorMessage - Error message template
   * @param validatorFn - Validation function
   */
  public constructor(
    fieldName: K,
    errorMessage: string,
    validatorFn: (value: T[K] | undefined, context?: Partial<T>) => Result<T[K]>
  ) {
    this.fieldName = fieldName;
    this.errorMessage = errorMessage;
    this._validatorFn = validatorFn;
  }

  /**
   * Validate field value.
   * @param value - Value to validate
   * @param context - Optional partial entity for cross-field validation
   * @returns Result of true if valid, or failure with error message
   */
  public validate(value: T[K] | undefined, context?: Partial<T>): Result<T[K]> {
    return this._validatorFn(value, context);
  }

  /**
   * Create a required field validator.
   * Checks that value is not null or undefined.
   * @param fieldName - Field name
   * @returns Field validator
   */
  public static required<T, K extends keyof T>(fieldName: K): FieldValidator<T, K> {
    return new FieldValidator(fieldName, `${String(fieldName)} is required`, (value: T[K] | undefined) => {
      if (value === null || value === undefined) {
        return fail(`${String(fieldName)} is required`);
      }
      return succeed(value);
    });
  }

  /**
   * Create a string field validator.
   * Checks that value is a non-empty string.
   * @param fieldName - Field name
   * @param maxLength - Optional maximum length
   * @returns Field validator
   */
  public static string<T, K extends keyof T>(
    fieldName: K,
    options?: { maxLength?: number; minLength?: number }
  ): FieldValidator<T, K> {
    return new FieldValidator(
      fieldName,
      `${String(fieldName)} must be a valid string`,
      (value: T[K] | undefined) => {
        if (typeof value !== 'string') {
          return fail(`${String(fieldName)} must be a string`);
        }
        if (value.length === 0) {
          return fail(`${String(fieldName)} cannot be empty`);
        }
        if (options?.maxLength !== undefined && value.length > options.maxLength) {
          return fail(`${String(fieldName)} must be at most ${options.maxLength} characters`);
        }
        if (options?.minLength !== undefined && value.length < options.minLength) {
          return fail(`${String(fieldName)} must be at least ${options.minLength} characters`);
        }
        return succeed(value);
      }
    );
  }

  /**
   * Create a number field validator.
   * Checks that value is a valid number within optional range.
   * @param fieldName - Field name
   * @param options - Optional min/max range
   * @returns Field validator
   */
  public static number<T, K extends keyof T>(
    fieldName: K,
    options?: { min?: number; max?: number; positive?: boolean }
  ): FieldValidator<T, K> {
    return new FieldValidator(
      fieldName,
      `${String(fieldName)} must be a valid number`,
      (value: T[K] | undefined) => {
        if (typeof value !== 'number' || isNaN(value)) {
          return fail(`${String(fieldName)} must be a number`);
        }
        if (options?.positive && value < 0) {
          return fail(`${String(fieldName)} must be positive`);
        }
        if (options?.min !== undefined && value < options.min) {
          return fail(`${String(fieldName)} must be at least ${options.min}`);
        }
        if (options?.max !== undefined && value > options.max) {
          return fail(`${String(fieldName)} must be at most ${options.max}`);
        }
        return succeed(value);
      }
    );
  }

  /**
   * Create a percentage field validator.
   * Checks that value is between 0 and 100.
   * @param fieldName - Field name
   * @returns Field validator
   */
  public static percentage<T, K extends keyof T>(fieldName: K): FieldValidator<T, K> {
    return FieldValidator.number(fieldName, { min: 0, max: 100 });
  }
}

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validate an entity using a collection of field validators.
 * @param entity - Entity to validate
 * @param validators - Array of field validators
 * @param field - Optional specific field to validate
 * @returns Result containing validation report
 * @public
 */
export function validateEntity<T>(
  entity: Partial<T>,
  validators: FieldValidators<T>,
  field?: keyof T
): Result<ValidationReport> {
  const builder = new ValidationReportBuilder();

  if (field !== undefined) {
    if (field in validators) {
      const result = validators[field].validate(entity[field]);
      builder.addValidationResult(String(field), result);
    }
    return succeed(builder.build()); // No validator for specified field
  }

  for (const fieldName in validators) {
    if (Object.prototype.hasOwnProperty.call(validators, fieldName)) {
      const result = validators[fieldName].validate(entity[fieldName], entity);
      builder.addValidationResult(String(field), result);
    }
  }

  return succeed(builder.build());
}

/**
 * Check if validation report indicates success.
 * Convenience function for checking validation results.
 * @param report - Validation report
 * @returns True if validation passed
 * @public
 */
export function isValidationSuccess(report: IValidationReport): boolean {
  return report.isValid;
}
