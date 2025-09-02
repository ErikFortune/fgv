'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.BooleanCell = void 0;
const tslib_1 = require('tslib');
const react_1 = tslib_1.__importStar(require('react'));
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
const BooleanCell = ({
  value,
  resourceId,
  column,
  disabled = false,
  onChange,
  onSave,
  onValidationChange
}) => {
  // Convert value to boolean
  const booleanValue = react_1.default.useMemo(() => {
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
  const handleChange = (0, react_1.useCallback)(
    (event) => {
      const newValue = event.target.checked;
      onChange(newValue);
      onSave(newValue); // Boolean changes are saved immediately
      onValidationChange(null); // Boolean values typically don't have validation errors
    },
    [onChange, onSave, onValidationChange]
  );
  return react_1.default.createElement(
    'div',
    { className: 'px-3 py-2 flex items-center justify-center' },
    react_1.default.createElement(
      'label',
      { className: 'inline-flex items-center' },
      react_1.default.createElement('input', {
        type: 'checkbox',
        checked: booleanValue,
        onChange: handleChange,
        disabled: disabled,
        className: `h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`
      }),
      react_1.default.createElement('span', { className: 'sr-only' }, column.title)
    )
  );
};
exports.BooleanCell = BooleanCell;
exports.default = exports.BooleanCell;
//# sourceMappingURL=BooleanCell.js.map
