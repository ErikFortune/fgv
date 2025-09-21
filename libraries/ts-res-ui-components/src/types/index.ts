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
import { JsonCompatible, JsonValue, FileTree } from '@fgv/ts-json-base';
// Import File System Access API types
import '@fgv/ts-web-extras';
// IIResourcePickerOptions import removed - unused
import type { IObservabilityContext } from '../utils/observability';
import type { IResourcePickerOptions } from '../components/pickers/ResourcePicker/types';

/**
 * Configuration options for edit validation.
 *
 * @public
 */
export interface IEditValidationResult {
  /** Whether the validation passed */
  isValid: boolean;
  /** Error message if validation failed */
  error?: string;
}

/**
 * Filter options for resource filtering.
 *
 * @public
 */
export interface IFilterOptions {
  /** Whether to enable partial context matching */
  partialContextMatch?: boolean;
  /** Whether to enable debug logging */
  enableDebugLogging?: boolean;
}

/**
 * Represents a user-facing message with type classification and timestamp.
 * Used throughout the UI components for displaying feedback to users.
 *
 * @public
 */
export interface IMessage {
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
export interface IFilterState {
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
export interface IFilterActions {
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
export interface IProcessedResources {
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
export interface IExtendedProcessedResources extends IProcessedResources {
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
export interface IResourceManagerState {
  /** Whether the system is currently processing resources */
  isProcessing: boolean;
  /** The processed resource system, or null if not yet processed */
  processedResources: IExtendedProcessedResources | null;
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

// IImportedFile and IImportedDirectory interfaces removed - replaced with FileTree

/**
 * Base properties shared by all view components.
 * Provides common functionality for messaging and styling.
 *
 * @public
 */
export interface IViewBaseProps {
  /** Additional CSS class names for styling */
  className?: string;
  /** How to present the ResourcePicker options control panel (default: 'hidden' for production use) */
  pickerOptionsPanelPresentation?: 'hidden' | 'inline' | 'collapsible' | 'popup' | 'popover';
}

/**
 * Props for the ImportView component.
 * Handles importing resource configurations and bundles.
 *
 * @public
 */
export interface IImportViewProps extends IViewBaseProps {
  /** Callback when resource files/directories are imported */
  onImport?: (data: FileTree.FileTree) => void;
  /** Callback when a bundle file is imported */
  onBundleImport?: (bundle: Bundle.IBundle) => void;
  /** Callback when a ZIP file is imported with optional configuration */
  onZipImport?: (zipData: FileTree.FileTree, config?: Config.Model.ISystemConfiguration) => void;
  /** File types accepted for import */
  acceptedFileTypes?: string[];
  /** External error state to override local import status */
  importError?: string | null;
}

/**
 * Props for the SourceView component.
 * Displays and manages the source resource collection.
 *
 * @public
 */
export interface ISourceViewProps extends IViewBaseProps {
  /** The processed resource system to display */
  resources?: IExtendedProcessedResources | null;
  /** Optional filter state for filtered views */
  filterState?: IFilterState;
  /** Result of filtering if applied */
  filterResult?: IFilterResult | null;
  /** Currently selected resource ID for detailed view */
  selectedResourceId?: string | null;
  /** Callback when a resource is selected */
  onResourceSelect?: (resourceId: string) => void;
  /** Callback when exporting resource collection data */
  onExport?: (data: unknown, type: 'json') => void;
  /** Optional configuration for the ResourcePicker behavior */
  pickerOptions?: IResourcePickerOptions;
}

/**
 * Props for the FilterView component.
 * Provides resource filtering functionality.
 *
 * @public
 */
export interface IFilterViewProps extends IViewBaseProps {
  /** The resource system to filter */
  resources?: IProcessedResources | null;
  /** Current state of the filter configuration */
  filterState: IFilterState;
  /** Actions for managing filter state */
  filterActions: IFilterActions;
  /** Result of applying the filter */
  filterResult?: IFilterResult | null;
  /** Callback when filter results change */
  onFilterResult?: (result: IFilterResult | null) => void;
  /** Optional configuration for the ResourcePicker behavior */
  pickerOptions?: IResourcePickerOptions;
  /** Optional configuration for context control behavior */
  contextOptions?: IResolutionContextOptions;
}

/**
 * Props for the CompiledView component.
 * Displays the compiled resource collection structure.
 *
 * @public
 */
export interface ICompiledViewProps extends IViewBaseProps {
  /** The resource system to display */
  resources?: IExtendedProcessedResources | null;
  /** Optional filter state for filtered views */
  filterState?: IFilterState;
  /** Result of filtering if applied */
  filterResult?: IFilterResult | null;
  /** Whether to use normalization in display */
  useNormalization?: boolean;
  /** Callback for exporting compiled data or bundles */
  onExport?: (
    data: ResourceJson.Compiled.ICompiledResourceCollection | Bundle.IBundle,
    type: 'json' | 'bundle'
  ) => void;
  /** Optional configuration for the ResourcePicker behavior */
  pickerOptions?: IResourcePickerOptions;
}

/**
 * Result of attempting to create a resource editor for a specific resource.
 * Used by ResourceEditorFactory to provide type-specific editors.
 *
 * @public
 */
export type ResourceEditorResult<T = unknown, TV extends JsonCompatible<T> = JsonCompatible<T>> =
  | {
      /** Indicates whether the factory was able to create an editor for the resource */
      success: true;
      /** The React component to render for editing this resource */
      editor: React.ComponentType<IResourceEditorProps<T, TV>>;
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
export interface IResourceEditorProps<T = unknown, TV extends JsonCompatible<T> = JsonCompatible<T>> {
  /** The original JSON value to edit */
  value: TV;
  /** The resource ID for tracking edits */
  resourceId: string;
  /** Whether this resource has been edited */
  isEdited?: boolean;
  /** The current edited value if any */
  editedValue?: TV;
  /** Callback when the user saves an edit */
  onSave?: (resourceId: string, editedValue: TV, originalValue: TV) => void;
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
export interface IResourceEditorFactory<T = unknown, TV extends JsonCompatible<T> = JsonCompatible<T>> {
  /**
   * Attempts to create a resource editor for the given resource.
   *
   * @param resourceId - The ID of the resource to edit
   * @param resourceType - The type/key of the resource
   * @param value - The current value of the resource
   * @returns ResourceEditorResult indicating success/failure and the editor component or error message
   */
  createEditor(resourceId: string, resourceType: string, value: TV): ResourceEditorResult<T, TV>;
}

/**
 * Props for the ResolutionView component.
 * Provides resource resolution testing and debugging.
 *
 * @public
 */
export interface IResolutionViewProps extends IViewBaseProps {
  /** The resource system for resolution testing */
  resources?: IProcessedResources | null;
  /** Optional filter state */
  filterState?: IFilterState;
  /** Filter results if applied */
  filterResult?: IFilterResult | null;
  /** Current resolution testing state */
  resolutionState?: IResolutionState;
  /** Actions for managing resolution state */
  resolutionActions?: IResolutionActions;
  /** Available qualifiers for context building */
  availableQualifiers?: string[];
  /** Optional factory for creating type-specific resource editors */
  resourceEditorFactory?: IResourceEditorFactory;
  /** Optional configuration for the ResourcePicker behavior */
  pickerOptions?: IResourcePickerOptions;
  /** Optional configuration for the resolution context controls */
  contextOptions?: IResolutionContextOptions;
  /** Lock to a single view state and suppress the view state selector */
  lockedViewMode?: 'composed' | 'best' | 'all' | 'raw';
  /** Custom titles for the main sections */
  sectionTitles?: {
    /** Title for the resources picker section (default: "Resources") */
    resources?: string;
    /** Title for the results section (default: "Results") */
    results?: string;
  };
  /** Allow creating new resources in the UI */
  allowResourceCreation?: boolean;
  /** Default resource type for new resources (hides type selector if provided) */
  defaultResourceType?: string;
  /** Factory for creating custom resource types */
  resourceTypeFactory?: ResourceTypes.IResourceType[];
  /** Callback when pending resources are applied */
  onPendingResourcesApplied?: (added: ResourceJson.Json.ILooseResourceDecl[], deleted: string[]) => void;
  /** Show pending resources in the resource list with visual distinction */
  showPendingResourcesInList?: boolean;
}

/**
 * Information about a resource being edited in the resolution view.
 * Tracks changes to resource values and states.
 *
 * @public
 */
export interface IEditedResourceInfo<T = unknown, TV extends JsonCompatible<T> = JsonCompatible<T>> {
  /** Unique identifier of the resource being edited */
  resourceId: string;
  originalValue: TV;
  editedValue: TV;
  timestamp: Date;
}

// Resolution types
/**
 * Current state of resource resolution testing and debugging.
 * Tracks context values, resolution results, and editing state.
 *
 * @public
 */
export interface IResolutionState {
  /** Current context values applied for resolution */
  contextValues: Record<string, string | undefined>;
  /** Context values being edited but not yet applied */
  pendingContextValues: Record<string, string | undefined>;
  /** ID of the currently selected resource for resolution testing */
  selectedResourceId: string | null;
  /** The resolver instance being used for testing */
  currentResolver: Runtime.ResourceResolver | null;
  /** Result of the most recent resolution attempt */
  resolutionResult: IResolutionResult | null;
  /** Current view mode for displaying resolution results */
  viewMode: 'composed' | 'best' | 'all' | 'raw';
  /** Whether there are pending context changes not yet applied */
  hasPendingChanges: boolean;
  /** Map of resource IDs to their edited values */
  editedResources: Map<string, JsonValue>;
  /** Whether there are unsaved resource edits */
  hasUnsavedEdits: boolean;
  /** Whether edits are currently being applied to the system */
  isApplyingEdits: boolean;
  /** Resources waiting to be added to the system */
  pendingResources: Map<string, ResourceJson.Json.ILooseResourceDecl>;
  /** IDs of resources marked for deletion */
  pendingResourceDeletions: Set<string>;
  /** Draft of a new resource being created */
  newResourceDraft?: {
    resourceId: string;
    resourceType: string;
    template: ResourceJson.Json.ILooseResourceDecl;
    isValid: boolean;
  };
  /** Available resource types for creation */
  availableResourceTypes: ResourceTypes.IResourceType[];
  /** Whether there are pending resource additions or deletions */
  hasPendingResourceChanges: boolean;
}

/**
 * Parameters for creating a pending resource atomically.
 *
 * @example
 * ```typescript
 * const params: ICreatePendingResourceParams = {
 *   id: 'platform.languages.az-AZ',
 *   resourceTypeName: 'json',
 *   json: { text: 'Welcome', locale: 'az-AZ' }
 * };
 * ```
 *
 * @public
 */
export interface ICreatePendingResourceParams<T = unknown, TV extends JsonCompatible<T> = JsonCompatible<T>> {
  /** Full resource ID (e.g., 'platform.languages.az-AZ') - must be unique */
  id: string;
  /** Name of the resource type to use for validation and template creation */
  resourceTypeName: string;
  /** JSON content for the resource candidate. If undefined, the resource type's base template will be used. */
  json?: TV;
}

/**
 * Parameters for starting a new resource with optional pre-seeding.
 *
 * @example
 * ```typescript
 * // Basic start with just type
 * const basicParams: IStartNewResourceParams = {
 *   defaultTypeName: 'json'
 * };
 *
 * // Pre-seeded start with full data
 * const preSeededParams: IStartNewResourceParams = {
 *   id: 'user.welcome',
 *   resourceTypeName: 'json',
 *   json: { text: 'Welcome!' }
 * };
 * ```
 *
 * @public
 */
export interface IStartNewResourceParams<T = unknown, TV extends JsonCompatible<T> = JsonCompatible<T>> {
  /** Resource type to use (optional - will use first available if not provided) */
  defaultTypeName?: string;
  /** Pre-seed with specific ID (optional) */
  id?: string;
  /** Pre-seed with specific resource type name (optional) */
  resourceTypeName?: string;
  /** Pre-seed with specific JSON content (optional) */
  json?: TV;
}

/**
 * Actions available for managing resource resolution testing and editing.
 * Provides methods for context management, resource selection, and value editing.
 *
 * @public
 */
export interface IResolutionActions {
  /** Update a context value for resolution testing */
  updateContextValue: (qualifierName: string, value: string | undefined) => Result<void>;
  /** Apply pending context changes to the resolver (with optional host-managed values) */
  applyContext: (hostManagedValues?: Record<string, string | undefined>) => Result<void>;
  /** Select a resource for detailed resolution testing */
  selectResource: (resourceId: string) => Result<void>;
  /** Change how resolution results are displayed */
  setViewMode: (mode: 'composed' | 'best' | 'all' | 'raw') => void;
  /** Clear the resolution cache to force fresh resolution */
  resetCache: () => Result<void>;
  /** Save an edit to a resource value */
  saveEdit: (resourceId: string, editedValue: JsonValue, originalValue?: JsonValue) => Result<void>;
  /** Get the edited value for a resource, if any */
  getEditedValue: (resourceId: string) => JsonValue | undefined;
  /** Check if a resource has been edited */
  hasEdit: (resourceId: string) => boolean;
  /** Clear all pending edits */
  clearEdits: () => Result<{ clearedCount: number }>;
  /** Discard all pending edits */
  discardEdits: () => Result<{ discardedCount: number }>;

  // Enhanced resource creation actions with Result pattern return values
  /** Create a pending resource atomically with validation */
  createPendingResource: (params: ICreatePendingResourceParams) => Result<void>;
  /** Start creating a new resource (enhanced with optional pre-seeding) */
  startNewResource: (
    params?: IStartNewResourceParams
  ) => Result<{ draft: IResolutionState['newResourceDraft']; diagnostics: string[] }>;
  /** Update the resource ID for the new resource being created */
  updateNewResourceId: (
    id: string
  ) => Result<{ draft: IResolutionState['newResourceDraft']; diagnostics: string[] }>;
  /** Select a resource type for the new resource */
  selectResourceType: (
    type: string
  ) => Result<{ draft: IResolutionState['newResourceDraft']; diagnostics: string[] }>;
  /** Update the JSON content for the new resource being created */
  updateNewResourceJson: (
    json: JsonValue
  ) => Result<{ draft: IResolutionState['newResourceDraft']; diagnostics: string[] }>;
  /** Add the new resource to pending resources (not applied yet) */
  saveNewResourceAsPending: () => Result<{
    pendingResources: Map<string, ResourceJson.Json.ILooseResourceDecl>;
    diagnostics: string[];
  }>;
  /** Cancel the new resource creation */
  cancelNewResource: () => void;
  /** Remove a pending resource */
  removePendingResource: (resourceId: string) => Result<void>;
  /** Mark an existing resource for deletion */
  markResourceForDeletion: (resourceId: string) => void;
  /** Apply all pending resource additions and deletions */
  applyPendingResources: () => Promise<
    Result<{
      appliedCount: number;
      existingResourceEditCount: number;
      pendingResourceEditCount: number;
      newResourceCount: number;
      deletionCount: number;
    }>
  >;
  /** Discard all pending resource changes */
  discardPendingResources: () => void;
}

/**
 * Options for controlling individual qualifier context controls.
 *
 * Provides fine-grained control over the behavior, appearance, and editability
 * of individual qualifier inputs. This allows hosts to customize which qualifiers
 * are editable, provide external values, and control the presentation.
 *
 * @example
 * ```tsx
 * // Make a qualifier readonly with external value
 * const languageOptions: IQualifierControlOptions = {
 *   visible: true,
 *   editable: false,
 *   hostValue: 'en-US',
 *   showHostValue: true,
 *   placeholder: 'Language managed externally'
 * };
 * ```
 *
 * @public
 */
export interface IQualifierControlOptions {
  /** Whether this qualifier should be visible at all */
  visible?: boolean;
  /** Whether this qualifier is editable by the user */
  editable?: boolean;
  /** External/host-managed value that overrides user input */
  hostValue?: string | undefined;
  /** Whether to show host-managed values in the display */
  showHostValue?: boolean;
  /** Custom placeholder text for this qualifier */
  placeholder?: string;
  /** Custom CSS classes for this qualifier control */
  className?: string;
}

/**
 * Configuration options for the resolution context controls in ResolutionView.
 *
 * Controls the visibility and behavior of the context configuration panel,
 * allowing hosts to customize which qualifiers are editable and provide
 * externally managed context values. Uses QualifierControlOptions for
 * per-qualifier customization.
 *
 * @example
 * ```tsx
 * // Hide context UI entirely - host controls context externally
 * <ResolutionView
 *   contextOptions={{ showContextControls: false }}
 *   // ... other props
 * />
 *
 * // Fine-grained qualifier control
 * <ResolutionView
 *   contextOptions={{
 *     showContextControls: true,
 *     qualifierOptions: {
 *       language: { editable: true, placeholder: 'Select language...' },
 *       platform: { editable: false, hostValue: 'web', showHostValue: true },
 *       env: { visible: false } // Hidden from UI entirely
 *     },
 *     hostManagedValues: { env: 'production' } // Invisible but active
 *   }}
 *   // ... other props
 * />
 * ```
 *
 * @public
 */
export interface IResolutionContextOptions {
  /** Visibility options */
  /** Whether to show the context configuration panel at all */
  showContextControls?: boolean;
  /** Whether to show the current context display */
  showCurrentContext?: boolean;
  /** Whether to show the Apply/Reset buttons */
  showContextActions?: boolean;

  /** Per-qualifier control options */
  qualifierOptions?: Record<string, IQualifierControlOptions>;

  /** Global defaults for qualifiers not specifically configured */
  defaultQualifierEditable?: boolean;
  defaultQualifierVisible?: boolean;

  /** Host-managed values that override all user input for invisible qualifiers */
  hostManagedValues?: Record<string, string | undefined>;

  /** Appearance options */
  /** Custom title for the context configuration panel */
  contextPanelTitle?: string;
  /** Global placeholder text pattern for qualifier inputs */
  globalPlaceholder?: string | ((qualifierName: string) => string);
  /** Additional CSS classes for the context panel */
  contextPanelClassName?: string;
}

/**
 * Result of attempting to resolve a specific resource with a given context.
 * Contains the resolved value, matching candidates, and diagnostic information.
 *
 * @public
 */
export interface IResolutionResult<T = unknown, TV extends JsonCompatible<T> = JsonCompatible<T>> {
  /** Whether the resolution was successful */
  success: boolean;
  /** ID of the resource that was resolved */
  resourceId: string;
  /** The resolved resource object, if successful */
  resource?: Runtime.IResource;
  /** The best matching candidate for this context */
  bestCandidate?: Runtime.IResourceCandidate;
  /** All candidates that were considered during resolution */
  allCandidates?: readonly Runtime.IResourceCandidate[];
  /** Detailed information about each candidate's matching process */
  candidateDetails?: ICandidateInfo[];
  /** The final composed/resolved value */
  composedValue?: TV;
  /** Error message if resolution failed */
  error?: string;
}

/**
 * Detailed information about how a resource candidate was evaluated during resolution.
 * Provides diagnostic data for understanding why candidates matched or didn't match.
 *
 * @public
 */
export interface ICandidateInfo {
  /** The candidate that was evaluated */
  candidate: Runtime.IResourceCandidate;
  /** Key identifying the condition set used for evaluation */
  conditionSetKey: string | null;
  /** Index of this candidate within the resource */
  candidateIndex: number;
  /** Whether this candidate matched the resolution context */
  matched: boolean;
  /** Type of match that occurred */
  matchType: 'match' | 'matchAsDefault' | 'noMatch';
  /** Whether this was a default match (fallback when no exact match) */
  isDefaultMatch: boolean;
  /** Detailed evaluation results for each condition */
  conditionEvaluations?: IConditionEvaluationResult[];
}

/**
 * Result of evaluating a single condition during resource resolution.
 * Shows how a specific qualifier value compared against a condition.
 *
 * @public
 */
export interface IConditionEvaluationResult {
  /** Name of the qualifier being evaluated */
  qualifierName: string;
  /** Value of the qualifier in the resolution context */
  qualifierValue: string | undefined;
  /** Value specified in the resource condition */
  conditionValue: string | undefined;
  /** Comparison operator used for evaluation */
  operator: string;
  /** Numeric score for this condition evaluation */
  score: number;
  /** Whether this condition matched */
  matched: boolean;
  /** Type of match that occurred */
  matchType: 'match' | 'matchAsDefault' | 'noMatch';
  /** Score when used as a default match */
  scoreAsDefault?: number;
  /** Index of this condition within the candidate */
  conditionIndex: number;
}

/**
 * Props for the ConfigurationView component.
 * Handles editing and managing system configuration including qualifiers, qualifier types, and resource types.
 *
 * @public
 */
export interface IConfigurationViewProps extends IViewBaseProps {
  /** Current system configuration to display and edit */
  configuration?: Config.Model.ISystemConfiguration | null;
  /** Callback when configuration changes (during editing) */
  onConfigurationChange?: (config: Config.Model.ISystemConfiguration) => void;
  /** Callback when configuration should be saved/applied */
  onSave?: (config: Config.Model.ISystemConfiguration) => void;
  /** Whether there are unsaved changes to the configuration */
  hasUnsavedChanges?: boolean;
}

// Resource detail types for SourceView
/**
 * Detailed information about a resource for display in source views.
 * Contains the resource structure including all candidates and their conditions.
 *
 * @public
 */
export interface IResourceDetailData {
  /** Unique identifier of the resource */
  id: string;
  /** Type classification of the resource */
  resourceType: string;
  /** Total number of candidates defined for this resource */
  candidateCount: number;
  /** Array of all candidates with their conditions and values */
  candidates: Array<ResourceJson.Normalized.IChildResourceCandidateDecl>;
}

/**
 * Information about a single resource after filtering has been applied.
 *
 * FilteredResource provides detailed analytics about how filtering affected
 * an individual resource, including candidate count changes and potential
 * issues detected during the filtering process. This information is essential
 * for understanding filtering effectiveness and diagnosing filtering problems.
 *
 * @example
 * ```typescript
 * import { FilterTools } from '@fgv/ts-res-ui-components';
 *
 * // Analyze filter results for resources
 * const filterResult = await FilterTools.createFilteredResourceManagerSimple(
 *   processedResources,
 *   { language: 'en-US', platform: 'web' }
 * );
 *
 * if (filterResult.isSuccess() && filterResult.value.success) {
 *   filterResult.value.filteredResources.forEach((resource: FilteredResource) => {
 *     console.log(`Resource ${resource.id}:`);
 *     console.log(`  Original candidates: ${resource.originalCandidateCount}`);
 *     console.log(`  Filtered candidates: ${resource.filteredCandidateCount}`);
 *
 *     if (resource.hasWarning) {
 *       console.warn(`  ⚠️  Warning: Potential filtering issue detected`);
 *     }
 *
 *     const reductionPercent = Math.round(
 *       ((resource.originalCandidateCount - resource.filteredCandidateCount) /
 *        resource.originalCandidateCount) * 100
 *     );
 *     console.log(`  Reduction: ${reductionPercent}%`);
 *   });
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Use FilteredResource data in UI components
 * function FilterResultsSummary({ filteredResources }: { filteredResources: IFilteredResource[] }) {
 *   const totalOriginal = filteredResources.reduce((sum, r) => sum + r.originalCandidateCount, 0);
 *   const totalFiltered = filteredResources.reduce((sum, r) => sum + r.filteredCandidateCount, 0);
 *   const warningCount = filteredResources.filter(r => r.hasWarning).length;
 *
 *   return (
 *     <div className="filter-summary">
 *       <h3>Filter Results Summary</h3>
 *       <div className="stats">
 *         <div>Resources: {filteredResources.length}</div>
 *         <div>Total candidates: {totalOriginal} → {totalFiltered}</div>
 *         <div>Reduction: {Math.round(((totalOriginal - totalFiltered) / totalOriginal) * 100)}%</div>
 *         {warningCount > 0 && (
 *           <div className="warnings">⚠️ {warningCount} resource(s) with warnings</div>
 *         )}
 *       </div>
 *
 *       <div className="resource-list">
 *         {filteredResources.map(resource => (
 *           <div key={resource.id} className={resource.hasWarning ? 'has-warning' : ''}>
 *             <span className="resource-id">{resource.id}</span>
 *             <span className="candidate-counts">
 *               {resource.originalCandidateCount} → {resource.filteredCandidateCount}
 *             </span>
 *             {resource.hasWarning && <span className="warning-icon">⚠️</span>}
 *           </div>
 *         ))}
 *       </div>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Filter resources by specific criteria
 * function analyzeFilteredResources(filteredResources: IFilteredResource[]) {
 *   // Find resources that were completely filtered out
 *   const completelyFiltered = filteredResources.filter(r =>
 *     r.filteredCandidateCount === 0 && r.originalCandidateCount > 0
 *   );
 *
 *   // Find resources with significant candidate reduction
 *   const significantReduction = filteredResources.filter(r => {
 *     const reductionPercent = (r.originalCandidateCount - r.filteredCandidateCount) / r.originalCandidateCount;
 *     return reductionPercent > 0.5; // More than 50% reduction
 *   });
 *
 *   // Find resources with warnings
 *   const withWarnings = filteredResources.filter(r => r.hasWarning);
 *
 *   return {
 *     completelyFiltered: completelyFiltered.map(r => r.id),
 *     significantReduction: significantReduction.map(r => ({
 *       id: r.id,
 *       reductionPercent: Math.round(
 *         ((r.originalCandidateCount - r.filteredCandidateCount) / r.originalCandidateCount) * 100
 *       )
 *     })),
 *     withWarnings: withWarnings.map(r => r.id),
 *     totalResources: filteredResources.length
 *   };
 * }
 * ```
 *
 * @public
 */
export interface IFilteredResource {
  /** The resource ID that was filtered */
  id: string;
  /** Number of candidates before filtering was applied */
  originalCandidateCount: number;
  /** Number of candidates remaining after filtering */
  filteredCandidateCount: number;
  /** Whether this resource has potential filtering issues or warnings */
  hasWarning: boolean;
}

/**
 * Complete result of a filtering operation including processed data and analysis.
 *
 * IFilterResult encapsulates the outcome of applying resource filtering, providing
 * both the filtered resource system and detailed analytics about the filtering
 * process. It includes success/failure status, processed resources, per-resource
 * analysis, and any warnings or errors encountered during filtering.
 *
 * @example
 * ```typescript
 * import { FilterTools } from '@fgv/ts-res-ui-components';
 *
 * // Apply filtering and handle results
 * async function applyResourceFilter(
 *   processedResources: IProcessedResources,
 *   context: Record<string, string>
 * ) {
 *   const result = await FilterTools.createFilteredResourceManagerSimple(
 *     processedResources,
 *     context,
 *     { partialContextMatch: true, enableDebugLogging: false }
 *   );
 *
 *   if (result.isSuccess()) {
 *     const filterResult: IFilterResult = result.value;
 *
 *     if (filterResult.success) {
 *       console.log('Filter applied successfully!');
 *       console.log(`Processed ${filterResult.filteredResources.length} resources`);
 *
 *       // Use the filtered resource system
 *       if (filterResult.processedResources) {
 *         console.log('Filtered resource system ready for use');
 *         return filterResult.processedResources;
 *       }
 *
 *       // Check for warnings
 *       if (filterResult.warnings.length > 0) {
 *         filterResult.warnings.forEach(warning => {
 *           console.warn(`⚠️ Filter warning: ${warning}`);
 *         });
 *       }
 *     } else {
 *       console.error(`Filter failed: ${filterResult.error}`);
 *     }
 *   } else {
 *     console.error(`Filter operation failed: ${result.message}`);
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Use IFilterResult in React component for filter management
 * function FilterResultsPanel({ filterResult }: { filterResult: IFilterResult | null }) {
 *   if (!filterResult) {
 *     return <div className="no-filter">No filter applied</div>;
 *   }
 *
 *   if (!filterResult.success) {
 *     return (
 *       <div className="filter-error">
 *         <h3>Filter Error</h3>
 *         <p>{filterResult.error}</p>
 *       </div>
 *     );
 *   }
 *
 *   const stats = filterResult.filteredResources;
 *   const totalOriginal = stats.reduce((sum, r) => sum + r.originalCandidateCount, 0);
 *   const totalFiltered = stats.reduce((sum, r) => sum + r.filteredCandidateCount, 0);
 *   const resourcesWithWarnings = stats.filter(r => r.hasWarning).length;
 *
 *   return (
 *     <div className="filter-results">
 *       <h3>Filter Results</h3>
 *
 *       <div className="summary">
 *         <div className="stat">
 *           <label>Resources Processed:</label>
 *           <span>{stats.length}</span>
 *         </div>
 *         <div className="stat">
 *           <label>Total Candidates:</label>
 *           <span>{totalOriginal} → {totalFiltered}</span>
 *         </div>
 *         <div className="stat">
 *           <label>Reduction:</label>
 *           <span>{Math.round(((totalOriginal - totalFiltered) / totalOriginal) * 100)}%</span>
 *         </div>
 *       </div>
 *
 *       {filterResult.warnings.length > 0 && (
 *         <div className="warnings">
 *           <h4>Warnings ({filterResult.warnings.length})</h4>
 *           <ul>
 *             {filterResult.warnings.map((warning, index) => (
 *               <li key={index} className="warning">{warning}</li>
 *             ))}
 *           </ul>
 *         </div>
 *       )}
 *
 *       {resourcesWithWarnings > 0 && (
 *         <div className="resource-warnings">
 *           <h4>Resources with Issues ({resourcesWithWarnings})</h4>
 *           <ul>
 *             {stats.filter(r => r.hasWarning).map(resource => (
 *               <li key={resource.id} className="resource-warning">
 *                 {resource.id} - {resource.filteredCandidateCount}/{resource.originalCandidateCount} candidates
 *               </li>
 *             ))}
 *           </ul>
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Advanced filter result analysis and validation
 * function validateFilterResults(filterResult: IFilterResult): {
 *   isValid: boolean;
 *   issues: string[];
 *   recommendations: string[];
 * } {
 *   const issues: string[] = [];
 *   const recommendations: string[] = [];
 *
 *   if (!filterResult.success) {
 *     issues.push(`Filter operation failed: ${filterResult.error}`);
 *     recommendations.push('Check filter configuration and resource data');
 *     return { isValid: false, issues, recommendations };
 *   }
 *
 *   const resources = filterResult.filteredResources;
 *
 *   // Check for completely filtered resources
 *   const completelyFiltered = resources.filter(r =>
 *     r.filteredCandidateCount === 0 && r.originalCandidateCount > 0
 *   );
 *
 *   if (completelyFiltered.length > 0) {
 *     issues.push(`${completelyFiltered.length} resource(s) have no candidates after filtering`);
 *     recommendations.push('Consider using partial context matching or reviewing filter criteria');
 *   }
 *
 *   // Check for excessive warnings
 *   const warningCount = filterResult.warnings.length;
 *   if (warningCount > resources.length * 0.1) { // More than 10% warning rate
 *     issues.push(`High warning rate: ${warningCount} warnings for ${resources.length} resources`);
 *     recommendations.push('Review resource configuration and filter parameters');
 *   }
 *
 *   // Check for minimal filtering effect
 *   const totalOriginal = resources.reduce((sum, r) => sum + r.originalCandidateCount, 0);
 *   const totalFiltered = resources.reduce((sum, r) => sum + r.filteredCandidateCount, 0);
 *   const reductionPercent = ((totalOriginal - totalFiltered) / totalOriginal) * 100;
 *
 *   if (reductionPercent < 5) { // Less than 5% reduction
 *     issues.push(`Filter had minimal effect: only ${reductionPercent.toFixed(1)}% candidate reduction`);
 *     recommendations.push('Consider more specific filter criteria or check if filtering is needed');
 *   }
 *
 *   return {
 *     isValid: issues.length === 0,
 *     issues,
 *     recommendations
 *   };
 * }
 * ```
 *
 * @public
 */
export interface IFilterResult {
  /** Whether the filtering operation completed successfully */
  success: boolean;
  /** The filtered processed resources, available if filtering succeeded */
  processedResources?: IProcessedResources;
  /** Analysis of individual resources after filtering, showing per-resource impact */
  filteredResources: IFilteredResource[];
  /** Warning messages about potential filtering issues or edge cases */
  warnings: string[];
  /** Error message if the filtering operation failed */
  error?: string;
}

// Orchestrator types
/**
 * Complete state object for the resource orchestrator system.
 *
 * This interface represents the central state management for ts-res resources, encompassing
 * all aspects of resource processing, configuration, filtering, and resolution. It serves as
 * the primary state container for applications using the resource orchestrator.
 *
 * @example
 * ```typescript
 * // Basic usage with the orchestrator hook
 * import { ResourceTools } from '@fgv/ts-res-ui-components';
 *
 * function MyResourceApp() {
 *   const { state, actions } = ResourceTools.useResourceData();
 *
 *   // Check if resources are loaded
 *   if (!state.resources) {
 *     return <div>No resources loaded</div>;
 *   }
 *
 *   // Display current state information
 *   return (
 *     <div>
 *       <p>Resources: {state.resources.summary?.resourceCount || 0}</p>
 *       <p>Configuration: {state.configuration ? 'Loaded' : 'Default'}</p>
 *       <p>Processing: {state.isProcessing ? 'Yes' : 'No'}</p>
 *       <p>Selected: {state.selectedResourceId || 'None'}</p>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Working with filter state
 * const { state } = ResourceTools.useResourceData();
 *
 * // Check if filters are applied
 * const hasActiveFilters = Object.keys(state.filterState.appliedValues).length > 0;
 * const filteredResourceCount = state.filterResult?.resources?.summary?.resourceCount || 0;
 *
 * console.log(`Filters active: ${hasActiveFilters}`);
 * console.log(`Filtered resources: ${filteredResourceCount}`);
 * ```
 *
 * @example
 * ```typescript
 * // Working with resolution state
 * const { state } = ResourceTools.useResourceData();
 *
 * // Check resolution context
 * const hasResolutionContext = Object.keys(state.resolutionState.context).length > 0;
 * const currentMode = state.resolutionState.viewMode;
 * const hasEdits = Object.keys(state.resolutionState.editedResources).length > 0;
 *
 * console.log(`Resolution mode: ${currentMode}`);
 * console.log(`Has context: ${hasResolutionContext}`);
 * console.log(`Has edits: ${hasEdits}`);
 * ```
 *
 * @public
 */
export interface IOrchestratorState {
  resources: IExtendedProcessedResources | null;
  configuration: Config.Model.ISystemConfiguration | null;
  filterState: IFilterState;
  filterResult: IFilterResult | null;
  resolutionState: IResolutionState;
  selectedResourceId: string | null;
  isProcessing: boolean;
  error: string | null;
  messages: IMessage[];
  resourceEditorFactory?: IResourceEditorFactory;
}

/**
 * Complete actions interface for the resource orchestrator system.
 *
 * This interface provides all the methods needed to manage and manipulate the orchestrator state,
 * including resource import/export, configuration management, filtering, resolution, and UI state.
 * All methods are designed to work seamlessly with the Result pattern for consistent error handling.
 *
 * @example
 * ```typescript
 * // Basic resource import workflow
 * import { ResourceTools, FileTools } from '@fgv/ts-res-ui-components';
 *
 * function ResourceImporter() {
 *   const { state, actions } = ResourceTools.useResourceData();
 *
 *   const handleDirectoryImport = async (files: File[]) => {
 *     const directory = await FileTools.convertFilesToDirectory(files);
 *     await actions.importDirectory(directory);
 *
 *     if (state.error) {
 *       console.error('Import failed:', state.error);
 *     } else {
 *       console.log('Import successful:', state.resources?.summary);
 *     }
 *   };
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Configuration and filtering workflow
 * const { state, actions } = ResourceTools.useResourceData();
 *
 * // Apply a new configuration
 * actions.applyConfiguration(customConfig);
 *
 * // Set up filters
 * actions.updateFilterState({
 *   values: { language: 'en-US', platform: 'web' }
 * });
 *
 * // Apply filters and get results
 * const filterResult = await actions.applyFilter();
 * if (filterResult) {
 *   console.log('Filtered resources:', filterResult.resources.summary.resourceCount);
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Resolution context and resource editing
 * const { state, actions } = ResourceTools.useResourceData();
 *
 * // Set resolution context
 * actions.updateResolutionContext('language', 'en-US');
 * actions.updateResolutionContext('platform', 'mobile');
 * actions.applyResolutionContext();
 *
 * // Select a resource for resolution
 * actions.selectResourceForResolution('user.welcome');
 *
 * // Edit a resolved resource value
 * const newValue = { text: 'Updated welcome message' };
 * actions.saveResourceEdit('user.welcome', newValue);
 *
 * // Apply all pending changes (edits + new resources)
 * await actions.applyPendingResources();
 * ```
 *
 * @example
 * ```typescript
 * // Resource resolution and error handling
 * const { actions } = ResourceTools.useResourceData();
 *
 * const resolveUserMessage = async (messageId: string, userContext: Record<string, string>) => {
 *   const result = await actions.resolveResource(messageId, userContext);
 *
 *   if (result.isSuccess()) {
 *     console.log('Resolved message:', result.value);
 *     return result.value;
 *   } else {
 *     console.error('Resolution failed:', result.message);
 *     actions.addMessage('error', `Failed to resolve ${messageId}: ${result.message}`);
 *     return null;
 *   }
 * };
 * ```
 *
 * @example
 * ```typescript
 * // Bundle import and advanced workflows
 * const { actions } = ResourceTools.useResourceData();
 *
 * // Import from a pre-built bundle
 * const bundleData = await loadBundleFromUrl('/api/resources/bundle');
 * await actions.importBundle(bundleData);
 *
 * // Import directory with specific configuration
 * const directory = await loadResourceDirectory();
 * const customConfig = await loadConfiguration();
 * await actions.importDirectoryWithConfig(directory, customConfig);
 * ```
 *
 * @public
 */
export interface IOrchestratorActions {
  // Resource management
  importFileTree: (fileTree: FileTree.FileTree) => Promise<void>;
  importFileTreeWithConfig: (
    fileTree: FileTree.FileTree,
    config: Config.Model.ISystemConfiguration
  ) => Promise<void>;
  importBundle: (bundle: Bundle.IBundle) => Promise<void>;
  clearResources: () => void;

  // Configuration management
  updateConfiguration: (config: Config.Model.ISystemConfiguration) => void;
  applyConfiguration: (config: Config.Model.ISystemConfiguration) => void;

  // Filter management
  updateFilterState: (state: Partial<IFilterState>) => void;
  applyFilter: () => Promise<IFilterResult | null>;
  resetFilter: () => void;

  // Resolution management
  updateResolutionContext: (qualifierName: string, value: string | undefined) => Result<void>;
  applyResolutionContext: (hostManagedValues?: Record<string, string | undefined>) => Result<void>;
  selectResourceForResolution: (resourceId: string) => Result<void>;
  setResolutionViewMode: (mode: 'composed' | 'best' | 'all' | 'raw') => void;
  resetResolutionCache: () => Result<void>;

  // Resolution editing
  saveResourceEdit: (resourceId: string, editedValue: JsonValue, originalValue?: JsonValue) => Result<void>;
  getEditedValue: (resourceId: string) => JsonValue | undefined;
  hasResourceEdit: (resourceId: string) => boolean;
  clearResourceEdits: () => Result<{ clearedCount: number }>;
  // Removed: unified apply via applyPendingResources
  discardResourceEdits: () => Result<{ discardedCount: number }>;

  // Resource creation actions (enhanced with atomic API and Result pattern return values)
  createPendingResource: (params: ICreatePendingResourceParams) => Result<void>;
  startNewResource: (
    params?: IStartNewResourceParams
  ) => Result<{ draft: IResolutionState['newResourceDraft']; diagnostics: string[] }>;
  updateNewResourceId: (
    id: string
  ) => Result<{ draft: IResolutionState['newResourceDraft']; diagnostics: string[] }>;
  selectResourceType: (
    type: string
  ) => Result<{ draft: IResolutionState['newResourceDraft']; diagnostics: string[] }>;
  updateNewResourceJson: (
    json: JsonValue
  ) => Result<{ draft: IResolutionState['newResourceDraft']; diagnostics: string[] }>;
  saveNewResourceAsPending: () => Result<{
    pendingResources: Map<string, ResourceJson.Json.ILooseResourceDecl>;
    diagnostics: string[];
  }>;
  cancelNewResource: () => void;
  removePendingResource: (resourceId: string) => Result<void>;
  markResourceForDeletion: (resourceId: string) => void;
  applyPendingResources: () => Promise<
    Result<{
      appliedCount: number;
      existingResourceEditCount: number;
      pendingResourceEditCount: number;
      newResourceCount: number;
      deletionCount: number;
    }>
  >;
  discardPendingResources: () => void;

  // Combined pending changes actions removed in favor of unified applyPendingResources

  // Export functionality
  exportBundle: () => void;
  exportSource: () => void;
  exportCompiled: () => void;

  // UI state management
  selectResource: (resourceId: string | null) => void;
  addMessage: (type: IMessage['type'], message: string) => void;
  clearMessages: () => void;

  // Observability context for diagnostic and user logging
  o11y: IObservabilityContext;

  // Resource resolution
  resolveResource: (resourceId: string, context?: Record<string, string>) => Result<JsonValue>;
}

// GridView types
/**
 * Dropdown option for cell editing.
 *
 * @public
 */
export interface IGridDropdownOption {
  /** The value to store when this option is selected */
  value: string;
  /** The label to display for this option */
  label: string;
  /** Whether this option is disabled */
  disabled?: boolean;
}

/**
 * Validation configuration for grid cells.
 *
 * @public
 */
export interface IGridCellValidation {
  /** Whether the field is required */
  required?: boolean;
  /** Regex pattern for validation */
  pattern?: RegExp;
  /** Minimum length for string values */
  minLength?: number;
  /** Maximum length for string values */
  maxLength?: number;
  /** Custom validation function that returns error message or null */
  custom?: (value: JsonValue) => string | null;
}

/**
 * Configuration for a single column in a resource grid.
 * Defines how to extract, display, and edit values from resolved resources.
 *
 * @public
 */
export interface IGridColumnDefinition {
  /** Unique identifier for this column */
  id: string;
  /** Display title for the column header */
  title: string;
  /** Path to the property in the resolved resource value (JSONPath-like) */
  dataPath: string | string[];
  /** Optional fixed width for the column */
  width?: number;
  /** Whether this column can be sorted */
  sortable?: boolean;
  /** Whether values in this column can be edited */
  editable?: boolean;
  /** Type of cell editor to use */
  cellType?: 'string' | 'boolean' | 'tristate' | 'dropdown' | 'custom';
  /** Custom component for rendering cell content */
  cellRenderer?: React.ComponentType<IGridCellProps>;
  /** Custom component for editing cell content */
  cellEditor?: React.ComponentType<IGridCellEditorProps>;
  /** Validation configuration for this column */
  validation?: IGridCellValidation;
  /** Options for dropdown/combobox cells */
  dropdownOptions?: IGridDropdownOption[] | (() => Promise<IGridDropdownOption[]>);
  /** Whether to allow custom values in dropdown (combobox behavior) */
  allowCustomValue?: boolean;
  /** Presentation mode for tristate cells */
  triStatePresentation?: 'checkbox' | 'dropdown';
  /** Custom labels for tristate values */
  triStateLabels?: {
    trueLabel: string;
    falseLabel: string;
    undefinedLabel: string;
  };
}

/**
 * Props passed to custom grid cell renderers.
 *
 * @public
 */
export interface IGridCellProps {
  /** The extracted value for this cell */
  value: JsonValue;
  /** The resource ID for this row */
  resourceId: string;
  /** The column definition for this cell */
  column: IGridColumnDefinition;
  /** The complete resolved resource value */
  resolvedValue: JsonValue;
  /** Whether this cell has been edited */
  isEdited: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Props passed to custom grid cell editors.
 *
 * @public
 */
export interface IGridCellEditorProps extends IGridCellProps {
  /** The current edited value if any */
  editedValue?: JsonValue;
  /** Callback when the user saves an edit */
  onSave: (resourceId: string, newValue: JsonValue, originalValue: JsonValue) => void;
  /** Callback when the user cancels an edit */
  onCancel: () => void;
  /** Whether editing is currently disabled */
  disabled?: boolean;
}

/**
 * Column mapping configuration for a specific resource type.
 * Defines how resources of a given type should be displayed in the grid.
 *
 * @public
 */
export interface IResourceTypeColumnMapping {
  /** The resource type this mapping applies to */
  resourceType: string;
  /** Column definitions for this resource type */
  columns: IGridColumnDefinition[];
  /** Optional default column for unmapped properties */
  defaultColumn?: IGridColumnDefinition;
}

/**
 * Custom resource selector for advanced filtering logic.
 * Allows hosts to define complex resource selection criteria.
 *
 * @public
 */
export interface ICustomResourceSelector {
  /** Unique identifier for this selector */
  id: string;
  /** Function that returns resource IDs to include in the grid */
  select: (resources: IProcessedResources) => string[];
  /** Optional display name for debugging/logging */
  displayName?: string;
}

/**
 * Resource selection configuration for grid views.
 * Supports simple built-in selectors and custom selection logic.
 *
 * @public
 */
export type GridResourceSelector =
  | { type: 'ids'; resourceIds: string[] }
  | { type: 'prefix'; prefix: string }
  | { type: 'suffix'; suffix: string }
  | { type: 'resourceTypes'; types: string[] }
  | { type: 'pattern'; pattern: string }
  | { type: 'all' }
  | { type: 'custom'; selector: ICustomResourceSelector };

/**
 * Presentation options for grid display.
 *
 * @public
 */
export interface IGridPresentationOptions {
  /** Enable sorting of grid rows */
  enableSorting?: boolean;
  /** Enable filtering of grid rows */
  enableFiltering?: boolean;
  /** Number of rows per page (0 for no pagination) */
  pageSize?: number;
  /** Whether to show row numbers */
  showRowNumbers?: boolean;
  /** Whether to show a summary row */
  showSummaryRow?: boolean;
  /** Additional CSS classes for the grid container */
  className?: string;
}

/**
 * Configuration for a single grid instance.
 * Defines resource selection, column mapping, and presentation options.
 *
 * @public
 */
export interface IGridViewInitParams {
  /** Unique identifier for this grid */
  id: string;
  /** Display title for this grid */
  title: string;
  /** Optional description for this grid */
  description?: string;
  /** How to select resources for this grid */
  resourceSelection: GridResourceSelector;
  /** Column mappings for resource types in this grid */
  columnMapping: IResourceTypeColumnMapping[];
  /** Optional presentation overrides */
  presentationOptions?: IGridPresentationOptions;
}

/**
 * Props for the GridView component.
 * Displays a single grid instance with resource editing capabilities.
 *
 * @public
 */
export interface IGridViewProps extends IViewBaseProps {
  /** Grid configuration defining what and how to display */
  gridConfig: IGridViewInitParams;
  /** The resource system for resolution */
  resources?: IProcessedResources | null;
  /** Current resolution state (shared with other views) */
  resolutionState?: IResolutionState;
  /** Actions for managing resolution state (shared with other views) */
  resolutionActions?: IResolutionActions;
  /** Available qualifiers for context building */
  availableQualifiers?: string[];
  /** Optional configuration for context controls */
  contextOptions?: IResolutionContextOptions;
  /** Optional filter state integration */
  filterState?: IFilterState;
  /** Filter results if applied */
  filterResult?: IFilterResult | null;
  /** Whether to show context controls (default: true) */
  showContextControls?: boolean;
  /** Whether to show change controls (default: true) */
  showChangeControls?: boolean;
}

/**
 * Props for the MultiGridView component.
 * Container for multiple grid instances with shared context and batch operations.
 *
 * @public
 */
export interface IMultiGridViewProps extends IViewBaseProps {
  /** Multiple grid configurations to display */
  gridConfigurations: IGridViewInitParams[];
  /** The resource system for all grids */
  resources?: IProcessedResources | null;
  /** Shared resolution state across all grids */
  resolutionState?: IResolutionState;
  /** Shared resolution actions across all grids */
  resolutionActions?: IResolutionActions;
  /** Available qualifiers for context building */
  availableQualifiers?: string[];
  /** Shared context options for all grids */
  contextOptions?: IResolutionContextOptions;
  /** Optional filter state integration */
  filterState?: IFilterState;
  /** Filter results if applied */
  filterResult?: IFilterResult | null;
  /** How to present the grid selector */
  tabsPresentation?: 'tabs' | 'cards' | 'accordion' | 'dropdown';
  /** ID of the initially active grid */
  defaultActiveGrid?: string;
  /** Whether users can reorder grid tabs */
  allowGridReordering?: boolean;
}

// Export utility types
export type { Result } from '@fgv/ts-utils';
export type { JsonValue } from '@fgv/ts-json-base';

// Resource selector utility functions
export {
  getPendingAdditionsByType,
  isPendingAddition,
  deriveLeafId,
  deriveFullId,
  getPendingResourceTypes,
  getPendingResourceStats,
  validatePendingResourceKeys
} from '../utils/resourceSelectors';
