// Export types
export * from './types';
export type { ResourceEditorFactory, ResourceEditorResult, ResourceEditorProps } from './types';

// Export views
export { ImportView } from './components/views/ImportView';
export { SourceView } from './components/views/SourceView';
export { FilterView } from './components/views/FilterView';
export { CompiledView } from './components/views/CompiledView';
export { ResolutionView } from './components/views/ResolutionView';
export { ZipLoaderView } from './components/views/ZipLoaderView';
export { ConfigurationView } from './components/views/ConfigurationView';

// Export orchestrator
export { ResourceOrchestrator } from './components/orchestrator/ResourceOrchestrator';

// Export forms
export { QualifierTypeEditForm } from './components/forms/QualifierTypeEditForm';
export { QualifierEditForm } from './components/forms/QualifierEditForm';
export { ResourceTypeEditForm } from './components/forms/ResourceTypeEditForm';
export { HierarchyEditor } from './components/forms/HierarchyEditor';

// Export common components
export { ResourceTreeView } from './components/common/ResourceTreeView';
export { ResourceListView } from './components/common/ResourceListView';
export { QualifierContextControl } from './components/common/QualifierContextControl';
export { SourceResourceDetail } from './components/common/SourceResourceDetail';
export { ResolutionResults } from './components/common/ResolutionResults';

// Export resolution components
export { EditableJsonView } from './components/views/ResolutionView/EditableJsonView';
export { ResolutionEditControls } from './components/views/ResolutionView/ResolutionEditControls';
export type { EditableJsonViewProps } from './components/views/ResolutionView/EditableJsonView';

// Export pickers
export { ResourcePicker } from './components/pickers/ResourcePicker';
export type {
  ResourcePickerProps,
  ResourceSelection,
  ResourceAnnotations,
  ResourceAnnotation,
  PendingResource
} from './components/pickers/ResourcePicker/types';

// Export hooks
export { useResourceData } from './hooks/useResourceData';
export { useFilterState } from './hooks/useFilterState';
export { useViewState } from './hooks/useViewState';
export { useResolutionState } from './hooks/useResolutionState';
export { useConfigurationState } from './hooks/useConfigurationState';

// Export organized helper namespaces
export {
  FilterHelpers,
  ResolutionHelpers,
  ConfigurationHelpers,
  FileHelpers,
  TsResHelpers,
  ZipHelpers
} from './namespaces';
