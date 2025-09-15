import React, { useCallback, useMemo } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { JsonValue } from '@fgv/ts-json-base';
import { IGridColumnDefinition } from '../../../../types';

/**
 * Props for the TriStateCell component.
 */
export interface ITriStateCellProps {
  /** Current value of the cell */
  value: JsonValue;
  /** Resource ID for this row */
  resourceId: string;
  /** Column configuration */
  column: IGridColumnDefinition;
  /** Whether the cell is in read-only mode */
  disabled?: boolean;
  /** Presentation mode: 'checkbox' for 3-state checkbox, 'dropdown' for select */
  presentation?: 'checkbox' | 'dropdown';
  /** Custom labels for tristate values */
  labels?: {
    trueLabel: string;
    falseLabel: string;
    undefinedLabel: string;
  };
  /** Callback when the value changes */
  onChange: (value: boolean | null) => void;
  /** Callback when the value should be saved */
  onSave: (value: boolean | null) => void;
  /** Callback when validation state changes */
  onValidationChange: (error: string | null) => void;
}

/**
 * TriStateCell component for editing three-state boolean values.
 *
 * Supports true, false, and null/undefined states with two presentation modes:
 * - Checkbox mode: 3-state checkbox (checked, unchecked, indeterminate)
 * - Dropdown mode: Select dropdown with three options
 *
 * @example
 * ```tsx
 * <TriStateCell
 *   value={null}
 *   resourceId="feature-123"
 *   column={{ id: 'enabled', title: 'Feature Enabled' }}
 *   presentation="dropdown"
 *   onChange={handleChange}
 *   onSave={handleSave}
 *   onValidationChange={handleValidation}
 * />
 * ```
 * @public
 */
export const TriStateCell: React.FC<ITriStateCellProps> = ({
  value,
  resourceId,
  column,
  disabled = false,
  presentation = 'dropdown',
  labels,
  onChange,
  onSave,
  onValidationChange
}) => {
  // Convert value to tri-state boolean
  const triStateValue = useMemo((): boolean | null => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      if (value.toLowerCase() === 'true') return true;
      if (value.toLowerCase() === 'false') return false;
      return null;
    }
    if (typeof value === 'number') {
      if (value === 1) return true;
      if (value === 0) return false;
      return null;
    }
    return Boolean(value);
  }, [value]);

  // Handle checkbox change (cycles through states)
  const handleCheckboxChange = useCallback(() => {
    let newValue: boolean | null;

    if (triStateValue === null) {
      newValue = true;
    } else if (triStateValue === true) {
      newValue = false;
    } else {
      newValue = null;
    }

    onChange(newValue);
    onSave(newValue);
    onValidationChange(null);
  }, [triStateValue, onChange, onSave, onValidationChange]);

  // Handle dropdown change
  const handleDropdownChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      let newValue: boolean | null;

      switch (event.target.value) {
        case 'true':
          newValue = true;
          break;
        case 'false':
          newValue = false;
          break;
        default:
          newValue = null;
          break;
      }

      onChange(newValue);
      onSave(newValue);
      onValidationChange(null);
    },
    [onChange, onSave, onValidationChange]
  );

  if (presentation === 'checkbox') {
    // 3-state checkbox presentation
    const checkboxRef = React.useRef<HTMLInputElement>(null);

    // Update checkbox indeterminate state
    React.useEffect(() => {
      if (checkboxRef.current) {
        checkboxRef.current.indeterminate = triStateValue === null;
      }
    }, [triStateValue]);

    return (
      <div className="px-3 py-2 flex items-center justify-center">
        <label className="inline-flex items-center">
          <input
            ref={checkboxRef}
            type="checkbox"
            checked={triStateValue === true}
            onChange={handleCheckboxChange}
            disabled={disabled}
            className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
              disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          />
          <span className="sr-only">{column.title}</span>
        </label>
      </div>
    );
  }

  // Default labels (can be overridden)
  const defaultLabels = {
    trueLabel: 'Yes',
    falseLabel: 'No',
    undefinedLabel: 'Unset'
  };

  const effectiveLabels = labels || defaultLabels;

  return (
    <div className="px-3 py-2">
      <div className="relative">
        <select
          value={triStateValue === null ? 'null' : String(triStateValue)}
          onChange={handleDropdownChange}
          disabled={disabled}
          className={`w-full appearance-none bg-white border border-gray-300 rounded px-3 py-1 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'cursor-pointer'
          }`}
        >
          <option value="null">{effectiveLabels.undefinedLabel}</option>
          <option value="true">{effectiveLabels.trueLabel}</option>
          <option value="false">{effectiveLabels.falseLabel}</option>
        </select>

        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDownIcon className="h-4 w-4 text-gray-400" />
        </div>
      </div>
    </div>
  );
};

export default TriStateCell;
