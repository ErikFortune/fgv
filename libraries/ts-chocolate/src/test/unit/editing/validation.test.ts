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

import '@fgv/ts-utils-jest';
import { ValidationReport, ValidationReportBuilder, isValidationSuccess } from '../../../packlets/editing';
import { succeed, fail } from '@fgv/ts-utils';

describe('ValidationReport', () => {
  describe('constructor', () => {
    test('should create a validation report with errors', () => {
      const fieldErrors = new Map([['name', 'Name is required']]);
      const generalErrors = ['General error'];
      const report = new ValidationReport(fieldErrors, generalErrors);

      expect(report.fieldErrors.size).toBe(1);
      expect(report.fieldErrors.get('name')).toBe('Name is required');
      expect(report.generalErrors).toEqual(['General error']);
      expect(report.isValid).toBe(false);
    });

    test('should create a successful validation report', () => {
      const report = new ValidationReport(new Map(), []);

      expect(report.fieldErrors.size).toBe(0);
      expect(report.generalErrors.length).toBe(0);
      expect(report.isValid).toBe(true);
    });
  });

  describe('success', () => {
    test('should create an empty successful report', () => {
      const report = ValidationReport.success();

      expect(report.isValid).toBe(true);
      expect(report.fieldErrors.size).toBe(0);
      expect(report.generalErrors.length).toBe(0);
    });
  });

  describe('withFieldErrors', () => {
    test('should create a report with only field errors', () => {
      const errors = new Map([
        ['name', 'Name is required'],
        ['age', 'Age must be positive']
      ]);
      const report = ValidationReport.withFieldErrors(errors);

      expect(report.isValid).toBe(false);
      expect(report.fieldErrors.size).toBe(2);
      expect(report.generalErrors.length).toBe(0);
    });
  });

  describe('withGeneralErrors', () => {
    test('should create a report with only general errors', () => {
      const errors = ['Error 1', 'Error 2'];
      const report = ValidationReport.withGeneralErrors(errors);

      expect(report.isValid).toBe(false);
      expect(report.fieldErrors.size).toBe(0);
      expect(report.generalErrors).toEqual(errors);
    });
  });

  describe('withErrors', () => {
    test('should create a report with both field and general errors', () => {
      const fieldErrors = new Map([['name', 'Name is required']]);
      const generalErrors = ['General error'];
      const report = ValidationReport.withErrors(fieldErrors, generalErrors);

      expect(report.isValid).toBe(false);
      expect(report.fieldErrors.size).toBe(1);
      expect(report.generalErrors.length).toBe(1);
    });
  });

  describe('isValid', () => {
    test('should return true when no errors', () => {
      const report = ValidationReport.success();
      expect(report.isValid).toBe(true);
    });

    test('should return false with field errors', () => {
      const report = ValidationReport.withFieldErrors(new Map([['name', 'Error']]));
      expect(report.isValid).toBe(false);
    });

    test('should return false with general errors', () => {
      const report = ValidationReport.withGeneralErrors(['Error']);
      expect(report.isValid).toBe(false);
    });
  });
});

describe('ValidationReportBuilder', () => {
  describe('addFieldError', () => {
    test('should add field error', () => {
      const builder = new ValidationReportBuilder();
      builder.addFieldError('name', 'Name is required');

      const report = builder.build();
      expect(report.fieldErrors.get('name')).toBe('Name is required');
    });

    test('should return this for chaining', () => {
      const builder = new ValidationReportBuilder();
      const result = builder.addFieldError('name', 'Error');
      expect(result).toBe(builder);
    });

    test('should overwrite existing field error', () => {
      const builder = new ValidationReportBuilder();
      builder.addFieldError('name', 'First error');
      builder.addFieldError('name', 'Second error');

      const report = builder.build();
      expect(report.fieldErrors.get('name')).toBe('Second error');
    });
  });

  describe('addGeneralError', () => {
    test('should add general error', () => {
      const builder = new ValidationReportBuilder();
      builder.addGeneralError('General error');

      const report = builder.build();
      expect(report.generalErrors).toContain('General error');
    });

    test('should return this for chaining', () => {
      const builder = new ValidationReportBuilder();
      const result = builder.addGeneralError('Error');
      expect(result).toBe(builder);
    });

    test('should accumulate multiple general errors', () => {
      const builder = new ValidationReportBuilder();
      builder.addGeneralError('Error 1');
      builder.addGeneralError('Error 2');

      const report = builder.build();
      expect(report.generalErrors).toEqual(['Error 1', 'Error 2']);
    });
  });

  describe('addValidationResult', () => {
    test('should add field error from failed result', () => {
      const builder = new ValidationReportBuilder();
      builder.addValidationResult('name', fail('Name is required'));

      const report = builder.build();
      expect(report.fieldErrors.get('name')).toBe('Name is required');
    });

    test('should not add error from successful result', () => {
      const builder = new ValidationReportBuilder();
      builder.addValidationResult('name', succeed(true));

      const report = builder.build();
      expect(report.fieldErrors.size).toBe(0);
    });

    test('should return this for chaining', () => {
      const builder = new ValidationReportBuilder();
      const result = builder.addValidationResult('name', fail('Error'));
      expect(result).toBe(builder);
    });
  });

  describe('hasErrors', () => {
    test('should return false when no errors', () => {
      const builder = new ValidationReportBuilder();
      expect(builder.hasErrors()).toBe(false);
    });

    test('should return true with field errors', () => {
      const builder = new ValidationReportBuilder();
      builder.addFieldError('name', 'Error');
      expect(builder.hasErrors()).toBe(true);
    });

    test('should return true with general errors', () => {
      const builder = new ValidationReportBuilder();
      builder.addGeneralError('Error');
      expect(builder.hasErrors()).toBe(true);
    });
  });

  describe('build', () => {
    test('should build validation report with all errors', () => {
      const builder = new ValidationReportBuilder();
      builder.addFieldError('name', 'Name error');
      builder.addFieldError('age', 'Age error');
      builder.addGeneralError('General error');

      const report = builder.build();
      expect(report.fieldErrors.size).toBe(2);
      expect(report.generalErrors.length).toBe(1);
      expect(report.isValid).toBe(false);
    });

    test('should create independent copies of errors', () => {
      const builder = new ValidationReportBuilder();
      builder.addFieldError('name', 'Error');
      const report1 = builder.build();

      builder.addFieldError('age', 'Another error');
      const report2 = builder.build();

      expect(report1.fieldErrors.size).toBe(1);
      expect(report2.fieldErrors.size).toBe(2);
    });
  });

  describe('buildResult', () => {
    test('should succeed with valid report', () => {
      const builder = new ValidationReportBuilder();
      expect(builder.buildResult()).toSucceedAndSatisfy((report) => {
        expect(report.isValid).toBe(true);
      });
    });

    test('should fail with field errors', () => {
      const builder = new ValidationReportBuilder();
      builder.addFieldError('name', 'Name is required');
      builder.addFieldError('age', 'Age must be positive');

      expect(builder.buildResult()).toFailWith(/field errors.*name.*age/i);
    });

    test('should fail with general errors', () => {
      const builder = new ValidationReportBuilder();
      builder.addGeneralError('Error 1');
      builder.addGeneralError('Error 2');

      expect(builder.buildResult()).toFailWith(/general errors.*error 1.*error 2/i);
    });

    test('should fail with both error types', () => {
      const builder = new ValidationReportBuilder();
      builder.addFieldError('name', 'Name error');
      builder.addGeneralError('General error');

      expect(builder.buildResult()).toFailWith(/field errors.*general errors/i);
    });
  });
});

describe('isValidationSuccess', () => {
  test('should return true for successful validation', () => {
    const report = ValidationReport.success();
    expect(isValidationSuccess(report)).toBe(true);
  });

  test('should return false for failed validation with field errors', () => {
    const report = ValidationReport.withFieldErrors(new Map([['name', 'Error']]));
    expect(isValidationSuccess(report)).toBe(false);
  });

  test('should return false for failed validation with general errors', () => {
    const report = ValidationReport.withGeneralErrors(['Error']);
    expect(isValidationSuccess(report)).toBe(false);
  });
});
