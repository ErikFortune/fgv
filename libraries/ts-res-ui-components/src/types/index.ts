import { Result } from '@fgv/ts-utils';
import { ResourceJson, Config, Bundle, Resources, Runtime } from '@fgv/ts-res';

// Message system types
export interface Message {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  timestamp: Date;
}

// Filter state management
export interface FilterState {
  enabled: boolean;
  values: Record<string, string | undefined>;
  appliedValues: Record<string, string | undefined>;
  hasPendingChanges: boolean;
  reduceQualifiers: boolean;
}

export interface FilterActions {
  updateFilterEnabled: (enabled: boolean) => void;
  updateFilterValues: (values: Record<string, string | undefined>) => void;
  applyFilterValues: () => void;
  resetFilterValues: () => void;
  updateReduceQualifiers: (reduceQualifiers: boolean) => void;
}

// Resource processing types
export interface ProcessedResources {
  system: {
    resourceManager: Resources.ResourceManagerBuilder | Runtime.IResourceManager; // Support both builder and runtime manager
    qualifierTypes: any;
    qualifiers: any;
    resourceTypes: any;
    importManager: any;
    contextQualifierProvider: Runtime.ValidatingSimpleContextQualifierProvider;
  };
  compiledCollection: ResourceJson.Compiled.ICompiledResourceCollection;
  compiledResourceCollectionManager: Runtime.CompiledResourceCollection | null; // Runtime manager for compiled collection
  resolver: Runtime.ResourceResolver;
  resourceCount: number;
  summary: {
    totalResources: number;
    resourceIds: string[];
    errorCount: number;
    warnings: string[];
  };
}

// Extended processed resources with additional metadata
export interface ExtendedProcessedResources extends ProcessedResources {
  activeConfiguration?: Config.Model.ISystemConfiguration | null;
  isLoadedFromBundle?: boolean;
  bundleMetadata?: Bundle.IBundleMetadata | null;
}

// Resource manager state
export interface ResourceManagerState {
  isProcessing: boolean;
  processedResources: ExtendedProcessedResources | null;
  error: string | null;
  hasProcessedData: boolean;
  activeConfiguration: Config.Model.ISystemConfiguration | null;
  isLoadedFromBundle: boolean;
  bundleMetadata: Bundle.IBundleMetadata | null;
}

// File import types
export interface ImportedFile {
  name: string;
  path?: string;
  content: string;
  type?: string;
}

export interface ImportedDirectory {
  name: string;
  path?: string;
  files: ImportedFile[];
  subdirectories?: ImportedDirectory[];
}

// Component prop types for each view
export interface ViewBaseProps {
  onMessage?: (type: Message['type'], message: string) => void;
  className?: string;
}

export interface ImportViewProps extends ViewBaseProps {
  onImport?: (data: ImportedDirectory | ImportedFile[]) => void;
  onBundleImport?: (bundle: Bundle.IBundle) => void;
  acceptedFileTypes?: string[];
}

export interface SourceViewProps extends ViewBaseProps {
  resources?: ExtendedProcessedResources | null;
  selectedResourceId?: string | null;
  onResourceSelect?: (resourceId: string) => void;
  onExport?: (data: any, type: 'json') => void;
}

export interface FilterViewProps extends ViewBaseProps {
  resources?: ProcessedResources | null;
  filterState: FilterState;
  filterActions: FilterActions;
  filterResult?: FilterResult | null;
  onFilterResult?: (result: FilterResult | null) => void;
}

export interface CompiledViewProps extends ViewBaseProps {
  resources?: ExtendedProcessedResources | null;
  filterState?: FilterState;
  filterResult?: FilterResult | null;
  useNormalization?: boolean;
  onExport?: (data: any, type: 'json' | 'bundle') => void;
}

export interface ResolutionViewProps extends ViewBaseProps {
  resources?: ProcessedResources | null;
  filterState?: FilterState;
  filterResult?: FilterResult | null;
  resolutionState?: ResolutionState;
  resolutionActions?: ResolutionActions;
  availableQualifiers?: string[];
}

// Resolution types
export interface ResolutionState {
  contextValues: Record<string, string | undefined>;
  pendingContextValues: Record<string, string | undefined>;
  selectedResourceId: string | null;
  currentResolver: Runtime.ResourceResolver | null;
  resolutionResult: ResolutionResult | null;
  viewMode: 'composed' | 'best' | 'all' | 'raw';
  hasPendingChanges: boolean;
}

export interface ResolutionActions {
  updateContextValue: (qualifierName: string, value: string | undefined) => void;
  applyContext: () => void;
  selectResource: (resourceId: string) => void;
  setViewMode: (mode: 'composed' | 'best' | 'all' | 'raw') => void;
  resetCache: () => void;
}

export interface ResolutionResult {
  success: boolean;
  resourceId: string;
  resource?: Runtime.IResource;
  bestCandidate?: Runtime.IResourceCandidate;
  allCandidates?: readonly Runtime.IResourceCandidate[];
  candidateDetails?: CandidateInfo[];
  composedValue?: any;
  error?: string;
}

export interface CandidateInfo {
  candidate: Runtime.IResourceCandidate;
  conditionSetKey: string | null;
  candidateIndex: number;
  matched: boolean;
  matchType: 'match' | 'matchAsDefault' | 'noMatch';
  isDefaultMatch: boolean;
  conditionEvaluations?: ConditionEvaluationResult[];
}

export interface ConditionEvaluationResult {
  qualifierName: string;
  qualifierValue: any;
  conditionValue: any;
  operator: string;
  score: number;
  matched: boolean;
  matchType: 'match' | 'matchAsDefault' | 'noMatch';
  scoreAsDefault?: number;
  conditionIndex: number;
}

export interface ConfigurationViewProps extends ViewBaseProps {
  configuration?: Config.Model.ISystemConfiguration | null;
  onConfigurationChange?: (config: Config.Model.ISystemConfiguration) => void;
  onSave?: (config: Config.Model.ISystemConfiguration) => void;
  hasUnsavedChanges?: boolean;
}

export interface ZipLoaderViewProps extends ViewBaseProps {
  zipFileUrl?: string;
  zipPath?: string;
  onLoadComplete?: (resources: ProcessedResources) => void;
}

// Resource detail types for SourceView
export interface ResourceDetailData {
  id: string;
  resourceType: string;
  candidateCount: number;
  candidates: Array<{
    json: any;
    conditions: Array<{
      qualifier: string;
      operator: string;
      value: string;
      priority: number;
      scoreAsDefault?: number;
    }>;
    isPartial: boolean;
    mergeMethod: string;
  }>;
}

export interface FilteredResource {
  id: string;
  originalCandidateCount: number;
  filteredCandidateCount: number;
  hasWarning: boolean;
}

// Filter result type
export interface FilterResult {
  success: boolean;
  processedResources?: ProcessedResources;
  filteredResources?: FilteredResource[];
  warnings?: string[];
  error?: string;
}

// Orchestrator types
export interface OrchestratorState {
  resources: ExtendedProcessedResources | null;
  configuration: Config.Model.ISystemConfiguration | null;
  filterState: FilterState;
  filterResult: FilterResult | null;
  resolutionState: ResolutionState;
  selectedResourceId: string | null;
  isProcessing: boolean;
  error: string | null;
  messages: Message[];
}

export interface OrchestratorActions {
  // Resource management
  importDirectory: (directory: ImportedDirectory) => Promise<void>;
  importFiles: (files: ImportedFile[]) => Promise<void>;
  importBundle: (bundle: Bundle.IBundle) => Promise<void>;
  clearResources: () => void;

  // Configuration management
  updateConfiguration: (config: Config.Model.ISystemConfiguration) => void;
  applyConfiguration: (config: Config.Model.ISystemConfiguration) => void;

  // Filter management
  updateFilterState: (state: Partial<FilterState>) => void;
  applyFilter: () => Promise<FilterResult | null>;
  resetFilter: () => void;

  // Resolution management
  updateResolutionContext: (qualifierName: string, value: string | undefined) => void;
  applyResolutionContext: () => void;
  selectResourceForResolution: (resourceId: string) => void;
  setResolutionViewMode: (mode: 'composed' | 'best' | 'all' | 'raw') => void;
  resetResolutionCache: () => void;

  // UI state management
  selectResource: (resourceId: string | null) => void;
  addMessage: (type: Message['type'], message: string) => void;
  clearMessages: () => void;

  // Resource resolution
  resolveResource: (resourceId: string, context?: Record<string, string>) => Promise<Result<any>>;
}

// Export utility types
export type { Result } from '@fgv/ts-utils';
