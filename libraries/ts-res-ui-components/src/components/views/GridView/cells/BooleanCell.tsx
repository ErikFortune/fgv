import React, { useCallback } from 'react';
import { JsonValue } from '@fgv/ts-json-base';
import { GridColumnDefinition } from '../../../../types';

/**
 * Props for the BooleanCell component.
 */
export interface BooleanCellProps {
  /** Current value of the cell */
  value: JsonValue;
  /** Resource ID for this row */
  resourceId: string;
  /** Column configuration */
  column: GridColumnDefinition;
  /** Whether the cell is in read-only mode */
  disabled?: boolean;
  /** Callback when the value changes */
  onChange: (value: boolean) => void;
  /** Callback when the value should be saved */
  onSave: (value: boolean) => void;
  /** Callback when validation state changes */
  onValidationChange: (error: string | null) => void;
}

/**
 * BooleanCell component for editing boolean values with checkbox presentation.
 *
 * Provides a clean checkbox interface for true/false values with clear
 * visual state indication and immediate save on change.
 *
 * @example
 * ```tsx
 * <BooleanCell
 *   value={true}
 *   resourceId="user-123"
 *   column={{ id: 'enabled', title: 'Enabled' }}
 *   onChange={handleChange}
 *   onSave={handleSave}
 *   onValidationChange={handleValidation}
 * />
 * ```
 * @public
 */
export const BooleanCell: React.FC<BooleanCellProps> = ({
  value,
  resourceId,
  column,
  disabled = false,
  onChange,
  onSave,
  onValidationChange
}) => {
  // Convert value to boolean
  const booleanValue = React.useMemo(() => {
    if (typeof value === 'boolean') return value;
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    if (typeof value === 'number') {
      return value !== 0;
    }
    return Boolean(value);
  }, [value]);

  // Handle checkbox change
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.checked;
      onChange(newValue);
      onSave(newValue); // Boolean changes are saved immediately
      onValidationChange(null); // Boolean values typically don't have validation errors
    },
    [onChange, onSave, onValidationChange]
  );

  return (
    <div className="px-3 py-2 flex items-center justify-center">
      <label className="inline-flex items-center">
        <input
          type="checkbox"
          checked={booleanValue}
          onChange={handleChange}
          disabled={disabled}
          className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          }`}
        />
        <span className="sr-only">{column.title}</span>
      </label>
    </div>
  );
};

export default BooleanCell;
