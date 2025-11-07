// Export orchestrator types (main entry point types)
export type { IOrchestratorState, IOrchestratorActions, IResolutionActions } from './types';

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

// Browser entry point - re-exports everything from main index
export * from './index';
