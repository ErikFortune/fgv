import { Result } from '@fgv/ts-utils';
import {
  ResourceJson,
  Config,
  Bundle,
  Resources,
  Runtime,
  QualifierTypes,
  Qualifiers,
  ResourceTypes,
  Import
} from '@fgv/ts-res';
import { JsonValue } from '@fgv/ts-json-base';

/**
 * Represents a user-facing message with type classification and timestamp.
 * Used throughout the UI components for displaying feedback to users.
 *
 * @public
 */
export interface Message {
  /** Unique identifier for the message */
  id: string;
  /** Classification of the message for UI styling and behavior */
  type: 'info' | 'warning' | 'error' | 'success';
  /** The text content of the message */
  message: string;
  /** When the message was created */
  timestamp: Date;
}

/**
 * Represents the current state of resource filtering.
 * Tracks filter configuration, values, and application state.
 *
 * @public
 */
export interface FilterState {
  /** Whether filtering is currently enabled */
  enabled: boolean;
  /** Current filter values being edited (not yet applied) */
  values: Record<string, string | undefined>;
  /** Filter values that have been applied to the resource manager */
  appliedValues: Record<string, string | undefined>;
  /** Whether there are unsaved changes in the filter values */
  hasPendingChanges: boolean;
  /** Whether to reduce qualifiers when filtering (removes unused qualifier dimensions) */
  reduceQualifiers: boolean;
}

/**
 * Actions available for managing filter state.
 * Provides methods for updating all aspects of resource filtering.
 *
 * @public
 */
export interface FilterActions {
  /** Enable or disable filtering */
  updateFilterEnabled: (enabled: boolean) => void;
  /** Update filter values (does not apply them until applyFilterValues is called) */
  updateFilterValues: (values: Record<string, string | undefined>) => void;
  /** Apply current filter values to create a filtered resource manager */
  applyFilterValues: () => void;
  /** Reset filter values to their applied state (discards pending changes) */
  resetFilterValues: () => void;
  /** Enable or disable qualifier reduction during filtering */
  updateReduceQualifiers: (reduceQualifiers: boolean) => void;
}

/**
 * Represents a fully processed ts-res system ready for use.
 * Contains both the runtime system components and the compiled resource collection.
 * This is the primary data structure used by all UI components.
 *
 * @public
 */
export interface ProcessedResources {
  /** Core ts-res system components */
  system: {
    /** Primary resource manager for building and managing resources */
    resourceManager: Resources.ResourceManagerBuilder;
    /** Collection of qualifier type definitions */
    qualifierTypes: QualifierTypes.ReadOnlyQualifierTypeCollector;
    /** Collection of qualifier declarations */
    qualifiers: Qualifiers.IReadOnlyQualifierCollector;
    /** Collection of resource type definitions */
    resourceTypes: ResourceTypes.ReadOnlyResourceTypeCollector;
    /** Manager for handling resource imports */
    importManager: Import.ImportManager;
    /** Provider for validating and managing runtime context */
    contextQualifierProvider: Runtime.ValidatingSimpleContextQualifierProvider;
  };
  /** Compiled version of the resource collection for efficient resolution */
  compiledCollection: ResourceJson.Compiled.ICompiledResourceCollection;
  /** Resource resolver for runtime resource resolution */
  resolver: Runtime.ResourceResolver;
  /** Total count of resources in the system */
  resourceCount: number;
  /** Summary information about the resource system */
  summary: {
    /** Total number of resources */
    totalResources: number;
    /** Array of all resource identifiers */
    resourceIds: string[];
    /** Number of errors encountered during processing */
    errorCount: number;
    /** Array of warning messages from processing */
    warnings: string[];
  };
}

/**
 * Extended processed resources with additional metadata and context.
 * Includes information about source configuration and bundle loading.
 *
 * @public
 */
export interface ExtendedProcessedResources extends ProcessedResources {
  /** The configuration used to create this resource system */
  activeConfiguration?: Config.Model.ISystemConfiguration | null;
  /** Whether this system was loaded from a bundle file */
  isLoadedFromBundle?: boolean;
  /** Metadata from the bundle file, if loaded from bundle */
  bundleMetadata?: Bundle.IBundleMetadata | null;
}

/**
 * Represents the current state of the resource manager.
 * Tracks processing status, data, and any errors.
 *
 * @public
 */
export interface ResourceManagerState {
  /** Whether the system is currently processing resources */
  isProcessing: boolean;
  /** The processed resource system, or null if not yet processed */
  processedResources: ExtendedProcessedResources | null;
  /** Current error message, or null if no error */
  error: string | null;
  /** Whether any resource data has been successfully processed */
  hasProcessedData: boolean;
  /** The active system configuration */
  activeConfiguration: Config.Model.ISystemConfiguration | null;
  /** Whether the current data was loaded from a bundle */
  isLoadedFromBundle: boolean;
  /** Bundle metadata if loaded from bundle */
  bundleMetadata: Bundle.IBundleMetadata | null;
}

/**
 * Represents a file imported into the system.
 * Used for handling individual resource files and configurations.
 *
 * @public
 */
export interface ImportedFile {
  /** Name of the file */
  name: string;
  /** Optional file path within the import structure */
  path?: string;
  /** Text content of the file */
  content: string;
  /** MIME type or file type identifier */
  type?: string;
}

/**
 * Represents a directory structure imported into the system.
 * Supports nested directory hierarchies with files and subdirectories.
 *
 * @public
 */
export interface ImportedDirectory {
  /** Name of the directory */
  name: string;
  /** Optional directory path within the import structure */
  path?: string;
  /** Files contained in this directory */
  files: ImportedFile[];
  /** Nested subdirectories */
  subdirectories?: ImportedDirectory[];
}

/**
 * Base properties shared by all view components.
 * Provides common functionality for messaging and styling.
 *
 * @public
 */
export interface ViewBaseProps {
  /** Callback for displaying messages to the user */
  onMessage?: (type: Message['type'], message: string) => void;
  /** Additional CSS class names for styling */
  className?: string;
}

/**
 * Props for the ImportView component.
 * Handles importing resource configurations and bundles.
 *
 * @public
 */
export interface ImportViewProps extends ViewBaseProps {
  /** Callback when resource files/directories are imported */
  onImport?: (data: ImportedDirectory | ImportedFile[]) => void;
  /** Callback when a bundle file is imported */
  onBundleImport?: (bundle: Bundle.IBundle) => void;
  /** Callback when a ZIP file is imported with optional configuration */
  onZipImport?: (zipFile: File, config?: Config.Model.ISystemConfiguration) => void;
  /** File types accepted for import */
  acceptedFileTypes?: string[];
}

/**
 * Props for the SourceView component.
 * Displays and manages the source resource collection.
 *
 * @public
 */
export interface SourceViewProps extends ViewBaseProps {
  /** The processed resource system to display */
  resources?: ExtendedProcessedResources | null;
  /** Currently selected resource ID for detailed view */
  selectedResourceId?: string | null;
  /** Callback when a resource is selected */
  onResourceSelect?: (resourceId: string) => void;
  /** Callback when exporting resource collection data */
  onExport?: (data: unknown, type: 'json') => void;
}

/**
 * Props for the FilterView component.
 * Provides resource filtering functionality.
 *
 * @public
 */
export interface FilterViewProps extends ViewBaseProps {
  /** The resource system to filter */
  resources?: ProcessedResources | null;
  /** Current state of the filter configuration */
  filterState: FilterState;
  /** Actions for managing filter state */
  filterActions: FilterActions;
  /** Result of applying the filter */
  filterResult?: FilterResult | null;
  /** Callback when filter results change */
  onFilterResult?: (result: FilterResult | null) => void;
}

/**
 * Props for the CompiledView component.
 * Displays the compiled resource collection structure.
 *
 * @public
 */
export interface CompiledViewProps extends ViewBaseProps {
  /** The resource system to display */
  resources?: ExtendedProcessedResources | null;
  /** Optional filter state for filtered views */
  filterState?: FilterState;
  /** Result of filtering if applied */
  filterResult?: FilterResult | null;
  /** Whether to use normalization in display */
  useNormalization?: boolean;
  /** Callback for exporting compiled data or bundles */
  onExport?: (
    data: ResourceJson.Compiled.ICompiledResourceCollection | Bundle.IBundle,
    type: 'json' | 'bundle'
  ) => void;
}

/**
 * Result of attempting to create a resource editor for a specific resource.
 * Used by ResourceEditorFactory to provide type-specific editors.
 *
 * @public
 */
export type ResourceEditorResult =
  | {
      /** Indicates whether the factory was able to create an editor for the resource */
      success: true;
      /** The React component to render for editing this resource */
      editor: React.ComponentType<ResourceEditorProps>;
    }
  | {
      /** Indicates the factory could not create an editor for this resource */
      success: false;
      /** Optional message explaining why no editor could be created */
      message?: string;
    };

/**
 * Props that will be passed to custom resource editors created by ResourceEditorFactory.
 * Custom editors should implement this interface to be compatible with ResolutionView.
 *
 * @public
 */
export interface ResourceEditorProps {
  /** The original JSON value to edit */
  value: any;
  /** The resource ID for tracking edits */
  resourceId: string;
  /** Whether this resource has been edited */
  isEdited?: boolean;
  /** The current edited value if any */
  editedValue?: any;
  /** Callback when the user saves an edit */
  onSave?: (resourceId: string, editedValue: any, originalValue: any) => void;
  /** Callback when the user cancels an edit */
  onCancel?: (resourceId: string) => void;
  /** Whether editing is currently disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Factory interface for creating type-specific resource editors.
 * Allows ResolutionView to provide custom editing experiences for different resource types.
 *
 * @public
 */
export interface ResourceEditorFactory {
  /**
   * Attempts to create a resource editor for the given resource.
   *
   * @param resourceId - The ID of the resource to edit
   * @param resourceType - The type/key of the resource
   * @param value - The current value of the resource
   * @returns ResourceEditorResult indicating success/failure and the editor component or error message
   */
  createEditor(resourceId: string, resourceType: string, value: any): ResourceEditorResult;
}

/**
 * Props for the ResolutionView component.
 * Provides resource resolution testing and debugging.
 *
 * @public
 */
export interface ResolutionViewProps extends ViewBaseProps {
  /** The resource system for resolution testing */
  resources?: ProcessedResources | null;
  /** Optional filter state */
  filterState?: FilterState;
  /** Filter results if applied */
  filterResult?: FilterResult | null;
  /** Current resolution testing state */
  resolutionState?: ResolutionState;
  /** Actions for managing resolution state */
  resolutionActions?: ResolutionActions;
  /** Available qualifiers for context building */
  availableQualifiers?: string[];
  /** Optional factory for creating type-specific resource editors */
  resourceEditorFactory?: ResourceEditorFactory;
}

/**
 * Information about a resource being edited in the resolution view.
 * Tracks changes to resource values and states.
 *
 * @public
 */
export interface EditedResourceInfo {
  /** Unique identifier of the resource being edited */
  resourceId: string;
  originalValue: JsonValue;
  editedValue: JsonValue;
  timestamp: Date;
}

// Resolution types
/** @public */
export interface ResolutionState {
  contextValues: Record<string, string | undefined>;
  pendingContextValues: Record<string, string | undefined>;
  selectedResourceId: string | null;
  currentResolver: Runtime.ResourceResolver | null;
  resolutionResult: ResolutionResult | null;
  viewMode: 'composed' | 'best' | 'all' | 'raw';
  hasPendingChanges: boolean;
  // Edit state
  editedResources: Map<string, JsonValue>;
  hasUnsavedEdits: boolean;
  isApplyingEdits: boolean;
}

/** @public */
export interface ResolutionActions {
  updateContextValue: (qualifierName: string, value: string | undefined) => void;
  applyContext: () => void;
  selectResource: (resourceId: string) => void;
  setViewMode: (mode: 'composed' | 'best' | 'all' | 'raw') => void;
  resetCache: () => void;
  // Edit actions
  saveEdit: (resourceId: string, editedValue: JsonValue, originalValue?: JsonValue) => void;
  getEditedValue: (resourceId: string) => JsonValue | undefined;
  hasEdit: (resourceId: string) => boolean;
  clearEdits: () => void;
  applyEdits: () => Promise<void>;
  discardEdits: () => void;
}

/** @public */
export interface ResolutionResult {
  success: boolean;
  resourceId: string;
  resource?: Runtime.IResource;
  bestCandidate?: Runtime.IResourceCandidate;
  allCandidates?: readonly Runtime.IResourceCandidate[];
  candidateDetails?: CandidateInfo[];
  composedValue?: JsonValue;
  error?: string;
}

/** @public */
export interface CandidateInfo {
  candidate: Runtime.IResourceCandidate;
  conditionSetKey: string | null;
  candidateIndex: number;
  matched: boolean;
  matchType: 'match' | 'matchAsDefault' | 'noMatch';
  isDefaultMatch: boolean;
  conditionEvaluations?: ConditionEvaluationResult[];
}

/** @public */
export interface ConditionEvaluationResult {
  qualifierName: string;
  qualifierValue: string | undefined;
  conditionValue: string | undefined;
  operator: string;
  score: number;
  matched: boolean;
  matchType: 'match' | 'matchAsDefault' | 'noMatch';
  scoreAsDefault?: number;
  conditionIndex: number;
}

/** @public */
export interface ConfigurationViewProps extends ViewBaseProps {
  configuration?: Config.Model.ISystemConfiguration | null;
  onConfigurationChange?: (config: Config.Model.ISystemConfiguration) => void;
  onSave?: (config: Config.Model.ISystemConfiguration) => void;
  hasUnsavedChanges?: boolean;
}

/** @public */
export interface ZipLoaderViewProps extends ViewBaseProps {
  zipFileUrl?: string;
  zipPath?: string;
  onImport?: (data: ImportedDirectory | ImportedFile[]) => void;
  onConfigurationLoad?: (config: Config.Model.ISystemConfiguration) => void;
  onLoadComplete?: () => void;
}

// Resource detail types for SourceView
/** @public */
export interface ResourceDetailData {
  id: string;
  resourceType: string;
  candidateCount: number;
  candidates: Array<{
    json: JsonValue;
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

/** @public */
export interface FilteredResource {
  id: string;
  originalCandidateCount: number;
  filteredCandidateCount: number;
  hasWarning: boolean;
}

// Filter result type
/** @public */
export interface FilterResult {
  success: boolean;
  processedResources?: ProcessedResources;
  filteredResources?: FilteredResource[];
  warnings?: string[];
  error?: string;
}

// Orchestrator types
/** @public */
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

/** @public */
export interface OrchestratorActions {
  // Resource management
  importDirectory: (directory: ImportedDirectory) => Promise<void>;
  importDirectoryWithConfig: (
    directory: ImportedDirectory,
    config: Config.Model.ISystemConfiguration
  ) => Promise<void>;
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

  // Resolution editing
  saveResourceEdit: (resourceId: string, editedValue: JsonValue, originalValue?: JsonValue) => void;
  getEditedValue: (resourceId: string) => JsonValue | undefined;
  hasResourceEdit: (resourceId: string) => boolean;
  clearResourceEdits: () => void;
  applyResourceEdits: () => Promise<void>;
  discardResourceEdits: () => void;

  // UI state management
  selectResource: (resourceId: string | null) => void;
  addMessage: (type: Message['type'], message: string) => void;
  clearMessages: () => void;

  // Resource resolution
  resolveResource: (resourceId: string, context?: Record<string, string>) => Promise<Result<JsonValue>>;
}

// Export utility types
export type { Result } from '@fgv/ts-utils';
export type { JsonValue } from '@fgv/ts-json-base';
