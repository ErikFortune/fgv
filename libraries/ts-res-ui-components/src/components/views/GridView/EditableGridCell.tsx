import React, { useState, useCallback, useMemo } from 'react';
import { JsonValue } from '@fgv/ts-json-base';
import { GridColumnDefinition, ResolutionActions, ResolutionState } from '../../../types';
import { GridValidationState } from '../../../utils/cellValidation';
import { StringCell, BooleanCell, TriStateCell, DropdownCell } from './cells';

/**
 * Props for the EditableGridCell component.
 */
export interface EditableGridCellProps {
  /** The extracted value for this cell */
  value: JsonValue;
  /** The resource ID for this row */
  resourceId: string;
  /** The column definition for this cell */
  column: GridColumnDefinition;
  /** The complete resolved resource value */
  resolvedValue: JsonValue;
  /** Whether this cell has been edited */
  isEdited: boolean;
  /** Resolution actions for editing integration */
  resolutionActions?: ResolutionActions;
  /** Resolution state for edit tracking */
  resolutionState?: ResolutionState;
  /** Callback for displaying messages */
  onMessage?: (type: 'info' | 'warning' | 'error' | 'success', message: string) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Global validation state for grid cells.
 * In a real implementation, this would be managed at the grid level.
 */
const globalValidationState = new GridValidationState();

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
export const EditableGridCell: React.FC<EditableGridCellProps> = ({
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
  const [isEditing, setIsEditing] = useState(false);
  const [currentValidationError, setCurrentValidationError] = useState<string | null>(null);

  // Check if editing is disabled
  const isDisabled = useMemo(() => {
    return resolutionState?.isApplyingEdits || !resolutionActions;
  }, [resolutionState?.isApplyingEdits, resolutionActions]);

  // Get current edited value if any
  const editedValue = useMemo(() => {
    return resolutionActions?.getEditedValue?.(resourceId);
  }, [resolutionActions, resourceId]);

  // Determine the display value (edited value takes precedence)
  const displayValue = useMemo(() => {
    return editedValue !== undefined ? editedValue : value;
  }, [editedValue, value]);

  // Start editing
  const handleStartEdit = useCallback(() => {
    if (isDisabled || !column.editable) return;
    setIsEditing(true);
  }, [isDisabled, column.editable]);

  // Cancel editing
  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setCurrentValidationError(null);
    globalValidationState.clearCell(resourceId, column.id);
  }, [resourceId, column.id]);

  // Save changes
  const handleSave = useCallback(
    (newValue: JsonValue) => {
      if (!resolutionActions?.saveEdit) {
        onMessage?.('error', 'Unable to save: no edit actions available');
        return;
      }

      // Check for validation errors before saving
      if (currentValidationError) {
        onMessage?.('warning', `Cannot save: ${currentValidationError}`);
        return;
      }

      // Save the edit using existing resolution actions
      const saveResult = resolutionActions.saveEdit(resourceId, newValue, resolvedValue);

      if (saveResult.isSuccess()) {
        setIsEditing(false);
        setCurrentValidationError(null);
        globalValidationState.clearCell(resourceId, column.id);
        onMessage?.('success', `Updated ${column.title} for ${resourceId}`);
      } else {
        onMessage?.('error', `Failed to save: ${saveResult.message}`);
      }
    },
    [resolutionActions, resourceId, resolvedValue, column.id, column.title, currentValidationError, onMessage]
  );

  // Handle value changes during editing
  const handleChange = useCallback((newValue: JsonValue) => {
    // Value changes are handled by the individual cell components
    // This is mainly for consistency with the cell component APIs
  }, []);

  // Handle validation changes
  const handleValidationChange = useCallback(
    (error: string | null) => {
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
      return (
        <CustomEditor
          value={displayValue}
          resourceId={resourceId}
          column={column}
          resolvedValue={resolvedValue}
          isEdited={isEdited}
          editedValue={editedValue}
          onSave={handleSave}
          onCancel={handleCancel}
          disabled={isDisabled}
          className={className}
        />
      );
    }

    // Select built-in cell editor based on cellType
    const cellType = column.cellType || 'string';

    switch (cellType) {
      case 'string':
        return (
          <StringCell
            value={displayValue}
            resourceId={resourceId}
            column={column}
            isEditing={isEditing}
            disabled={isDisabled}
            onChange={handleChange}
            onStartEdit={handleStartEdit}
            onCancel={handleCancel}
            onSave={handleSave}
            onValidationChange={handleValidationChange}
          />
        );

      case 'boolean':
        return (
          <BooleanCell
            value={displayValue}
            resourceId={resourceId}
            column={column}
            disabled={isDisabled}
            onChange={handleChange}
            onSave={handleSave}
            onValidationChange={handleValidationChange}
          />
        );

      case 'tristate':
        return (
          <TriStateCell
            value={displayValue}
            resourceId={resourceId}
            column={column}
            disabled={isDisabled}
            onChange={handleChange}
            onSave={handleSave}
            onValidationChange={handleValidationChange}
          />
        );

      case 'dropdown':
        return (
          <DropdownCell
            value={displayValue}
            resourceId={resourceId}
            column={column}
            isEditing={isEditing}
            disabled={isDisabled}
            onChange={handleChange}
            onStartEdit={handleStartEdit}
            onCancel={handleCancel}
            onSave={handleSave}
            onValidationChange={handleValidationChange}
          />
        );

      case 'custom':
        // Custom cell type but no custom editor provided - fall back to string
        return (
          <StringCell
            value={displayValue}
            resourceId={resourceId}
            column={column}
            isEditing={isEditing}
            disabled={isDisabled}
            onChange={handleChange}
            onStartEdit={handleStartEdit}
            onCancel={handleCancel}
            onSave={handleSave}
            onValidationChange={handleValidationChange}
          />
        );

      default:
        // Fallback to string cell
        return (
          <StringCell
            value={displayValue}
            resourceId={resourceId}
            column={column}
            isEditing={isEditing}
            disabled={isDisabled}
            onChange={handleChange}
            onStartEdit={handleStartEdit}
            onCancel={handleCancel}
            onSave={handleSave}
            onValidationChange={handleValidationChange}
          />
        );
    }
  };

  return (
    <div className={`relative ${className}`}>
      {renderCell()}
      {currentValidationError && <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />}
    </div>
  );
};

/**
 * Utility function to check if the grid has validation errors.
 * This prevents batch operations when there are invalid values.
 * @public
 */
export const hasGridValidationErrors = (): boolean => {
  return globalValidationState.hasErrors;
};

/**
 * Utility function to get all current validation errors.
 * Useful for displaying validation summaries or debugging.
 * @public
 */
export const getAllGridValidationErrors = () => {
  return globalValidationState.getAllErrors();
};

/**
 * Utility function to clear all grid validation errors.
 * Should be called when the grid is reset or data is reloaded.
 * @public
 */
export const clearAllGridValidationErrors = (): void => {
  globalValidationState.clearAll();
};

export default EditableGridCell;
