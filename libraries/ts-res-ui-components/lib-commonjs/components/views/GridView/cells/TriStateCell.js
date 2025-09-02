'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.TriStateCell = void 0;
const tslib_1 = require('tslib');
const react_1 = tslib_1.__importStar(require('react'));
const outline_1 = require('@heroicons/react/24/outline');
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
const TriStateCell = ({
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
  const triStateValue = (0, react_1.useMemo)(() => {
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
  const handleCheckboxChange = (0, react_1.useCallback)(() => {
    let newValue;
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
  const handleDropdownChange = (0, react_1.useCallback)(
    (event) => {
      let newValue;
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
    const checkboxRef = react_1.default.useRef(null);
    // Update checkbox indeterminate state
    react_1.default.useEffect(() => {
      if (checkboxRef.current) {
        checkboxRef.current.indeterminate = triStateValue === null;
      }
    }, [triStateValue]);
    return react_1.default.createElement(
      'div',
      { className: 'px-3 py-2 flex items-center justify-center' },
      react_1.default.createElement(
        'label',
        { className: 'inline-flex items-center' },
        react_1.default.createElement('input', {
          ref: checkboxRef,
          type: 'checkbox',
          checked: triStateValue === true,
          onChange: handleCheckboxChange,
          disabled: disabled,
          className: `h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          }`
        }),
        react_1.default.createElement('span', { className: 'sr-only' }, column.title)
      )
    );
  }
  // Default labels (can be overridden)
  const defaultLabels = {
    trueLabel: 'Yes',
    falseLabel: 'No',
    undefinedLabel: 'Unset'
  };
  const effectiveLabels = labels || defaultLabels;
  return react_1.default.createElement(
    'div',
    { className: 'px-3 py-2' },
    react_1.default.createElement(
      'div',
      { className: 'relative' },
      react_1.default.createElement(
        'select',
        {
          value: triStateValue === null ? 'null' : String(triStateValue),
          onChange: handleDropdownChange,
          disabled: disabled,
          className: `w-full appearance-none bg-white border border-gray-300 rounded px-3 py-1 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'cursor-pointer'
          }`
        },
        react_1.default.createElement('option', { value: 'null' }, effectiveLabels.undefinedLabel),
        react_1.default.createElement('option', { value: 'true' }, effectiveLabels.trueLabel),
        react_1.default.createElement('option', { value: 'false' }, effectiveLabels.falseLabel)
      ),
      react_1.default.createElement(
        'div',
        { className: 'absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none' },
        react_1.default.createElement(outline_1.ChevronDownIcon, { className: 'h-4 w-4 text-gray-400' })
      )
    )
  );
};
exports.TriStateCell = TriStateCell;
exports.default = exports.TriStateCell;
//# sourceMappingURL=TriStateCell.js.map
