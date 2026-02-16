/**
 * Editing packlet - generic editing context hook and toolbar for entity editors.
 *
 * Provides:
 * - IEditable interface for wrappers with undo/redo support
 * - useEditingContext hook for managing editing state with React re-renders
 * - EditingToolbar component with undo/redo/save/cancel buttons
 *
 * @packageDocumentation
 */

export {
  type IEditable,
  type IEditingContext,
  type IEditingContextOptions,
  useEditingContext
} from './useEditingContext';

export { EditingToolbar, type IEditingToolbarProps } from './EditingToolbar';

export { EntityCreateForm, type IEntityCreateFormProps } from './EntityCreateForm';

export { NotesEditor, type INotesEditorProps } from './NotesEditor';

export { UrlsEditor, type IUrlsEditorProps } from './UrlsEditor';

export { useDatalistMatch, type IDatalistSuggestion, type IDatalistMatchResult } from './useDatalistMatch';
