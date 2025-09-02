'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.EditableJsonView = void 0;
const tslib_1 = require('tslib');
const react_1 = tslib_1.__importStar(require('react'));
const json_edit_react_1 = require('json-edit-react');
const outline_1 = require('@heroicons/react/24/outline');
const resolutionEditing_1 = require('../../../utils/resolutionEditing');
/**
 * Interactive JSON editor for modifying resource values during resolution testing.
 *
 * The EditableJsonView component provides a rich JSON editing interface for modifying
 * resource values during resolution testing and analysis. It supports syntax highlighting,
 * validation, and seamless switching between view and edit modes. Changes are tracked
 * and can be applied as new resource candidates with the current resolution context.
 *
 * @example
 * ```tsx
 * import { ResolutionTools } from '@fgv/ts-res-ui-components';
 *
 * // Basic usage with resource data
 * const ResourceEditor = ({ resource }) => {
 *   const [edits, setEdits] = useState({});
 *
 *   const handleSave = (resourceId, editedValue, originalValue) => {
 *     setEdits(prev => ({
 *       ...prev,
 *       [resourceId]: { editedValue, originalValue, timestamp: new Date() }
 *     }));
 *   };
 *
 *   const handleCancel = (resourceId) => {
 *     setEdits(prev => {
 *       const newEdits = { ...prev };
 *       delete newEdits[resourceId];
 *       return newEdits;
 *     });
 *   };
 *
 *   return (
 *     <ResolutionTools.EditableJsonView
 *       resourceId={resource.id}
 *       value={resource.resolvedValue}
 *       isEdited={edits[resource.id] !== undefined}
 *       editedValue={edits[resource.id]?.editedValue}
 *       onSave={handleSave}
 *       onCancel={handleCancel}
 *     />
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Advanced usage with validation and error handling
 * const AdvancedResourceEditor = () => {
 *   const [selectedResource, setSelectedResource] = useState('welcome-message');
 *   const [pendingEdits, setPendingEdits] = useState({});
 *   const [errors, setErrors] = useState({});
 *
 *   const handleSaveEdit = async (resourceId, editedValue, originalValue) => {
 *     try {
 *       // Validate the edited content
 *       const validation = await validateResourceValue(editedValue, resourceId);
 *       if (!validation.isValid) {
 *         setErrors(prev => ({ ...prev, [resourceId]: validation.errors }));
 *         return;
 *       }
 *
 *       // Save the edit
 *       setPendingEdits(prev => ({
 *         ...prev,
 *         [resourceId]: {
 *           editedValue,
 *           originalValue,
 *           timestamp: new Date(),
 *           metadata: { editedBy: getCurrentUser() }
 *         }
 *       }));
 *
 *       // Clear any previous errors
 *       setErrors(prev => {
 *         const newErrors = { ...prev };
 *         delete newErrors[resourceId];
 *         return newErrors;
 *       });
 *
 *       showSuccess(`Changes saved for ${resourceId}`);
 *     } catch (error) {
 *       showError(`Failed to save changes: ${error.message}`);
 *     }
 *   };
 *
 *   return (
 *     <div className="resource-editor">
 *       <ResolutionTools.EditableJsonView
 *         resourceId={selectedResource}
 *         value={getResourceValue(selectedResource)}
 *         isEdited={pendingEdits[selectedResource] !== undefined}
 *         editedValue={pendingEdits[selectedResource]?.editedValue}
 *         onSave={handleSaveEdit}
 *         onCancel={(resourceId) => {
 *           setPendingEdits(prev => {
 *             const newEdits = { ...prev };
 *             delete newEdits[resourceId];
 *             return newEdits;
 *           });
 *         }}
 *         disabled={isSystemLocked}
 *         className="border-2 border-blue-200"
 *       />
 *
 *       {errors[selectedResource] && (
 *         <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded">
 *           <h4 className="text-red-800 font-medium">Validation Errors:</h4>
 *           <ul className="list-disc list-inside text-red-700">
 *             {errors[selectedResource].map((error, i) => (
 *               <li key={i}>{error}</li>
 *             ))}
 *           </ul>
 *         </div>
 *       )}
 *     </div>
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Integration with resolution workflow
 * const ResolutionWorkflow = () => {
 *   const { state, actions } = useResolutionState(processedResources);
 *
 *   return (
 *     <div className="resolution-workflow">
 *       <div className="resource-selection">
 *         <PickerTools.ResourcePicker
 *           resources={processedResources}
 *           selectedResourceId={state.selectedResourceId}
 *           onResourceSelect={(selection) => actions.selectResource(selection.resourceId)}
 *         />
 *       </div>
 *
 *       {state.selectedResourceId && (
 *         <div className="resource-editing">
 *           <ResolutionTools.EditableJsonView
 *             resourceId={state.selectedResourceId}
 *             value={state.resolutionResult?.composedValue}
 *             isEdited={actions.hasEdit(state.selectedResourceId)}
 *             editedValue={actions.getEditedValue(state.selectedResourceId)}
 *             onSave={actions.saveEdit}
 *             onCancel={(resourceId) => {
 *               const newEdits = new Map(state.editedResources);
 *               newEdits.delete(resourceId);
 *               // Update state...
 *             }}
 *           />
 *
 *           <ResolutionTools.UnifiedChangeControls
 *             editCount={state.editedResources.size}
 *             isApplying={state.isApplyingEdits}
 *             addCount={state.pendingResources.size}
 *             deleteCount={state.pendingResourceDeletions.size}
 *             onApplyAll={actions.applyPendingResources}
 *             onDiscardAll={() => { actions.clearEdits(); actions.discardPendingResources(); }}
 *           />
 *         </div>
 *       )}
 *     </div>
 *   );
 * };
 * ```
 *
 * @public
 */
const EditableJsonView = ({
  value,
  resourceId,
  isEdited = false,
  editedValue,
  onSave,
  onCancel,
  disabled = false,
  className = ''
}) => {
  const [isEditing, setIsEditing] = (0, react_1.useState)(false);
  const [currentEditValue, setCurrentEditValue] = (0, react_1.useState)(null);
  const [validationErrors, setValidationErrors] = (0, react_1.useState)([]);
  // The display value is either the edited value or the original value
  const displayValue = (0, react_1.useMemo)(() => {
    if (isEdited && editedValue !== undefined) {
      return editedValue;
    }
    return value;
  }, [value, editedValue, isEdited]);
  // Handle starting an edit
  const handleStartEdit = (0, react_1.useCallback)(() => {
    if (disabled) return;
    setCurrentEditValue(displayValue);
    setIsEditing(true);
    setValidationErrors([]);
  }, [displayValue, disabled]);
  // Handle canceling an edit
  const handleCancelEdit = (0, react_1.useCallback)(() => {
    setIsEditing(false);
    setCurrentEditValue(null);
    setValidationErrors([]);
    onCancel?.(resourceId);
  }, [resourceId, onCancel]);
  // Handle saving an edit
  const handleSaveEdit = (0, react_1.useCallback)(() => {
    if (!onSave || currentEditValue === null) return;
    // Validate the edited value
    const validation = (0, resolutionEditing_1.validateEditedResource)(currentEditValue);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }
    // Save the edit
    onSave(resourceId, currentEditValue, value);
    setIsEditing(false);
    setCurrentEditValue(null);
    setValidationErrors([]);
  }, [resourceId, currentEditValue, value, onSave]);
  // Handle changes in the JSON editor
  const handleJsonChange = (0, react_1.useCallback)(
    (newValue) => {
      setCurrentEditValue(newValue);
      // Clear validation errors when user starts typing
      if (validationErrors.length > 0) {
        setValidationErrors([]);
      }
    },
    [validationErrors]
  );
  // JSON editor configuration
  const jsonEditConfig = (0, react_1.useMemo)(
    () => ({
      minHeight: '200px',
      maxHeight: '400px',
      style: {
        container: {
          backgroundColor: '#f9fafb',
          border: '1px solid #d1d5db',
          borderRadius: '0.375rem',
          fontFamily:
            'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
        },
        key: {
          color: '#1f2937',
          fontWeight: '500'
        },
        string: {
          color: '#059669'
        },
        number: {
          color: '#dc2626'
        },
        boolean: {
          color: '#7c3aed'
        },
        null: {
          color: '#6b7280'
        }
      },
      enableHighlight: true,
      enableClipboard: true
    }),
    []
  );
  return react_1.default.createElement(
    'div',
    { className: `bg-white rounded-lg border ${className}` },
    react_1.default.createElement(
      'div',
      { className: 'flex items-center justify-between p-3 border-b bg-gray-50' },
      react_1.default.createElement(
        'div',
        { className: 'flex items-center space-x-2' },
        react_1.default.createElement(
          'h4',
          { className: 'text-sm font-semibold text-gray-900' },
          'Resource Content'
        ),
        isEdited &&
          react_1.default.createElement(
            'span',
            {
              className:
                'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800'
            },
            'Edited'
          )
      ),
      !isEditing &&
        react_1.default.createElement(
          'button',
          {
            onClick: handleStartEdit,
            disabled: disabled,
            className:
              'inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed',
            title: 'Edit resource content'
          },
          react_1.default.createElement(outline_1.PencilIcon, { className: 'h-4 w-4 mr-1' }),
          'Edit'
        ),
      isEditing &&
        react_1.default.createElement(
          'div',
          { className: 'flex items-center space-x-2' },
          react_1.default.createElement(
            'button',
            {
              onClick: handleSaveEdit,
              disabled: validationErrors.length > 0,
              className:
                'inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed',
              title: 'Save changes'
            },
            react_1.default.createElement(outline_1.CheckIcon, { className: 'h-4 w-4 mr-1' }),
            'Save'
          ),
          react_1.default.createElement(
            'button',
            {
              onClick: handleCancelEdit,
              className:
                'inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
              title: 'Cancel changes'
            },
            react_1.default.createElement(outline_1.XMarkIcon, { className: 'h-4 w-4 mr-1' }),
            'Cancel'
          )
        )
    ),
    validationErrors.length > 0 &&
      react_1.default.createElement(
        'div',
        { className: 'p-3 border-b bg-red-50' },
        react_1.default.createElement(
          'div',
          { className: 'text-sm text-red-800' },
          react_1.default.createElement('p', { className: 'font-medium mb-1' }, 'Validation Errors:'),
          react_1.default.createElement(
            'ul',
            { className: 'list-disc list-inside space-y-1' },
            validationErrors.map((error, index) => react_1.default.createElement('li', { key: index }, error))
          )
        )
      ),
    react_1.default.createElement(
      'div',
      { className: 'p-3' },
      isEditing
        ? react_1.default.createElement(json_edit_react_1.JsonEditor, {
            data: currentEditValue,
            setData: handleJsonChange,
            ...jsonEditConfig
          })
        : react_1.default.createElement(
            'pre',
            {
              className:
                'text-sm font-mono text-gray-800 bg-gray-50 p-3 rounded border overflow-x-auto whitespace-pre-wrap'
            },
            JSON.stringify(displayValue, null, 2)
          )
    ),
    isEditing &&
      react_1.default.createElement(
        'div',
        { className: 'px-3 pb-3' },
        react_1.default.createElement(
          'p',
          { className: 'text-xs text-gray-500' },
          'Edit the JSON content above. Changes will be saved as a new candidate with the current resolution context.'
        )
      )
  );
};
exports.EditableJsonView = EditableJsonView;
//# sourceMappingURL=EditableJsonView.js.map
