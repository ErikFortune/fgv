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
  onZipImport?: (
    zipData: ImportedDirectory | ImportedFile[],
    config?: Config.Model.ISystemConfiguration
  ) => void;
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
/**
 * Current state of resource resolution testing and debugging.
 * Tracks context values, resolution results, and editing state.
 *
 * @public
 */
export interface ResolutionState {
  /** Current context values applied for resolution */
  contextValues: Record<string, string | undefined>;
  /** Context values being edited but not yet applied */
  pendingContextValues: Record<string, string | undefined>;
  /** ID of the currently selected resource for resolution testing */
  selectedResourceId: string | null;
  /** The resolver instance being used for testing */
  currentResolver: Runtime.ResourceResolver | null;
  /** Result of the most recent resolution attempt */
  resolutionResult: ResolutionResult | null;
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
}

/**
 * Actions available for managing resource resolution testing and editing.
 * Provides methods for context management, resource selection, and value editing.
 *
 * @public
 */
export interface ResolutionActions {
  /** Update a context value for resolution testing */
  updateContextValue: (qualifierName: string, value: string | undefined) => void;
  /** Apply pending context changes to the resolver */
  applyContext: () => void;
  /** Select a resource for detailed resolution testing */
  selectResource: (resourceId: string) => void;
  /** Change how resolution results are displayed */
  setViewMode: (mode: 'composed' | 'best' | 'all' | 'raw') => void;
  /** Clear the resolution cache to force fresh resolution */
  resetCache: () => void;
  /** Save an edit to a resource value */
  saveEdit: (resourceId: string, editedValue: JsonValue, originalValue?: JsonValue) => void;
  /** Get the edited value for a resource, if any */
  getEditedValue: (resourceId: string) => JsonValue | undefined;
  /** Check if a resource has been edited */
  hasEdit: (resourceId: string) => boolean;
  /** Clear all pending edits */
  clearEdits: () => void;
  /** Apply all edits to the resource system */
  applyEdits: () => Promise<void>;
  /** Discard all pending edits */
  discardEdits: () => void;
}

/**
 * Result of attempting to resolve a specific resource with a given context.
 * Contains the resolved value, matching candidates, and diagnostic information.
 *
 * @public
 */
export interface ResolutionResult {
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
  candidateDetails?: CandidateInfo[];
  /** The final composed/resolved value */
  composedValue?: JsonValue;
  /** Error message if resolution failed */
  error?: string;
}

/**
 * Detailed information about how a resource candidate was evaluated during resolution.
 * Provides diagnostic data for understanding why candidates matched or didn't match.
 *
 * @public
 */
export interface CandidateInfo {
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
  conditionEvaluations?: ConditionEvaluationResult[];
}

/**
 * Result of evaluating a single condition during resource resolution.
 * Shows how a specific qualifier value compared against a condition.
 *
 * @public
 */
export interface ConditionEvaluationResult {
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
export interface ConfigurationViewProps extends ViewBaseProps {
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
export interface ResourceDetailData {
  /** Unique identifier of the resource */
  id: string;
  /** Type classification of the resource */
  resourceType: string;
  /** Total number of candidates defined for this resource */
  candidateCount: number;
  /** Array of all candidates with their conditions and values */
  candidates: Array<{
    /** The JSON value for this candidate */
    json: JsonValue;
    /** Conditions that determine when this candidate is selected */
    conditions: Array<{
      /** Name of the qualifier this condition evaluates */
      qualifier: string;
      /** Comparison operator for the condition */
      operator: string;
      /** Value to compare against */
      value: string;
      /** Priority/precedence of this condition */
      priority: number;
      /** Score when used as a default match */
      scoreAsDefault?: number;
    }>;
    /** Whether this candidate provides partial data that will be merged */
    isPartial: boolean;
    /** Method used to merge this candidate with others */
    mergeMethod: string;
  }>;
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
 * function FilterResultsSummary({ filteredResources }: { filteredResources: FilteredResource[] }) {
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
 * function analyzeFilteredResources(filteredResources: FilteredResource[]) {
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
export interface FilteredResource {
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
 * FilterResult encapsulates the outcome of applying resource filtering, providing
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
 *   processedResources: ProcessedResources,
 *   context: Record<string, string>
 * ) {
 *   const result = await FilterTools.createFilteredResourceManagerSimple(
 *     processedResources,
 *     context,
 *     { partialContextMatch: true, enableDebugLogging: false }
 *   );
 *
 *   if (result.isSuccess()) {
 *     const filterResult: FilterResult = result.value;
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
 * // Use FilterResult in React component for filter management
 * function FilterResultsPanel({ filterResult }: { filterResult: FilterResult | null }) {
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
 * function validateFilterResults(filterResult: FilterResult): {
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
export interface FilterResult {
  /** Whether the filtering operation completed successfully */
  success: boolean;
  /** The filtered processed resources, available if filtering succeeded */
  processedResources?: ProcessedResources;
  /** Analysis of individual resources after filtering, showing per-resource impact */
  filteredResources: FilteredResource[];
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
 * // Apply all edits
 * await actions.applyResourceEdits();
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
