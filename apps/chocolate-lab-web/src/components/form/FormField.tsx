/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import React from 'react';

/**
 * Base props for form fields
 */
export interface IFormFieldProps {
  /** Field label */
  label: string;
  /** Field name/id */
  name: string;
  /** Error message (if any) */
  error?: string;
  /** Whether field is required */
  required?: boolean;
  /** Help text */
  helpText?: string;
  /** Whether field is disabled */
  disabled?: boolean;
}

/**
 * Form field wrapper with label and error display
 */
export function FormFieldWrapper({
  label,
  name,
  error,
  required,
  helpText,
  children
}: IFormFieldProps & { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {helpText && !error && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helpText}</p>}
      {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

/**
 * Text input field props
 */
export interface ITextFieldProps extends IFormFieldProps {
  /** Current value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Input type */
  type?: 'text' | 'email' | 'url';
  /** Max length */
  maxLength?: number;
}

/**
 * Text input field
 */
export function TextField({
  label,
  name,
  value,
  onChange,
  error,
  required,
  helpText,
  placeholder,
  type = 'text',
  maxLength,
  disabled
}: ITextFieldProps): React.ReactElement {
  return (
    <FormFieldWrapper label={label} name={name} error={error} required={required} helpText={helpText}>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        className={`
          w-full px-3 py-2 rounded-md border
          ${error ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'}
          bg-white dark:bg-gray-800
          text-gray-900 dark:text-gray-100
          placeholder-gray-400 dark:placeholder-gray-500
          focus:outline-none focus:ring-2 focus:ring-chocolate-500 focus:border-transparent
          disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed
        `}
      />
    </FormFieldWrapper>
  );
}

/**
 * Textarea field props
 */
export interface ITextAreaFieldProps extends IFormFieldProps {
  /** Current value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Number of rows */
  rows?: number;
  /** Max length */
  maxLength?: number;
}

/**
 * Textarea field
 */
export function TextAreaField({
  label,
  name,
  value,
  onChange,
  error,
  required,
  helpText,
  placeholder,
  rows = 3,
  maxLength,
  disabled
}: ITextAreaFieldProps): React.ReactElement {
  return (
    <FormFieldWrapper label={label} name={name} error={error} required={required} helpText={helpText}>
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        className={`
          w-full px-3 py-2 rounded-md border
          ${error ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'}
          bg-white dark:bg-gray-800
          text-gray-900 dark:text-gray-100
          placeholder-gray-400 dark:placeholder-gray-500
          focus:outline-none focus:ring-2 focus:ring-chocolate-500 focus:border-transparent
          disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed
          resize-vertical
        `}
      />
    </FormFieldWrapper>
  );
}

/**
 * Number input field props
 */
export interface INumberFieldProps extends IFormFieldProps {
  /** Current value */
  value: number | undefined;
  /** Change handler */
  onChange: (value: number | undefined) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step increment */
  step?: number;
  /** Unit suffix (e.g., "g/mL") */
  unit?: string;
}

/**
 * Number input field
 */
export function NumberField({
  label,
  name,
  value,
  onChange,
  error,
  required,
  helpText,
  placeholder,
  min,
  max,
  step,
  unit,
  disabled
}: INumberFieldProps): React.ReactElement {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const val = e.target.value;
    if (val === '') {
      onChange(undefined);
    } else {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        onChange(num);
      }
    }
  };

  return (
    <FormFieldWrapper label={label} name={name} error={error} required={required} helpText={helpText}>
      <div className="flex">
        <input
          type="number"
          id={name}
          name={name}
          value={value ?? ''}
          onChange={handleChange}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={`
            flex-1 px-3 py-2 rounded-md border
            ${unit ? 'rounded-r-none' : ''}
            ${error ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'}
            bg-white dark:bg-gray-800
            text-gray-900 dark:text-gray-100
            placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-chocolate-500 focus:border-transparent
            disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed
          `}
        />
        {unit && (
          <span className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-r-md text-sm">
            {unit}
          </span>
        )}
      </div>
    </FormFieldWrapper>
  );
}

/**
 * Select field option
 */
export interface ISelectOption {
  value: string;
  label: string;
}

/**
 * Select field props
 */
export interface ISelectFieldProps extends IFormFieldProps {
  /** Current value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Options */
  options: ISelectOption[];
  /** Placeholder text */
  placeholder?: string;
}

/**
 * Select dropdown field
 */
export function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  error,
  required,
  helpText,
  placeholder,
  disabled
}: ISelectFieldProps): React.ReactElement {
  return (
    <FormFieldWrapper label={label} name={name} error={error} required={required} helpText={helpText}>
      <select
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`
          w-full px-3 py-2 rounded-md border
          ${error ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'}
          bg-white dark:bg-gray-800
          text-gray-900 dark:text-gray-100
          focus:outline-none focus:ring-2 focus:ring-chocolate-500 focus:border-transparent
          disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed
        `}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormFieldWrapper>
  );
}
