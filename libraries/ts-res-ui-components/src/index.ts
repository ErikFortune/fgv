// Export orchestrator types (main entry point types)
export type { OrchestratorState, OrchestratorActions } from './types';

// Export utility types that are commonly used across namespaces
export type { Result } from '@fgv/ts-utils';
export type { JsonValue } from '@fgv/ts-json-base';

// Domain-specific types are now available through their respective namespaces:
// - FilterTools: FilterState, FilterActions, FilterViewProps, FilterResult, FilteredResource
// - ResolutionTools: ResolutionState, ResolutionActions, ResolutionViewProps, ResolutionResult, CandidateInfo, ConditionEvaluationResult, EditedResourceInfo
// - ResourceTools: ProcessedResources, ExtendedProcessedResources, ResourceManagerState, ResourceEditorFactory, ResourceEditorResult, ResourceEditorProps, ResourceDetailData
// - ViewTools: ViewBaseProps, ImportViewProps, SourceViewProps, CompiledViewProps, ZipLoaderViewProps, Message, MessagesWindowProps
// - ConfigurationTools: ConfigurationViewProps
// - FileTools: ImportedFile, ImportedDirectory

// Export views
export { ImportView } from './components/views/ImportView';
export { SourceView } from './components/views/SourceView';
export { FilterView } from './components/views/FilterView';
export { CompiledView } from './components/views/CompiledView';
export { ResolutionView } from './components/views/ResolutionView';
export { ZipLoaderView } from './components/views/ZipLoaderView';
export { ConfigurationView } from './components/views/ConfigurationView';
export { MessagesWindow } from './components/views/MessagesWindow';

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

// All hooks are now organized within their respective namespaces:
// - useResourceData: ResourceTools.useResourceData (orchestrator data hook)
// - useViewState: ViewTools.useViewState (view state and messages)
// - useFilterState: FilterTools.useFilterState (filter management)
// - useResolutionState: ResolutionTools.useResolutionState (resource resolution)
// - useConfigurationState: ConfigurationTools.useConfigurationState (system configuration)

// Export organized tool namespaces
export {
  FilterTools,
  ResolutionTools,
  ConfigurationTools,
  ResourceTools,
  FileTools,
  TsResTools,
  ZipTools,
  ViewTools
} from './namespaces';
