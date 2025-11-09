import React, { useState, useCallback, useEffect } from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { JsonValue } from '@fgv/ts-json-base';
import { IGridColumnDefinition } from '../../../../types';
import { validateCellValue } from '../../../../utils/cellValidation';

/**
 * Props for the StringCell component.
 */
export interface IStringCellProps {
  /** Current value of the cell */
  value: JsonValue;
  /** Resource ID for this row */
  resourceId: string;
  /** Column configuration */
  column: IGridColumnDefinition;
  /** Whether this cell is currently being edited */
  isEditing: boolean;
  /** Whether the cell is in read-only mode */
  disabled?: boolean;
  /** Callback when the value changes */
  onChange: (value: string) => void;
  /** Callback when editing starts */
  onStartEdit: () => void;
  /** Callback when editing is cancelled */
  onCancel: () => void;
  /** Callback when the value should be saved */
  onSave: (value: string) => void;
  /** Callback when validation state changes */
  onValidationChange: (error: string | null) => void;
}

/**
 * StringCell component for editing string values with validation.
 *
 * Provides text input with configurable validation, visual error highlighting,
 * and support for required fields, length limits, and pattern matching.
 *
 * @example
 * ```tsx
 * <StringCell
 *   value="user@example.com"
 *   resourceId="user-123"
 *   column={{
 *     id: 'email',
 *     validation: {
 *       required: true,
 *       pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
 *     }
 *   }}
 *   isEditing={false}
 *   onChange={handleChange}
 *   onSave={handleSave}
 *   onValidationChange={handleValidation}
 * />
 * ```
 * @public
 */
export const StringCell: React.FC<IStringCellProps> = ({
  value,
  resourceId,
  column,
  isEditing,
  disabled = false,
  onChange,
  onStartEdit,
  onCancel,
  onSave,
  onValidationChange
}) => {
  const [editValue, setEditValue] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Convert value to string for editing
  const stringValue = React.useMemo(() => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    return String(value);
  }, [value]);

  // Initialize edit value when editing starts
  useEffect(() => {
    if (isEditing) {
      setEditValue(stringValue);
    }
  }, [isEditing, stringValue]);

  // Validate the current edit value
  const validateCurrentValue = useCallback(() => {
    if (!isEditing) return;

    const validationResult = validateCellValue(editValue, column.validation);

    if (validationResult.isFailure()) {
      setValidationError(`Validation failed: ${validationResult.message}`);
      onValidationChange(`Validation failed: ${validationResult.message}`);
      return;
    }

    const result = validationResult.value;
    const error = result.isValid ? null : result.error || null;

    setValidationError(error);
    onValidationChange(error);
  }, [editValue, column.validation, isEditing, onValidationChange]);

  // Validate whenever edit value changes
  useEffect(() => {
    validateCurrentValue();
  }, [validateCurrentValue]);

  // Handle input changes
  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      setEditValue(newValue);
      onChange(newValue);
    },
    [onChange]
  );

  // Handle key presses
  const handleKeyPress = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' && !validationError) {
        onSave(editValue);
      } else if (event.key === 'Escape') {
        onCancel();
      }
    },
    [editValue, validationError, onSave, onCancel]
  );

  // Handle save click
  const handleSave = useCallback(() => {
    if (!validationError) {
      onSave(editValue);
    }
  }, [editValue, validationError, onSave]);

  if (isEditing) {
    return (
      <div className="relative">
        <input
          type="text"
          value={editValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          onBlur={handleSave}
          disabled={disabled}
          autoFocus
          className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 ${
            validationError
              ? 'border-red-500 focus:ring-red-500 bg-red-50'
              : 'border-gray-300 focus:ring-blue-500'
          }`}
          placeholder={column.validation?.required ? `${column.title} (required)` : column.title}
        />

        {validationError && (
          <div className="absolute z-10 mt-1 p-2 bg-red-100 border border-red-200 rounded shadow-sm text-xs text-red-800 max-w-xs">
            <div className="flex items-center space-x-1">
              <ExclamationCircleIcon className="h-3 w-3 flex-shrink-0" />
              <span>{validationError}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Display mode
  const displayValue = stringValue || (column.validation?.required ? '(required)' : '(empty)');
  const isEmpty = !stringValue;
  const isRequired = column.validation?.required;

  return (
    <div
      className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${
        isEmpty && isRequired ? 'text-red-600 bg-red-25' : 'text-gray-900'
      }`}
      onClick={disabled ? undefined : onStartEdit}
      title={disabled ? undefined : 'Click to edit'}
    >
      <span className={isEmpty ? 'italic' : ''}>{displayValue}</span>
      {isEmpty && isRequired && <ExclamationCircleIcon className="inline-block h-4 w-4 ml-1 text-red-500" />}
    </div>
  );
};

export default StringCell;
