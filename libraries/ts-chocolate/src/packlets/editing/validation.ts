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
import { IValidationReport } from './model';

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
