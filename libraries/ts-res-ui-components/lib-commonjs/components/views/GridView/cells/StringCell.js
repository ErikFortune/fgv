'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.StringCell = void 0;
const tslib_1 = require('tslib');
const react_1 = tslib_1.__importStar(require('react'));
const outline_1 = require('@heroicons/react/24/outline');
const cellValidation_1 = require('../../../../utils/cellValidation');
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
const StringCell = ({
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
  const [editValue, setEditValue] = (0, react_1.useState)('');
  const [validationError, setValidationError] = (0, react_1.useState)(null);
  // Convert value to string for editing
  const stringValue = react_1.default.useMemo(() => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    return String(value);
  }, [value]);
  // Initialize edit value when editing starts
  (0, react_1.useEffect)(() => {
    if (isEditing) {
      setEditValue(stringValue);
    }
  }, [isEditing, stringValue]);
  // Validate the current edit value
  const validateCurrentValue = (0, react_1.useCallback)(() => {
    if (!isEditing) return;
    const validationResult = (0, cellValidation_1.validateCellValue)(editValue, column.validation);
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
  (0, react_1.useEffect)(() => {
    validateCurrentValue();
  }, [validateCurrentValue]);
  // Handle input changes
  const handleInputChange = (0, react_1.useCallback)(
    (event) => {
      const newValue = event.target.value;
      setEditValue(newValue);
      onChange(newValue);
    },
    [onChange]
  );
  // Handle key presses
  const handleKeyPress = (0, react_1.useCallback)(
    (event) => {
      if (event.key === 'Enter' && !validationError) {
        onSave(editValue);
      } else if (event.key === 'Escape') {
        onCancel();
      }
    },
    [editValue, validationError, onSave, onCancel]
  );
  // Handle save click
  const handleSave = (0, react_1.useCallback)(() => {
    if (!validationError) {
      onSave(editValue);
    }
  }, [editValue, validationError, onSave]);
  if (isEditing) {
    return react_1.default.createElement(
      'div',
      { className: 'relative' },
      react_1.default.createElement('input', {
        type: 'text',
        value: editValue,
        onChange: handleInputChange,
        onKeyDown: handleKeyPress,
        onBlur: handleSave,
        disabled: disabled,
        autoFocus: true,
        className: `w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 ${
          validationError
            ? 'border-red-500 focus:ring-red-500 bg-red-50'
            : 'border-gray-300 focus:ring-blue-500'
        }`,
        placeholder: column.validation?.required ? `${column.title} (required)` : column.title
      }),
      validationError &&
        react_1.default.createElement(
          'div',
          {
            className:
              'absolute z-10 mt-1 p-2 bg-red-100 border border-red-200 rounded shadow-sm text-xs text-red-800 max-w-xs'
          },
          react_1.default.createElement(
            'div',
            { className: 'flex items-center space-x-1' },
            react_1.default.createElement(outline_1.ExclamationCircleIcon, {
              className: 'h-3 w-3 flex-shrink-0'
            }),
            react_1.default.createElement('span', null, validationError)
          )
        )
    );
  }
  // Display mode
  const displayValue = stringValue || (column.validation?.required ? '(required)' : '(empty)');
  const isEmpty = !stringValue;
  const isRequired = column.validation?.required;
  return react_1.default.createElement(
    'div',
    {
      className: `px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${
        isEmpty && isRequired ? 'text-red-600 bg-red-25' : 'text-gray-900'
      }`,
      onClick: disabled ? undefined : onStartEdit,
      title: disabled ? undefined : 'Click to edit'
    },
    react_1.default.createElement('span', { className: isEmpty ? 'italic' : '' }, displayValue),
    isEmpty &&
      isRequired &&
      react_1.default.createElement(outline_1.ExclamationCircleIcon, {
        className: 'inline-block h-4 w-4 ml-1 text-red-500'
      })
  );
};
exports.StringCell = StringCell;
exports.default = exports.StringCell;
//# sourceMappingURL=StringCell.js.map
