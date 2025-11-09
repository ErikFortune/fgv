import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { ChevronDownIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { JsonValue } from '@fgv/ts-json-base';
import { IGridColumnDefinition, IGridDropdownOption } from '../../../../types';
import { validateCellValue } from '../../../../utils/cellValidation';
import { useObservability } from '../../../../contexts';

/**
 * Props for the DropdownCell component.
 */
export interface IDropdownCellProps {
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
 * DropdownCell component for editing string values with predefined options.
 *
 * Supports both dropdown (restricted to options) and combobox (allows custom values) modes.
 * Can load options dynamically and provides validation for selected values.
 *
 * @example
 * ```tsx
 * <DropdownCell
 *   value="active"
 *   resourceId="user-123"
 *   column={{
 *     id: 'status',
 *     dropdownOptions: [
 *       { value: 'active', label: 'Active' },
 *       { value: 'inactive', label: 'Inactive' }
 *     ],
 *     allowCustomValue: false
 *   }}
 *   isEditing={false}
 *   onChange={handleChange}
 *   onSave={handleSave}
 *   onValidationChange={handleValidation}
 * />
 * ```
 * @public
 */
export const DropdownCell: React.FC<IDropdownCellProps> = ({
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
  // Get observability context
  const o11y = useObservability();

  const [editValue, setEditValue] = useState('');
  const [options, setOptions] = useState<IGridDropdownOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Convert value to string
  const stringValue = useMemo(() => {
    if (value === null || value === undefined) return '';
    return String(value);
  }, [value]);

  // Load dropdown options
  useEffect(() => {
    if (!column.dropdownOptions) {
      setOptions([]);
      return;
    }

    if (Array.isArray(column.dropdownOptions)) {
      setOptions(column.dropdownOptions);
      return;
    }

    // Async options loading
    setLoadingOptions(true);
    column
      .dropdownOptions()
      .then((loadedOptions) => {
        setOptions(loadedOptions);
        setLoadingOptions(false);
      })
      .catch((error) => {
        o11y.diag.error('Failed to load dropdown options:', error);
        setOptions([]);
        setLoadingOptions(false);
      });
  }, [column.dropdownOptions]);

  // Initialize edit value when editing starts
  useEffect(() => {
    if (isEditing) {
      setEditValue(stringValue);
    }
  }, [isEditing, stringValue]);

  // Validate current value
  const validateCurrentValue = useCallback(() => {
    if (!isEditing) return;

    // First, run standard validation
    const validationResult = validateCellValue(editValue, column.validation);

    if (validationResult.isFailure()) {
      setValidationError(`Validation failed: ${validationResult.message}`);
      onValidationChange(`Validation failed: ${validationResult.message}`);
      return;
    }

    const result = validationResult.value;
    if (!result.isValid) {
      setValidationError(result.error || null);
      onValidationChange(result.error || null);
      return;
    }

    // Then check if value is in allowed options (if not allowing custom values)
    if (!column.allowCustomValue && editValue && options.length > 0) {
      const validOption = options.find((opt) => opt.value === editValue);
      if (!validOption) {
        const error = `Must be one of: ${options.map((opt) => opt.label).join(', ')}`;
        setValidationError(error);
        onValidationChange(error);
        return;
      }
    }

    setValidationError(null);
    onValidationChange(null);
  }, [editValue, column.validation, column.allowCustomValue, options, isEditing, onValidationChange]);

  // Validate whenever edit value or options change
  useEffect(() => {
    validateCurrentValue();
  }, [validateCurrentValue]);

  // Handle dropdown/combobox change
  const handleSelectChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
      const newValue = event.target.value;
      setEditValue(newValue);
      onChange(newValue);
    },
    [onChange]
  );

  // Handle key presses (for combobox mode)
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

  // Handle save
  const handleSave = useCallback(() => {
    if (!validationError) {
      onSave(editValue);
    }
  }, [editValue, validationError, onSave]);

  // Find display label for current value
  const getDisplayLabel = useCallback(
    (val: string) => {
      if (!val) return '';
      const option = options.find((opt) => opt.value === val);
      return option ? option.label : val;
    },
    [options]
  );

  if (loadingOptions) {
    return <div className="px-3 py-2 text-sm text-gray-500 italic">Loading options...</div>;
  }

  if (isEditing) {
    const isCombobox = column.allowCustomValue;

    if (isCombobox) {
      // Combobox mode: input with datalist
      return (
        <div className="relative">
          <input
            type="text"
            list={`${resourceId}-${column.id}-options`}
            value={editValue}
            onChange={handleSelectChange}
            onKeyDown={handleKeyPress}
            onBlur={handleSave}
            disabled={disabled}
            autoFocus
            className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 ${
              validationError
                ? 'border-red-500 focus:ring-red-500 bg-red-50'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            placeholder={column.title}
          />

          <datalist id={`${resourceId}-${column.id}-options`}>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </datalist>

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
    } else {
      // Dropdown mode: select element
      return (
        <div className="relative">
          <select
            value={editValue}
            onChange={handleSelectChange}
            onBlur={handleSave}
            disabled={disabled}
            autoFocus
            className={`w-full appearance-none bg-white border rounded px-2 py-1 pr-8 text-sm focus:outline-none focus:ring-2 ${
              validationError
                ? 'border-red-500 focus:ring-red-500 bg-red-50'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
          >
            <option value="">Select {column.title}...</option>
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <ChevronDownIcon className="h-4 w-4 text-gray-400" />
          </div>

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
  }

  // Display mode
  const displayValue =
    getDisplayLabel(stringValue) || (column.validation?.required ? '(required)' : '(not set)');
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

export default DropdownCell;
