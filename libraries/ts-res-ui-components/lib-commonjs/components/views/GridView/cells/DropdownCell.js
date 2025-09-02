'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.DropdownCell = void 0;
const tslib_1 = require('tslib');
const react_1 = tslib_1.__importStar(require('react'));
const outline_1 = require('@heroicons/react/24/outline');
const cellValidation_1 = require('../../../../utils/cellValidation');
const contexts_1 = require('../../../../contexts');
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
const DropdownCell = ({
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
  const o11y = (0, contexts_1.useObservability)();
  const [editValue, setEditValue] = (0, react_1.useState)('');
  const [options, setOptions] = (0, react_1.useState)([]);
  const [loadingOptions, setLoadingOptions] = (0, react_1.useState)(false);
  const [validationError, setValidationError] = (0, react_1.useState)(null);
  // Convert value to string
  const stringValue = (0, react_1.useMemo)(() => {
    if (value === null || value === undefined) return '';
    return String(value);
  }, [value]);
  // Load dropdown options
  (0, react_1.useEffect)(() => {
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
  (0, react_1.useEffect)(() => {
    if (isEditing) {
      setEditValue(stringValue);
    }
  }, [isEditing, stringValue]);
  // Validate current value
  const validateCurrentValue = (0, react_1.useCallback)(() => {
    if (!isEditing) return;
    // First, run standard validation
    const validationResult = (0, cellValidation_1.validateCellValue)(editValue, column.validation);
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
  (0, react_1.useEffect)(() => {
    validateCurrentValue();
  }, [validateCurrentValue]);
  // Handle dropdown/combobox change
  const handleSelectChange = (0, react_1.useCallback)(
    (event) => {
      const newValue = event.target.value;
      setEditValue(newValue);
      onChange(newValue);
    },
    [onChange]
  );
  // Handle key presses (for combobox mode)
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
  // Handle save
  const handleSave = (0, react_1.useCallback)(() => {
    if (!validationError) {
      onSave(editValue);
    }
  }, [editValue, validationError, onSave]);
  // Find display label for current value
  const getDisplayLabel = (0, react_1.useCallback)(
    (val) => {
      if (!val) return '';
      const option = options.find((opt) => opt.value === val);
      return option ? option.label : val;
    },
    [options]
  );
  if (loadingOptions) {
    return react_1.default.createElement(
      'div',
      { className: 'px-3 py-2 text-sm text-gray-500 italic' },
      'Loading options...'
    );
  }
  if (isEditing) {
    const isCombobox = column.allowCustomValue;
    if (isCombobox) {
      // Combobox mode: input with datalist
      return react_1.default.createElement(
        'div',
        { className: 'relative' },
        react_1.default.createElement('input', {
          type: 'text',
          list: `${resourceId}-${column.id}-options`,
          value: editValue,
          onChange: handleSelectChange,
          onKeyDown: handleKeyPress,
          onBlur: handleSave,
          disabled: disabled,
          autoFocus: true,
          className: `w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 ${
            validationError
              ? 'border-red-500 focus:ring-red-500 bg-red-50'
              : 'border-gray-300 focus:ring-blue-500'
          }`,
          placeholder: column.title
        }),
        react_1.default.createElement(
          'datalist',
          { id: `${resourceId}-${column.id}-options` },
          options.map((option) =>
            react_1.default.createElement('option', { key: option.value, value: option.value }, option.label)
          )
        ),
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
    } else {
      // Dropdown mode: select element
      return react_1.default.createElement(
        'div',
        { className: 'relative' },
        react_1.default.createElement(
          'select',
          {
            value: editValue,
            onChange: handleSelectChange,
            onBlur: handleSave,
            disabled: disabled,
            autoFocus: true,
            className: `w-full appearance-none bg-white border rounded px-2 py-1 pr-8 text-sm focus:outline-none focus:ring-2 ${
              validationError
                ? 'border-red-500 focus:ring-red-500 bg-red-50'
                : 'border-gray-300 focus:ring-blue-500'
            }`
          },
          react_1.default.createElement('option', { value: '' }, 'Select ', column.title, '...'),
          options.map((option) =>
            react_1.default.createElement(
              'option',
              { key: option.value, value: option.value, disabled: option.disabled },
              option.label
            )
          )
        ),
        react_1.default.createElement(
          'div',
          { className: 'absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none' },
          react_1.default.createElement(outline_1.ChevronDownIcon, { className: 'h-4 w-4 text-gray-400' })
        ),
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
  }
  // Display mode
  const displayValue =
    getDisplayLabel(stringValue) || (column.validation?.required ? '(required)' : '(not set)');
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
exports.DropdownCell = DropdownCell;
exports.default = exports.DropdownCell;
//# sourceMappingURL=DropdownCell.js.map
