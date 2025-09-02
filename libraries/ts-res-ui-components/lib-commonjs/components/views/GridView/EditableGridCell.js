'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.clearAllGridValidationErrors =
  exports.getAllGridValidationErrors =
  exports.hasGridValidationErrors =
  exports.EditableGridCell =
    void 0;
const tslib_1 = require('tslib');
const react_1 = tslib_1.__importStar(require('react'));
const cellValidation_1 = require('../../../utils/cellValidation');
const cells_1 = require('./cells');
/**
 * Prevent prototype pollution by disallowing dangerous keys.
 */
function isSafeKey(key) {
  return key !== '__proto__' && key !== 'constructor' && key !== 'prototype';
}
/**
 * Global validation state for grid cells.
 * In a real implementation, this would be managed at the grid level.
 */
const globalValidationState = new cellValidation_1.GridValidationState();
/**
 * EditableGridCell component that provides editing capabilities for grid cells.
 * @public
 *
 * Automatically selects the appropriate cell editor based on the column configuration
 * and integrates with the existing ResolutionActions for batch editing support.
 * Supports validation with visual feedback and prevents invalid changes from being saved.
 *
 * @example
 * ```tsx
 * <EditableGridCell
 *   value="user@example.com"
 *   resourceId="user-123"
 *   column={{
 *     id: 'email',
 *     cellType: 'string',
 *     validation: { required: true, pattern: /email-pattern/ }
 *   }}
 *   resolvedValue={{ email: 'user@example.com', name: 'John' }}
 *   isEdited={false}
 *   resolutionActions={actions}
 *   resolutionState={state}
 * />
 * ```
 */
const EditableGridCell = ({
  value,
  resourceId,
  column,
  resolvedValue,
  isEdited,
  resolutionActions,
  resolutionState,
  onMessage,
  className = ''
}) => {
  const [isEditing, setIsEditing] = (0, react_1.useState)(false);
  const [currentValidationError, setCurrentValidationError] = (0, react_1.useState)(null);
  // Check if editing is disabled
  const isDisabled = (0, react_1.useMemo)(() => {
    return resolutionState?.isApplyingEdits || !resolutionActions;
  }, [resolutionState?.isApplyingEdits, resolutionActions]);
  // Get current edited value if any
  const editedValue = (0, react_1.useMemo)(() => {
    return resolutionActions?.getEditedValue?.(resourceId);
  }, [resolutionActions, resourceId]);
  // Extract field-specific value from edited object using the same logic as ResourceGrid
  const extractedEditedValue = (0, react_1.useMemo)(() => {
    if (editedValue === undefined) return undefined;
    // Use the same extractValueByPath logic as ResourceGrid
    const dataPath = column.dataPath;
    if (typeof dataPath === 'string') {
      return editedValue?.[dataPath];
    }
    if (Array.isArray(dataPath)) {
      let current = editedValue;
      for (const segment of dataPath) {
        if (current == null) return undefined;
        current = current[segment];
      }
      return current;
    }
    return undefined;
  }, [editedValue, column.dataPath]);
  // Determine the display value (edited field value takes precedence)
  const displayValue = (0, react_1.useMemo)(() => {
    return extractedEditedValue !== undefined ? extractedEditedValue : value;
  }, [extractedEditedValue, value]);
  // Start editing
  const handleStartEdit = (0, react_1.useCallback)(() => {
    if (isDisabled || !column.editable) return;
    setIsEditing(true);
  }, [isDisabled, column.editable]);
  // Cancel editing
  const handleCancel = (0, react_1.useCallback)(() => {
    setIsEditing(false);
    setCurrentValidationError(null);
    globalValidationState.clearCell(resourceId, column.id);
  }, [resourceId, column.id]);
  // Save changes
  const handleSave = (0, react_1.useCallback)(
    (newValue) => {
      if (!resolutionActions?.saveEdit) {
        onMessage?.('error', 'Unable to save: no edit actions available');
        return;
      }
      // Check for validation errors before saving
      if (currentValidationError) {
        onMessage?.('warning', `Cannot save: ${currentValidationError}`);
        return;
      }
      // Create updated object by setting only the specific field identified by dataPath
      // Ensure resolvedValue is an object before spreading it
      const baseObject =
        resolvedValue && typeof resolvedValue === 'object' && !Array.isArray(resolvedValue)
          ? resolvedValue
          : {};
      const updatedObject = { ...baseObject };
      // Handle both string and array data paths
      const dataPath = column.dataPath;
      if (typeof dataPath === 'string') {
        if (isSafeKey(dataPath)) {
          updatedObject[dataPath] = newValue;
        } else {
          onMessage?.('error', `Invalid field name: "${dataPath}"`);
          return;
        }
      } else if (Array.isArray(dataPath) && dataPath.length > 0) {
        // For nested paths, we need to deep update
        let current = updatedObject;
        for (let i = 0; i < dataPath.length - 1; i++) {
          const segment = dataPath[i];
          if (!isSafeKey(segment)) {
            onMessage?.('error', `Invalid nested field name: "${segment}"`);
            return;
          }
          if (current[segment] == null || typeof current[segment] !== 'object') {
            current[segment] = {};
          }
          current = current[segment];
        }
        const lastSegment = dataPath[dataPath.length - 1];
        if (isSafeKey(lastSegment)) {
          current[lastSegment] = newValue;
        } else {
          onMessage?.('error', `Invalid nested field name: "${lastSegment}"`);
          return;
        }
      }
      // Save the edit using existing resolution actions with the complete updated object
      const saveResult = resolutionActions.saveEdit(resourceId, updatedObject, resolvedValue);
      if (saveResult.isSuccess()) {
        setIsEditing(false);
        setCurrentValidationError(null);
        globalValidationState.clearCell(resourceId, column.id);
        onMessage?.('success', `Updated ${column.title} for ${resourceId}`);
      } else {
        onMessage?.('error', `Failed to save: ${saveResult.message}`);
      }
    },
    [
      resolutionActions,
      resourceId,
      resolvedValue,
      column.dataPath,
      column.id,
      column.title,
      currentValidationError,
      onMessage
    ]
  );
  // Handle value changes during editing
  const handleChange = (0, react_1.useCallback)((newValue) => {
    // Value changes are handled by the individual cell components
    // This is mainly for consistency with the cell component APIs
  }, []);
  // Handle validation changes
  const handleValidationChange = (0, react_1.useCallback)(
    (error) => {
      setCurrentValidationError(error);
      globalValidationState.setCellError(resourceId, column.id, error);
    },
    [resourceId, column.id]
  );
  // Select appropriate cell editor based on column configuration
  const renderCell = () => {
    // Use custom cell editor if provided
    if (column.cellEditor) {
      const CustomEditor = column.cellEditor;
      return react_1.default.createElement(CustomEditor, {
        value: displayValue,
        resourceId: resourceId,
        column: column,
        resolvedValue: resolvedValue,
        isEdited: isEdited,
        editedValue: editedValue,
        onSave: handleSave,
        onCancel: handleCancel,
        disabled: isDisabled,
        className: className
      });
    }
    // Select built-in cell editor based on cellType
    const cellType = column.cellType || 'string';
    switch (cellType) {
      case 'string':
        return react_1.default.createElement(cells_1.StringCell, {
          value: displayValue,
          resourceId: resourceId,
          column: column,
          isEditing: isEditing,
          disabled: isDisabled,
          onChange: handleChange,
          onStartEdit: handleStartEdit,
          onCancel: handleCancel,
          onSave: handleSave,
          onValidationChange: handleValidationChange
        });
      case 'boolean':
        return react_1.default.createElement(cells_1.BooleanCell, {
          value: displayValue,
          resourceId: resourceId,
          column: column,
          disabled: isDisabled,
          onChange: handleChange,
          onSave: handleSave,
          onValidationChange: handleValidationChange
        });
      case 'tristate':
        return react_1.default.createElement(cells_1.TriStateCell, {
          value: displayValue,
          resourceId: resourceId,
          column: column,
          disabled: isDisabled,
          presentation: column.triStatePresentation,
          labels: column.triStateLabels,
          onChange: handleChange,
          onSave: handleSave,
          onValidationChange: handleValidationChange
        });
      case 'dropdown':
        return react_1.default.createElement(cells_1.DropdownCell, {
          value: displayValue,
          resourceId: resourceId,
          column: column,
          isEditing: isEditing,
          disabled: isDisabled,
          onChange: handleChange,
          onStartEdit: handleStartEdit,
          onCancel: handleCancel,
          onSave: handleSave,
          onValidationChange: handleValidationChange
        });
      case 'custom':
        // Custom cell type but no custom editor provided - fall back to string
        return react_1.default.createElement(cells_1.StringCell, {
          value: displayValue,
          resourceId: resourceId,
          column: column,
          isEditing: isEditing,
          disabled: isDisabled,
          onChange: handleChange,
          onStartEdit: handleStartEdit,
          onCancel: handleCancel,
          onSave: handleSave,
          onValidationChange: handleValidationChange
        });
      default:
        // Fallback to string cell
        return react_1.default.createElement(cells_1.StringCell, {
          value: displayValue,
          resourceId: resourceId,
          column: column,
          isEditing: isEditing,
          disabled: isDisabled,
          onChange: handleChange,
          onStartEdit: handleStartEdit,
          onCancel: handleCancel,
          onSave: handleSave,
          onValidationChange: handleValidationChange
        });
    }
  };
  return react_1.default.createElement(
    'div',
    { className: `relative ${className}` },
    renderCell(),
    currentValidationError &&
      react_1.default.createElement('div', {
        className: 'absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full'
      })
  );
};
exports.EditableGridCell = EditableGridCell;
/**
 * Utility function to check if the grid has validation errors.
 * This prevents batch operations when there are invalid values.
 * @public
 */
const hasGridValidationErrors = () => {
  return globalValidationState.hasErrors;
};
exports.hasGridValidationErrors = hasGridValidationErrors;
/**
 * Utility function to get all current validation errors.
 * Useful for displaying validation summaries or debugging.
 * @public
 */
const getAllGridValidationErrors = () => {
  return globalValidationState.getAllErrors();
};
exports.getAllGridValidationErrors = getAllGridValidationErrors;
/**
 * Utility function to clear all grid validation errors.
 * Should be called when the grid is reset or data is reloaded.
 * @public
 */
const clearAllGridValidationErrors = () => {
  globalValidationState.clearAll();
};
exports.clearAllGridValidationErrors = clearAllGridValidationErrors;
exports.default = exports.EditableGridCell;
//# sourceMappingURL=EditableGridCell.js.map
