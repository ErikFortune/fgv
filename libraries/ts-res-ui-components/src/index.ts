// Export orchestrator types (main entry point types)
export type { OrchestratorState, OrchestratorActions } from './types';

// Export utility types that are commonly used across namespaces
export type { Result } from '@fgv/ts-utils';
export type { JsonValue } from '@fgv/ts-json-base';

// Domain-specific types are now available through their respective namespaces:
// - FilterTools: FilterState, FilterActions, FilterViewProps, FilterResult, FilteredResource
// - ResolutionTools: ResolutionState, ResolutionActions, ResolutionViewProps, ResolutionResult, CandidateInfo, ConditionEvaluationResult, EditedResourceInfo
// - ResourceTools: ProcessedResources, ExtendedProcessedResources, ResourceManagerState, ResourceEditorFactory, ResourceEditorResult, ResourceEditorProps, ResourceDetailData
// - ViewStateTools: ViewBaseProps, Message, MessagesWindowProps
// - ImportTools: ImportViewProps, ImportedFile, ImportedDirectory
// - TsResTools: SourceViewProps, CompiledViewProps
// - ZipTools: ImportViewProps and ZIP utilities
// - ConfigurationTools: ConfigurationViewProps
// - GridTools: GridViewProps, MultiGridViewProps, GridColumnDefinition, GridResourceSelector, GridDropdownOption, GridCellValidation
// - ImportTools: ImportedFile, ImportedDirectory

// Export views
export { ImportView } from './components/views/ImportView';
export { SourceView } from './components/views/SourceView';
export { FilterView } from './components/views/FilterView';
export { CompiledView } from './components/views/CompiledView';
export { ResolutionView } from './components/views/ResolutionView';
export { ConfigurationView } from './components/views/ConfigurationView';
export { MessagesWindow } from './components/views/MessagesWindow';
export { GridView } from './components/views/GridView';
export { MultiGridView } from './components/views/GridView/MultiGridView';

// Export orchestrator
export { ResourceOrchestrator } from './components/orchestrator/ResourceOrchestrator';

// Export utilities
export { DownloadUtils } from './utils/downloadHelper';

// Export common components (likely to be used by consumers)
export { ResourceTreeView } from './components/common/ResourceTreeView';
export { ResourceListView } from './components/common/ResourceListView';
export { SourceResourceDetail } from './components/common/SourceResourceDetail';
export { ResolutionResults } from './components/common/ResolutionResults';

// Form components are now available through ConfigurationTools namespace:
// - ConfigurationTools.QualifierTypeEditForm
// - ConfigurationTools.QualifierEditForm
// - ConfigurationTools.ResourceTypeEditForm
// - ConfigurationTools.HierarchyEditor

// QualifierContextControl is now available through ResolutionTools namespace:
// - ResolutionTools.QualifierContextControl

// Resolution and picker components are now available through their respective namespaces:
// - ResolutionTools.EditableJsonView, ResolutionTools.UnifiedChangeControls, ResolutionTools.EditableJsonViewProps
// - PickerTools.ResourcePicker, PickerTools.ResourcePickerProps, PickerTools.ResourceSelection, etc.

// All hooks are now organized within their respective namespaces:
// - useResourceData: ResourceTools.useResourceData (orchestrator data hook)
// - useViewState: ViewStateTools.useViewState (view state and messages)
// - useFilterState: FilterTools.useFilterState (filter management)
// - useResolutionState: ResolutionTools.useResolutionState (resource resolution)
// - useConfigurationState: ConfigurationTools.useConfigurationState (system configuration)

// Export organized tool namespaces
export {
  FilterTools,
  ResolutionTools,
  ConfigurationTools,
  ResourceTools,
  ImportTools,
  TsResTools,
  ZipTools,
  ViewStateTools,
  PickerTools,
  GridTools,
  ObservabilityTools
} from './namespaces';
