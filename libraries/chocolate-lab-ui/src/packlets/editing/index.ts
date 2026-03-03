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

export {
  ChangeSummaryIcons,
  type IChangeIndicator,
  type IChangeSummaryIconsProps
} from './ChangeSummaryIcons';

export { EntityCreateForm, type IEntityCreateFormProps } from './EntityCreateForm';

export { NotesEditor, type INotesEditorProps } from './NotesEditor';

export { UrlsEditor, type IUrlsEditorProps } from './UrlsEditor';

export {
  EntityReferenceScanner,
  type IEntityReferenceHit,
  type IReferenceScanResult
} from './referenceScanner';

export {
  useAiAssist,
  type IAiAssistAction,
  type IAiAssistResult,
  type IUseAiAssistResult
} from './useAiAssist';

export { getWritableCollectionOptions } from './writableCollections';

export { AiAssistNameDialog, type IAiAssistNameDialogProps } from './AiAssistNameDialog';

export {
  useEntityMutation,
  createSetInMutableCollection,
  type IEditableEntityCollection,
  type MutableCollectionEntryWithSet,
  type ISetInMutableCollectionFactoryOptions,
  type IEntityMutationOptions,
  type ICreateEntityMutationParams,
  type ISaveEntityMutationParams,
  type IEntityMutationActions
} from './useEntityMutation';

export { useClipboardJsonImport, type IClipboardJsonImportOptions } from './useClipboardJsonImport';

export { ReadOnlyEditGate, type IReadOnlyEditGateProps } from './ReadOnlyEditGate';
