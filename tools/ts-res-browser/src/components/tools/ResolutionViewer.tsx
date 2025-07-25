import React, { useState, useMemo, useCallback } from 'react';
import {
  MagnifyingGlassIcon,
  CubeIcon,
  DocumentTextIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { JsonEditor } from 'json-edit-react';
import { UseResourceManagerReturn } from '../../hooks/useResourceManager';
import { Message, FilterState } from '../../types/app';
import { FilterResult } from '../../utils/filterResources';
import { Runtime, Config, NoMatch } from '@fgv/ts-res';
import { createSimpleContext, DEFAULT_SYSTEM_CONFIGURATION } from '../../utils/tsResIntegration';

// Updated types for default resolution support
type ConditionMatchType = 'match' | 'matchAsDefault' | 'noMatch';

interface IConditionMatchResult {
  score: number;
  priority: number;
  matchType: ConditionMatchType;
}

type DecisionResolutionResult =
  | { success: false }
  | { success: true; instanceIndices: ReadonlyArray<number>; defaultInstanceIndices: ReadonlyArray<number> };

interface ResolutionViewerProps {
  onMessage?: (type: Message['type'], message: string) => void;
  resourceManager: UseResourceManagerReturn;
  filterState: FilterState;
  filterResult?: FilterResult | null;
}

interface ContextState {
  [qualifierName: string]: string | undefined;
}

interface ConditionEvaluationResult {
  qualifierName: string;
  qualifierValue: any;
  conditionValue: any;
  operator: string;
  score: number;
  matched: boolean;
  matchType: ConditionMatchType;
  scoreAsDefault?: number;
  conditionIndex: number;
}

interface CandidateInfo {
  candidate: Runtime.IResourceCandidate;
  conditionSetKey: string | null;
  candidateIndex: number;
  matched: boolean;
  matchType: ConditionMatchType;
  isDefaultMatch: boolean;
  conditionEvaluations?: ConditionEvaluationResult[];
}

interface ResolutionResult {
  success: boolean;
  resource?: Runtime.IResource;
  bestCandidate?: Runtime.IResourceCandidate;
  allCandidates?: readonly Runtime.IResourceCandidate[];
  candidateDetails?: CandidateInfo[];
  composedValue?: any;
  error?: string;
}

type ViewMode = 'best' | 'all' | 'raw' | 'composed';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-10">
          <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
            {content}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
          </div>
        </div>
      )}
    </div>
  );
};

interface CacheDashboardProps {
  cacheMetrics: Runtime.ResourceResolverCacheMetricsListener<Runtime.AggregateCacheMetrics> | null;
  resolver: Runtime.ResourceResolver | null;
  onReset: () => void;
}

const CacheDashboard: React.FC<CacheDashboardProps> = ({ cacheMetrics, resolver, onReset }) => {
  if (!cacheMetrics || !resolver) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">📊 Cache: Not active</span>
          <button
            onClick={onReset}
            disabled={true}
            className="text-xs px-2 py-1 bg-gray-200 text-gray-400 rounded cursor-not-allowed"
          >
            Reset
          </button>
        </div>
      </div>
    );
  }

  const metrics = cacheMetrics.metrics;

  // Helper function to get cache display info
  const getCacheDisplay = (cacheType: Runtime.ResourceResolverCacheType) => {
    const cacheMetric = metrics[cacheType];
    const hitRate = cacheMetric.hitRate;
    const totalAccesses = cacheMetric.totalAccesses;
    const hits = cacheMetric.hits;
    const misses = cacheMetric.misses;
    const errors = cacheMetric.errors;

    // Get actual filled cache slots by looking at the cache arrays
    const cacheArray =
      cacheType === 'condition'
        ? resolver.conditionCache
        : cacheType === 'conditionSet'
        ? resolver.conditionSetCache
        : resolver.decisionCache;
    const filledSlots = cacheArray.filter((slot) => slot !== undefined).length;

    const totalSlots =
      cacheType === 'condition'
        ? resolver.conditionCacheSize
        : cacheType === 'conditionSet'
        ? resolver.conditionSetCacheSize
        : resolver.decisionCacheSize;

    // Color based on hit rate
    const getColor = (rate: number) => {
      if (rate === 0) return 'text-gray-500';
      if (rate >= 80) return 'text-green-600';
      if (rate >= 50) return 'text-yellow-600';
      return 'text-red-600';
    };

    return {
      filledSlots,
      totalSlots,
      totalAccesses,
      hits,
      misses,
      errors,
      hitRate: Math.round(hitRate),
      color: getColor(hitRate)
    };
  };

  const conditionDisplay = getCacheDisplay('condition');
  const conditionSetDisplay = getCacheDisplay('conditionSet');
  const decisionDisplay = getCacheDisplay('decision');

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-sm">
          <span className="text-gray-700">📊 Cache:</span>
          <Tooltip
            content={`Condition Cache: ${conditionDisplay.filledSlots} filled out of ${conditionDisplay.totalSlots} slots, ${conditionDisplay.totalAccesses} total accesses (${conditionDisplay.hits} hits, ${conditionDisplay.misses} misses, ${conditionDisplay.errors} errors), ${conditionDisplay.hitRate}% hit rate`}
          >
            <span className={`font-mono ${conditionDisplay.color} cursor-help`}>
              Cond: {conditionDisplay.filledSlots}/{conditionDisplay.totalSlots} ({conditionDisplay.hitRate}%)
            </span>
          </Tooltip>
          <span className="text-gray-400">|</span>
          <Tooltip
            content={`ConditionSet Cache: ${conditionSetDisplay.filledSlots} filled out of ${conditionSetDisplay.totalSlots} slots, ${conditionSetDisplay.totalAccesses} total accesses (${conditionSetDisplay.hits} hits, ${conditionSetDisplay.misses} misses, ${conditionSetDisplay.errors} errors), ${conditionSetDisplay.hitRate}% hit rate`}
          >
            <span className={`font-mono ${conditionSetDisplay.color} cursor-help`}>
              CondSet: {conditionSetDisplay.filledSlots}/{conditionSetDisplay.totalSlots} (
              {conditionSetDisplay.hitRate}%)
            </span>
          </Tooltip>
          <span className="text-gray-400">|</span>
          <Tooltip
            content={`Decision Cache: ${decisionDisplay.filledSlots} filled out of ${decisionDisplay.totalSlots} slots, ${decisionDisplay.totalAccesses} total accesses (${decisionDisplay.hits} hits, ${decisionDisplay.misses} misses, ${decisionDisplay.errors} errors), ${decisionDisplay.hitRate}% hit rate`}
          >
            <span className={`font-mono ${decisionDisplay.color} cursor-help`}>
              Dec: {decisionDisplay.filledSlots}/{decisionDisplay.totalSlots} ({decisionDisplay.hitRate}%)
            </span>
          </Tooltip>
        </div>
        <Tooltip content="Clear all caches and reset metrics">
          <button
            onClick={onReset}
            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          >
            Reset
          </button>
        </Tooltip>
      </div>
    </div>
  );
};

// Component to display condition evaluation results
interface ConditionEvaluationDisplayProps {
  evaluations: ConditionEvaluationResult[];
}

const ConditionEvaluationDisplay: React.FC<ConditionEvaluationDisplayProps> = ({ evaluations }) => {
  if (!evaluations || evaluations.length === 0) {
    return <span className="text-xs text-gray-500">No conditions</span>;
  }

  const getMatchTypeColor = (type: ConditionMatchType) => {
    switch (type) {
      case 'match':
        return 'bg-green-100 text-green-800';
      case 'matchAsDefault':
        return 'bg-amber-100 text-amber-800';
      case 'noMatch':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMatchTypeIcon = (type: ConditionMatchType) => {
    switch (type) {
      case 'match':
        return '✓';
      case 'matchAsDefault':
        return '≈';
      case 'noMatch':
        return '✗';
      default:
        return '?';
    }
  };

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {evaluations.map((evaluation, index) => {
        const displayText = `${evaluation.qualifierName}=${
          evaluation.conditionValue
        } (${evaluation.score.toFixed(1)})`;

        const tooltipContent = [
          `${evaluation.qualifierName}: context="${evaluation.qualifierValue}" ${evaluation.operator} condition="${evaluation.conditionValue}"`,
          `→ score=${evaluation.score} (${evaluation.matchType})`,
          evaluation.scoreAsDefault !== undefined ? `default score: ${evaluation.scoreAsDefault}` : null,
          `[condition index: ${evaluation.conditionIndex}]`
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <Tooltip key={index} content={tooltipContent}>
            <span className={`text-xs px-2 py-1 rounded ${getMatchTypeColor(evaluation.matchType)}`}>
              {getMatchTypeIcon(evaluation.matchType)} {displayText}
            </span>
          </Tooltip>
        );
      })}
    </div>
  );
};

// Cache Contents Display Component
interface CacheContentsDisplayProps {
  resolver: Runtime.ResourceResolver | null;
}

const CacheContentsDisplay: React.FC<CacheContentsDisplayProps> = ({ resolver }) => {
  const [expanded, setExpanded] = useState(false);

  if (!resolver) {
    return (
      <div className="border border-gray-200 rounded-lg bg-gray-50 p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">🗄️ Cache Contents</span>
          <span className="text-xs text-gray-400">Not available</span>
        </div>
      </div>
    );
  }

  const conditionCache = resolver.conditionCache;
  const conditionSetCache = resolver.conditionSetCache;
  const decisionCache = resolver.decisionCache;

  const conditionHits = conditionCache.filter((c) => c !== undefined).length;
  const conditionSetHits = conditionSetCache.filter((cs) => cs !== undefined).length;
  const decisionHits = decisionCache.filter((d) => d !== undefined).length;

  const totalCacheEntries = conditionHits + conditionSetHits + decisionHits;

  return (
    <div className="border border-gray-200 rounded-lg bg-gray-50">
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-100"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">🗄️ Cache Contents</span>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
            {totalCacheEntries} cached
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">
            C:{conditionHits} CS:{conditionSetHits} D:{decisionHits}
          </span>
          <span className="text-xs text-gray-400">{expanded ? '▼' : '▶'}</span>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-200 p-3 space-y-3 max-h-64 overflow-y-auto">
          {/* Condition Cache */}
          {conditionHits > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-2">Conditions ({conditionHits})</h4>
              <div className="space-y-1">
                {conditionCache.map((score, index) => {
                  if (score === undefined) return null;

                  try {
                    const condition = resolver.resourceManager.conditions.getAt(index);
                    if (condition.isFailure()) return null;

                    const conditionObj = condition.value;
                    const qualifierName = conditionObj.qualifier.name;

                    // Determine match type from cached result
                    const cachedResult = score as unknown as IConditionMatchResult;
                    const matchType =
                      cachedResult?.matchType || (cachedResult?.score > 0 ? 'match' : 'noMatch');
                    const displayScore = cachedResult?.score || 0;

                    const getMatchTypeColor = (type: ConditionMatchType) => {
                      switch (type) {
                        case 'match':
                          return 'bg-green-100 text-green-800';
                        case 'matchAsDefault':
                          return 'bg-amber-100 text-amber-800';
                        case 'noMatch':
                          return 'bg-red-100 text-red-800';
                        default:
                          return 'bg-gray-100 text-gray-800';
                      }
                    };

                    const getMatchTypeIcon = (type: ConditionMatchType) => {
                      switch (type) {
                        case 'match':
                          return '✓';
                        case 'matchAsDefault':
                          return '≈';
                        case 'noMatch':
                          return '✗';
                        default:
                          return '?';
                      }
                    };

                    return (
                      <div key={index} className="flex items-center justify-between text-xs">
                        <div className="text-gray-600 truncate max-w-24">
                          <div>
                            {index}: {qualifierName}={JSON.stringify(conditionObj.value)}
                          </div>
                          {conditionObj.scoreAsDefault !== undefined && (
                            <div className="text-amber-600 font-medium text-xs">
                              default: {conditionObj.scoreAsDefault}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className={`px-2 py-1 rounded ${getMatchTypeColor(matchType)}`}>
                            {getMatchTypeIcon(matchType)} {matchType}
                          </span>
                          <span className="text-xs text-gray-500">({displayScore.toFixed(2)})</span>
                        </div>
                      </div>
                    );
                  } catch (error) {
                    return (
                      <div key={index} className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">
                          {index}: condition-{index}
                        </span>
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          condition-{index} ({score.toFixed(2)})
                        </span>
                      </div>
                    );
                  }
                })}
              </div>
            </div>
          )}

          {/* Condition Set Cache */}
          {conditionSetHits > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-2">Condition Sets ({conditionSetHits})</h4>
              <div className="space-y-1">
                {conditionSetCache.map((result, index) => {
                  if (result === undefined) return null;

                  try {
                    const conditionSet = resolver.resourceManager.conditionSets.getAt(index);
                    const key = conditionSet.isSuccess() ? conditionSet.value.key : `cs-${index}`;

                    return (
                      <div key={index} className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 truncate max-w-24">
                          {index}: {key}
                        </span>
                        <span
                          className={`px-2 py-1 rounded ${
                            result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {key} ({result.success ? '✓' : '✗'})
                        </span>
                      </div>
                    );
                  } catch (error) {
                    return (
                      <div key={index} className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">
                          {index}: cs-{index}
                        </span>
                        <span
                          className={`px-2 py-1 rounded ${
                            result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          cs-{index} ({result.success ? '✓' : '✗'})
                        </span>
                      </div>
                    );
                  }
                })}
              </div>
            </div>
          )}

          {/* Decision Cache */}
          {decisionHits > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-2">Decisions ({decisionHits})</h4>
              <div className="space-y-1">
                {decisionCache.map((result, index) => {
                  if (result === undefined) return null;

                  try {
                    const decision = resolver.resourceManager.decisions.getAt(index);
                    const key = decision.isSuccess() ? decision.value.key : `decision-${index}`;
                    const regularMatches = result.success ? result.instanceIndices.length : 0;
                    const defaultMatches = result.success ? result.defaultInstanceIndices.length : 0;

                    return (
                      <div key={index} className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 truncate max-w-24">
                          {index}: {key}
                        </span>
                        <div className="flex items-center space-x-1">
                          <span
                            className={`px-2 py-1 rounded ${
                              result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {regularMatches} regular
                          </span>
                          {defaultMatches > 0 && (
                            <span className="px-2 py-1 rounded bg-amber-100 text-amber-800">
                              {defaultMatches} default
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  } catch (error) {
                    return (
                      <div key={index} className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">
                          {index}: decision-{index}
                        </span>
                        <span
                          className={`px-2 py-1 rounded ${
                            result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          decision-{index} ({result.success ? result.instanceIndices.length : '0'})
                        </span>
                      </div>
                    );
                  }
                })}
              </div>
            </div>
          )}

          {totalCacheEntries === 0 && (
            <div className="text-center text-xs text-gray-500 py-4">
              No cache entries. Resolve a resource to populate the cache.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ResolutionViewer: React.FC<ResolutionViewerProps> = ({
  onMessage,
  resourceManager,
  filterState,
  filterResult
}) => {
  const { state: resourceState } = resourceManager;

  // Use filtered resources when filtering is active and successful
  const isFilteringActive = filterState.enabled && filterResult?.success === true;
  const activeProcessedResources = isFilteringActive
    ? filterResult?.processedResources
    : resourceState.processedResources;

  // Available qualifiers
  const availableQualifiers = useMemo(() => {
    if (activeProcessedResources?.compiledCollection.qualifiers) {
      // Get qualifier names from the compiled collection
      return activeProcessedResources.compiledCollection.qualifiers.map((q) => q.name);
    }

    // Use active configuration if available, otherwise fall back to default
    const config = resourceState.activeConfiguration || DEFAULT_SYSTEM_CONFIGURATION;
    return config.qualifiers.map((q) => q.name);
  }, [activeProcessedResources?.compiledCollection.qualifiers, resourceState.activeConfiguration]);

  // Get qualifier type information for UI decisions
  const qualifierTypeInfo = useMemo(() => {
    const info: Record<
      string,
      {
        type: Config.Model.ISystemConfiguration['qualifierTypes'][0];
        enumeratedValues?: string[];
      }
    > = {};

    // Get the active configuration to access qualifier types
    const config = resourceState.activeConfiguration || DEFAULT_SYSTEM_CONFIGURATION;

    // Create a map of qualifier name to qualifier type for quick lookup
    const qualifierTypeMap: Record<string, Config.Model.ISystemConfiguration['qualifierTypes'][0]> = {};

    // First, create a mapping of qualifiers to their types
    config.qualifiers.forEach((qualifier) => {
      const qualifierType = config.qualifierTypes.find((qt) => qt.name === qualifier.typeName);
      if (qualifierType) {
        qualifierTypeMap[qualifier.name] = qualifierType;
      }
    });

    // Build info for each qualifier
    availableQualifiers.forEach((qualifierName) => {
      const qualifierType = qualifierTypeMap[qualifierName];
      if (qualifierType) {
        info[qualifierName] = { type: qualifierType };

        // Extract enumerated values for literal types
        if (
          qualifierType.systemType === 'literal' &&
          qualifierType.configuration &&
          typeof qualifierType.configuration === 'object' &&
          'enumeratedValues' in qualifierType.configuration &&
          Array.isArray(qualifierType.configuration.enumeratedValues)
        ) {
          info[qualifierName].enumeratedValues = qualifierType.configuration.enumeratedValues;
        }
      }
    });

    return info;
  }, [availableQualifiers, resourceState.activeConfiguration]);

  // Initialize context with smart default values based on qualifier types
  const defaultContextValues = useMemo(() => {
    const defaults: ContextState = {};

    // Compute intelligent defaults based on qualifier types
    availableQualifiers.forEach((qualifierName) => {
      const typeInfo = qualifierTypeInfo[qualifierName];

      if (!typeInfo) {
        // No type info available, use empty string
        defaults[qualifierName] = '';
        return;
      }

      const qualifierType = typeInfo.type;

      // Compute default based on system type
      switch (qualifierType.systemType) {
        case 'language':
          // Language qualifiers default to en-US
          defaults[qualifierName] = 'en-US';
          break;

        case 'territory':
          // Territory qualifiers: use first allowed territory if constrained, otherwise US
          if (
            qualifierType.configuration &&
            typeof qualifierType.configuration === 'object' &&
            'allowedTerritories' in qualifierType.configuration &&
            Array.isArray(qualifierType.configuration.allowedTerritories) &&
            qualifierType.configuration.allowedTerritories.length > 0
          ) {
            defaults[qualifierName] = qualifierType.configuration.allowedTerritories[0];
          } else {
            defaults[qualifierName] = 'US';
          }
          break;

        case 'literal':
          // Literal qualifiers: use first enumerated value if constrained, otherwise "unknown"
          if (typeInfo.enumeratedValues && typeInfo.enumeratedValues.length > 0) {
            defaults[qualifierName] = typeInfo.enumeratedValues[0];
          } else {
            defaults[qualifierName] = 'unknown';
          }
          break;

        default:
          defaults[qualifierName] = '';
      }
    });

    return defaults;
  }, [availableQualifiers, qualifierTypeInfo]);

  // Context state
  const [contextValues, setContextValues] = useState<ContextState>({});
  const [pendingContextValues, setPendingContextValues] = useState<ContextState>({});

  // Update context state when default values change
  React.useEffect(() => {
    setContextValues(defaultContextValues);
    setPendingContextValues(defaultContextValues);
  }, [defaultContextValues]);

  // Selection state
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('best');

  // Resolution state
  const [currentResolver, setCurrentResolver] = useState<Runtime.ResourceResolver | null>(null);
  const [resolutionResult, setResolutionResult] = useState<ResolutionResult | null>(null);

  // Track if we've auto-applied defaults for the current configuration
  const [hasAutoApplied, setHasAutoApplied] = useState(false);

  // Cache metrics state
  const [cacheMetrics, setCacheMetrics] =
    useState<Runtime.ResourceResolverCacheMetricsListener<Runtime.AggregateCacheMetrics> | null>(null);

  // Edit journal state
  const [editedResources, setEditedResources] = useState<EditedResources>(new Map());

  // Simple edit management functions
  const hasUnsavedEdits = useCallback(() => {
    return editedResources.size > 0;
  }, [editedResources]);

  const saveEdit = useCallback((resourceId: string, editedValue: any) => {
    setEditedResources((prev) => new Map(prev).set(resourceId, editedValue));
  }, []);

  const getEditedValue = useCallback(
    (resourceId: string) => {
      return editedResources.get(resourceId);
    },
    [editedResources]
  );

  const clearEdits = useCallback(() => {
    setEditedResources(new Map());
  }, []);

  // Available resources
  const availableResources = useMemo(() => {
    if (!activeProcessedResources?.summary?.resourceIds) {
      return [];
    }
    return activeProcessedResources.summary.resourceIds.sort();
  }, [activeProcessedResources?.summary?.resourceIds]);

  // Check if there are pending context changes
  const hasPendingChanges = useMemo(() => {
    return JSON.stringify(contextValues) !== JSON.stringify(pendingContextValues);
  }, [contextValues, pendingContextValues]);

  // Helper functions for condition set keys (similar to CompiledBrowser)
  const getConditionKey = useCallback((condition: any, compiledCollection: any): string => {
    try {
      // Use metadata if available
      if (condition.metadata?.key) {
        return condition.metadata.key;
      }

      // Fall back to manual construction
      const qualifier = compiledCollection.qualifiers[condition.qualifierIndex];
      if (!qualifier) return `unknown-qualifier`;

      // Create a meaningful key like "language=en-US" or "territory=US"
      const key = `${qualifier.name}=${condition.value}`;
      return key;
    } catch (error) {
      return `condition-${condition.qualifierIndex}`;
    }
  }, []);

  const getConditionSetKey = useCallback(
    (conditionSet: any, conditionSetIndex: number, compiledCollection: any): string => {
      try {
        // Use metadata if available
        if (conditionSet.metadata?.key) {
          return conditionSet.metadata.key;
        }

        if (conditionSetIndex === 0) {
          return 'unconditional';
        }

        // Fall back to manual construction
        if (!conditionSet.conditions || conditionSet.conditions.length === 0) {
          return `condition-set-${conditionSetIndex}`;
        }

        // Build a composite key from all conditions in the set
        const conditionKeys = conditionSet.conditions.map((conditionIndex: number) => {
          const condition = compiledCollection.conditions[conditionIndex];
          if (!condition) return `unknown-${conditionIndex}`;
          return getConditionKey(condition, compiledCollection);
        });

        return conditionKeys.join(',');
      } catch (error) {
        return `condition-set-${conditionSetIndex}`;
      }
    },
    [getConditionKey]
  );

  // Removed complex condition set key tracking

  // Removed complex condition set hash tracking

  // Apply context changes
  const applyContext = useCallback(() => {
    if (!activeProcessedResources?.system) {
      onMessage?.('error', 'No resources loaded');
      return;
    }

    // Check for pending edits
    if (hasUnsavedEdits()) {
      const changeCount = editedResources.size;
      const confirmMessage =
        changeCount === 1
          ? 'You have 1 resource with unsaved changes. Apply context change anyway? This will discard your edits.'
          : `You have ${changeCount} resources with unsaved changes. Apply context change anyway? This will discard your edits.`;

      if (!window.confirm(confirmMessage)) {
        return; // User cancelled
      }

      // User confirmed - clear the edits
      clearEdits();
    }

    // Create new context provider
    const contextResult = createSimpleContext(pendingContextValues, activeProcessedResources.system);
    if (contextResult.isFailure()) {
      onMessage?.('error', `Failed to create context: ${contextResult.message}`);
      return;
    }

    // Reset existing cache and metrics when context changes
    if (currentResolver && cacheMetrics) {
      currentResolver.clearConditionCache();
      cacheMetrics.reset();
    }

    // Create cache metrics listener
    const metricsListener = new Runtime.ResourceResolverCacheMetricsListener(
      () => new Runtime.AggregateCacheMetrics()
    );
    setCacheMetrics(metricsListener);

    // Create new resource resolver
    const resolverResult = Runtime.ResourceResolver.create({
      resourceManager: activeProcessedResources.system.resourceManager,
      qualifierTypes: activeProcessedResources.system.qualifierTypes,
      contextQualifierProvider: contextResult.value,
      listener: metricsListener
    });

    if (resolverResult.isFailure()) {
      onMessage?.('error', `Failed to create resolver: ${resolverResult.message}`);
      return;
    }

    // Update state
    setContextValues({ ...pendingContextValues });
    setCurrentResolver(resolverResult.value);

    // If a resource is selected, resolve it with the new context
    if (selectedResourceId) {
      resolveSelectedResource(resolverResult.value, selectedResourceId);
    }

    onMessage?.('success', 'Context applied successfully');
  }, [
    pendingContextValues,
    activeProcessedResources?.system,
    selectedResourceId,
    onMessage,
    hasUnsavedEdits,
    editedResources,
    clearEdits
  ]);

  // Helper function to evaluate conditions for a candidate
  const evaluateConditionsForCandidate = useCallback(
    (
      resolver: Runtime.ResourceResolver,
      candidateIndex: number,
      compiledResource: any,
      compiledCollection: any
    ): ConditionEvaluationResult[] => {
      try {
        const decision = compiledCollection.decisions[compiledResource.decision];
        if (!decision || !decision.conditionSets || candidateIndex >= decision.conditionSets.length) {
          return [];
        }

        const conditionSetIndex = decision.conditionSets[candidateIndex];
        const conditionSet = compiledCollection.conditionSets[conditionSetIndex];
        if (!conditionSet || !conditionSet.conditions) {
          return [];
        }

        const evaluations: ConditionEvaluationResult[] = [];

        for (const conditionIndex of conditionSet.conditions) {
          const condition = compiledCollection.conditions[conditionIndex];
          if (!condition) continue;

          const qualifier = compiledCollection.qualifiers[condition.qualifierIndex];
          if (!qualifier) continue;

          // Get the qualifier value from context
          const qualifierValueResult = resolver.contextQualifierProvider.get(qualifier);
          const qualifierValue = qualifierValueResult.isSuccess() ? qualifierValueResult.value : null;

          // Get the cached condition result from resolver
          const cachedResult = resolver.conditionCache[conditionIndex] as IConditionMatchResult;
          const score = cachedResult?.score || 0;
          const matchType = cachedResult?.matchType || 'noMatch';
          const matched = matchType !== 'noMatch';

          evaluations.push({
            qualifierName: qualifier.name,
            qualifierValue,
            conditionValue: condition.value,
            operator: condition.operator || 'eq',
            score,
            matched,
            matchType,
            scoreAsDefault: condition.scoreAsDefault,
            conditionIndex
          });
        }

        return evaluations;
      } catch (error) {
        console.warn('Error evaluating conditions for candidate:', error);
        return [];
      }
    },
    []
  );

  // Resolve the currently selected resource
  const resolveSelectedResource = useCallback(
    (resolver: Runtime.ResourceResolver, resourceId: string) => {
      if (
        !activeProcessedResources?.system.resourceManager ||
        !activeProcessedResources?.compiledCollection
      ) {
        setResolutionResult({ success: false, error: 'No resource manager available' });
        return;
      }

      const resourceResult = activeProcessedResources.system.resourceManager.getBuiltResource(resourceId);
      if (resourceResult.isFailure()) {
        setResolutionResult({
          success: false,
          error: `Failed to get resource: ${resourceResult.message}`
        });
        return;
      }

      const resource = resourceResult.value;
      const compiledCollection = activeProcessedResources.compiledCollection;

      // Find the compiled resource for condition set keys
      const compiledResource = compiledCollection.resources.find((r) => r.id === resourceId);
      if (!compiledResource) {
        setResolutionResult({
          success: false,
          error: 'Failed to find compiled resource'
        });
        return;
      }

      // Resolve best candidate
      const bestResult = resolver.resolveResource(resource);

      // Resolve all candidates
      const allResult = resolver.resolveAllResourceCandidates(resource);

      // Resolve composed value
      const composedResult = resolver.resolveComposedResourceValue(resource);

      // Get decision resolution result to understand which candidates are regular vs default matches
      const decisionResult = resolver.resolveDecision(resource.decision.baseDecision);
      const decision = decisionResult.isSuccess() ? decisionResult.value : null;

      // Build detailed candidate information, preserving priority order for matched candidates
      const candidateDetails: CandidateInfo[] = [];
      const matchedCandidates = allResult.isSuccess() ? allResult.value : [];

      // Create lookup sets for regular and default matches
      const regularMatchIndices = new Set(decision?.success ? decision.instanceIndices : []);
      const defaultMatchIndices = new Set(decision?.success ? decision.defaultInstanceIndices : []);

      // First, add matched candidates in priority order (regular matches first, then defaults)
      matchedCandidates.forEach((matchedCandidate) => {
        // Find the index by comparing candidate objects
        const index = resource.candidates.findIndex((candidate) => candidate === matchedCandidate);
        if (index !== -1) {
          const conditionSetKey = matchedCandidate.conditions.toHash(); // Use actual condition set hash
          const conditionEvaluations = evaluateConditionsForCandidate(
            resolver,
            index,
            compiledResource,
            compiledCollection
          );

          const isDefaultMatch = defaultMatchIndices.has(index);
          const isRegularMatch = regularMatchIndices.has(index);

          // Determine overall match type for this candidate
          const candidateMatchType: ConditionMatchType = isRegularMatch
            ? 'match'
            : isDefaultMatch
            ? 'matchAsDefault'
            : 'noMatch';

          candidateDetails.push({
            candidate: resource.candidates[index],
            conditionSetKey,
            candidateIndex: index,
            matched: true,
            matchType: candidateMatchType,
            isDefaultMatch,
            conditionEvaluations
          });
        }
      });

      // Then, add non-matching candidates in their original order
      resource.candidates.forEach((candidate, index) => {
        const isMatched = matchedCandidates.some((mc) => mc === candidate);
        if (!isMatched) {
          const conditionSetKey = candidate.conditions.toHash(); // Use actual condition set hash
          const conditionEvaluations = evaluateConditionsForCandidate(
            resolver,
            index,
            compiledResource,
            compiledCollection
          );

          candidateDetails.push({
            candidate,
            conditionSetKey,
            candidateIndex: index,
            matched: false,
            matchType: 'noMatch',
            isDefaultMatch: false,
            conditionEvaluations
          });
        }
      });

      if (bestResult.isFailure() && allResult.isFailure()) {
        setResolutionResult({
          success: false,
          resource,
          candidateDetails,
          error: `Resolution failed: ${bestResult.message}`
        });
        return;
      }

      const resolutionData = {
        success: true,
        resource,
        bestCandidate: bestResult.isSuccess() ? bestResult.value : undefined,
        allCandidates: allResult.isSuccess() ? allResult.value : undefined,
        candidateDetails,
        composedValue: composedResult.isSuccess() ? composedResult.value : undefined,
        error: bestResult.isFailure() ? bestResult.message : undefined
      };

      setResolutionResult(resolutionData);

      // Pre-create journal entry for the composed value if it exists (only if not already in journal)
      if (composedResult.isSuccess() && composedResult.value !== undefined) {
        // For composed values, we use a special hash since it's composed from multiple candidates
        // In simplified approach, we don't pre-create journal entries
      }
    },
    [
      activeProcessedResources?.system.resourceManager,
      activeProcessedResources?.compiledCollection,
      evaluateConditionsForCandidate
    ]
  );

  // Handle resource selection
  const handleResourceSelect = useCallback(
    (resourceId: string) => {
      setSelectedResourceId(resourceId);
      setResolutionResult(null);

      if (currentResolver) {
        resolveSelectedResource(currentResolver, resourceId);
      }

      onMessage?.('info', `Selected resource: ${resourceId}`);
    },
    [currentResolver, resolveSelectedResource, onMessage]
  );

  // Handle context value change
  const handleContextChange = useCallback((qualifierName: string, value: string | undefined) => {
    setPendingContextValues((prev) => ({
      ...prev,
      [qualifierName]: value
    }));
  }, []);

  // Handle cache reset
  const handleCacheReset = useCallback(() => {
    if (currentResolver && cacheMetrics) {
      currentResolver.clearConditionCache();
      cacheMetrics.reset();
      onMessage?.('info', 'Cache cleared and metrics reset');
    }
  }, [currentResolver, cacheMetrics, onMessage]);

  // Reset auto-apply flag when defaults change
  React.useEffect(() => {
    setHasAutoApplied(false);
  }, [defaultContextValues]);

  // Auto-apply default context when resources are loaded or defaults change
  React.useEffect(() => {
    if (activeProcessedResources?.system && Object.keys(defaultContextValues).length > 0 && !hasAutoApplied) {
      // Apply the default context automatically
      applyContext();
      setHasAutoApplied(true);
    }
  }, [activeProcessedResources?.system, defaultContextValues, hasAutoApplied, applyContext]);

  if (!resourceState.processedResources) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <MagnifyingGlassIcon className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Resolution Viewer</h2>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">No Resources Loaded</h3>
            <p className="text-gray-600 mb-6">
              Import resources to test resource resolution with different contexts.
            </p>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> Use the Import Tool to load resources, then return here to test how they
                resolve with different qualifier contexts.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <MagnifyingGlassIcon className="h-8 w-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Resolution Viewer</h2>
        {isFilteringActive && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            Filtered
          </span>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Context Input Panel */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Context Configuration</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableQualifiers.map((qualifierName) => {
                  const typeInfo = qualifierTypeInfo[qualifierName];
                  const hasEnumeratedValues =
                    typeInfo?.enumeratedValues && typeInfo.enumeratedValues.length > 0;

                  return (
                    <div key={qualifierName} className="bg-white rounded border border-gray-200 p-2">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700 min-w-0 flex-shrink-0">
                          {qualifierName}:
                        </label>
                        {hasEnumeratedValues ? (
                          <select
                            value={pendingContextValues[qualifierName] ?? ''}
                            onChange={(e) =>
                              handleContextChange(
                                qualifierName,
                                e.target.value === '__undefined__' ? undefined : e.target.value
                              )
                            }
                            className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm min-w-0 bg-white"
                          >
                            <option value="" disabled>
                              Select {qualifierName}...
                            </option>
                            {typeInfo!.enumeratedValues!.map((value) => (
                              <option key={value} value={value}>
                                {value}
                              </option>
                            ))}
                            <option value="__undefined__" className="text-gray-500 italic">
                              undefined
                            </option>
                          </select>
                        ) : (
                          <div className="flex-1 flex items-center gap-1">
                            <input
                              type="text"
                              value={pendingContextValues[qualifierName] ?? ''}
                              onChange={(e) => handleContextChange(qualifierName, e.target.value)}
                              className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm min-w-0"
                              placeholder={
                                pendingContextValues[qualifierName] === undefined
                                  ? '(undefined)'
                                  : `Enter ${qualifierName} value`
                              }
                            />
                            {pendingContextValues[qualifierName] !== undefined && (
                              <button
                                type="button"
                                onClick={() => handleContextChange(qualifierName, undefined)}
                                className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                                title="Set to undefined"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Current:{' '}
                {Object.entries(contextValues)
                  .map(([key, value]) => `${key}=${value === undefined ? '(undefined)' : value}`)
                  .join(', ')}
              </div>
              <div className="flex items-center space-x-2">
                {hasUnsavedEdits() && (
                  <>
                    <button
                      onClick={() => {
                        // Build loose candidate declarations from edited resources
                        const looseCandidateDeclarations: any[] = [];

                        // Extract conditions from context values that have defined values
                        const conditions: Record<string, string> = {};
                        Object.entries(contextValues).forEach(([qualifierName, value]) => {
                          if (value !== undefined && value !== '') {
                            conditions[qualifierName] = value;
                          }
                        });

                        // Build loose candidate declaration for each edited resource
                        editedResources.forEach((editedValue, resourceId) => {
                          const looseCandidateDecl = {
                            id: resourceId,
                            json: editedValue,
                            conditions: conditions
                          };
                          looseCandidateDeclarations.push(looseCandidateDecl);
                        });

                        // Display the declarations in the message window
                        const declarationsText = JSON.stringify(looseCandidateDeclarations, null, 2);
                        onMessage?.(
                          'info',
                          `Built ${looseCandidateDeclarations.length} loose candidate declaration(s):\n\n${declarationsText}`
                        );
                      }}
                      className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                      title="Apply all pending edits"
                    >
                      Apply Edits
                    </button>
                    <button
                      onClick={() => {
                        const changeCount = editedResources.size;
                        const confirmMessage =
                          changeCount === 1
                            ? 'Discard 1 pending edit?'
                            : `Discard ${changeCount} pending edits?`;

                        if (window.confirm(confirmMessage)) {
                          clearEdits();
                          onMessage?.('info', 'Discarded all pending changes');
                        }
                      }}
                      className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                      title="Discard all pending edits"
                    >
                      Discard Edits
                    </button>
                  </>
                )}
                <button
                  onClick={applyContext}
                  disabled={!hasPendingChanges}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    hasPendingChanges
                      ? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {hasPendingChanges
                    ? 'Apply Changes'
                    : currentResolver
                    ? 'Context Applied'
                    : 'Apply Context'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Cache Dashboard */}
        <CacheDashboard cacheMetrics={cacheMetrics} resolver={currentResolver} onReset={handleCacheReset} />

        {/* Main Browser/Details Layout */}
        <div className="flex flex-col lg:flex-row gap-6 h-[600px]">
          {/* Left side: Resource Selection and Cache Contents */}
          <div className="lg:w-1/2 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Resources</h3>
              <div className="text-sm text-gray-500">{availableResources.length} available</div>
            </div>

            <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50 mb-4">
              {availableResources.map((resourceId) => (
                <div
                  key={resourceId}
                  className={`flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                    selectedResourceId === resourceId ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                  }`}
                  onClick={() => handleResourceSelect(resourceId)}
                >
                  <DocumentTextIcon className="w-4 h-4 mr-2 text-green-500" />
                  <span
                    className={`text-sm ${
                      selectedResourceId === resourceId ? 'font-medium text-blue-900' : 'text-gray-700'
                    }`}
                  >
                    {resourceId}
                  </span>
                </div>
              ))}
            </div>

            {/* Cache Contents Section */}
            <CacheContentsDisplay resolver={currentResolver} />
          </div>

          {/* Right side: Resolution Results */}
          <div className="lg:w-1/2 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Results</h3>
              {selectedResourceId && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => setViewMode('best')}
                    className={`px-3 py-1 text-xs rounded ${
                      viewMode === 'best' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Best
                  </button>
                  <button
                    onClick={() => setViewMode('all')}
                    className={`px-3 py-1 text-xs rounded ${
                      viewMode === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setViewMode('composed')}
                    className={`px-3 py-1 text-xs rounded ${
                      viewMode === 'composed' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Composed
                  </button>
                  <button
                    onClick={() => setViewMode('raw')}
                    className={`px-3 py-1 text-xs rounded ${
                      viewMode === 'raw' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Raw
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
              {!selectedResourceId ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <CubeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Select a resource to view resolution results</p>
                  </div>
                </div>
              ) : !currentResolver ? (
                <div className="text-center text-gray-500">
                  <p>Apply a context to resolve resources</p>
                </div>
              ) : !resolutionResult ? (
                <div className="text-center text-gray-500">
                  <p>Resolving...</p>
                </div>
              ) : (
                <ResolutionResults
                  result={resolutionResult}
                  viewMode={viewMode}
                  contextValues={contextValues}
                  getEditedValue={getEditedValue}
                  saveEdit={saveEdit}
                  onSave={(saveAction) => {
                    onMessage?.('info', `Changes validated for ${saveAction.type} view`);
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Types for editing functionality
type EditableViewType = 'composed' | 'candidate' | 'raw';

interface EditState {
  isEditing: boolean;
  editedValue: any;
  hasChanges: boolean;
  isValidJson: boolean;
}

interface SaveAction {
  type: EditableViewType;
  onSave: (editedValue: any) => void;
  validateJson?: (value: any) => boolean;
}

// Simple edit tracking
type EditedResources = Map<string, any>; // resourceId -> editedValue

// Resolution Results Component
interface ResolutionResultsProps {
  result: ResolutionResult;
  viewMode: ViewMode;
  contextValues: ContextState;
  onSave?: (saveAction: SaveAction) => void;
  // Journal-related props
  // Simple edit functions
  getEditedValue?: (resourceId: string) => any;
  saveEdit?: (resourceId: string, editedValue: any) => void;
}

// Editable JSON View Component
interface EditableJsonViewProps {
  value: any;
  title: string;
  description?: string;
  viewType: EditableViewType;
  onSave?: (saveAction: SaveAction) => void;
  className?: string;
  // Simple edit tracking props
  resourceId?: string;
  editedValue?: any; // Pre-existing edited value if any
  onEditSave?: (resourceId: string, editedValue: any) => void;
}

const EditableJsonView: React.FC<EditableJsonViewProps> = ({
  value,
  title,
  description,
  viewType,
  onSave,
  className = '',
  resourceId,
  editedValue,
  onEditSave
}) => {
  // Use edited value if available, otherwise use original value
  const displayValue = editedValue ?? value;
  const hasEdit = editedValue !== undefined;

  // Removed debug logging

  const [editState, setEditState] = useState<EditState>({
    isEditing: false,
    editedValue: displayValue,
    hasChanges: false,
    isValidJson: true
  });

  // Reset edit state when resource changes (not when display value changes due to edits)
  React.useEffect(() => {
    setEditState({
      isEditing: false,
      editedValue: displayValue,
      hasChanges: false,
      isValidJson: true
    });
  }, [resourceId]); // Only reset when switching resources, not when displayValue changes

  const handleEdit = useCallback(() => {
    setEditState((prev) => ({ ...prev, isEditing: true, editedValue: displayValue }));
  }, [displayValue]);

  const handleCancel = useCallback(() => {
    setEditState({
      isEditing: false,
      editedValue: displayValue,
      hasChanges: false,
      isValidJson: true
    });
  }, [displayValue]);

  const handleChange = useCallback(
    (updatedValue: any) => {
      try {
        // Validate that it's valid JSON by trying to stringify and parse
        const jsonString = JSON.stringify(updatedValue);
        JSON.parse(jsonString);

        setEditState((prev) => ({
          ...prev,
          editedValue: updatedValue,
          hasChanges: JSON.stringify(updatedValue) !== JSON.stringify(value),
          isValidJson: true
        }));
      } catch (error) {
        setEditState((prev) => ({
          ...prev,
          editedValue: updatedValue,
          hasChanges: true,
          isValidJson: false
        }));
      }
    },
    [value]
  );

  const handleSave = useCallback(() => {
    if (!editState.isValidJson || !editState.hasChanges) return;

    // Save edit using simplified approach
    if (onEditSave && resourceId) {
      onEditSave(resourceId, editState.editedValue);
    }

    // Call the save action if provided
    if (onSave) {
      const saveAction: SaveAction = {
        type: viewType,
        onSave: (editedValue) => {
          // Save action for potential future use
        },
        validateJson: (val) => {
          try {
            JSON.stringify(val);
            return true;
          } catch {
            return false;
          }
        }
      };
      // Call saveAction.onSave with the edited value
      saveAction.onSave(editState.editedValue);
      // Then call the main onSave with the saveAction for any additional handling
      onSave(saveAction);
    }

    setEditState((prev) => ({
      ...prev,
      isEditing: false,
      hasChanges: false,
      editedValue: displayValue // Reset to current display value to sync with saved state
    }));
  }, [editState, viewType, onSave, onEditSave, resourceId]);

  if (!value) {
    return null;
  }

  return (
    <div className={`bg-white p-3 rounded border ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="flex items-center space-x-2">
            <h4 className="font-medium text-gray-800">{title}</h4>
            {hasEdit && (
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded font-medium">
                Edited
              </span>
            )}
          </div>
          {description && <div className="text-sm font-medium text-gray-700 mt-1">{description}</div>}
        </div>
        <div className="flex items-center space-x-2">
          {editState.isEditing ? (
            <>
              <button
                onClick={handleCancel}
                className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                title="Cancel editing"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
              <button
                onClick={handleSave}
                disabled={!editState.hasChanges || !editState.isValidJson}
                className={`px-3 py-1 text-xs font-medium rounded focus:outline-none focus:ring-2 ${
                  editState.hasChanges && editState.isValidJson
                    ? 'text-white bg-green-600 hover:bg-green-700 focus:ring-green-500'
                    : 'text-gray-400 bg-gray-300 cursor-not-allowed'
                }`}
                title={
                  !editState.isValidJson
                    ? 'Invalid JSON'
                    : !editState.hasChanges
                    ? 'No changes to save'
                    : 'Save changes'
                }
              >
                <CheckIcon className="h-4 w-4" />
              </button>
            </>
          ) : (
            <button
              onClick={handleEdit}
              className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Edit JSON"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {editState.isEditing ? (
        <div className="space-y-2">
          <JsonEditor
            data={editState.editedValue}
            setData={handleChange}
            restrictAdd={false}
            restrictEdit={false}
            restrictDelete={false}
          />
          {!editState.isValidJson && (
            <div className="text-xs text-red-600 bg-red-50 p-2 rounded">Invalid JSON format</div>
          )}
        </div>
      ) : (
        <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
          {JSON.stringify(displayValue, null, 2)}
        </pre>
      )}
    </div>
  );
};

const ResolutionResults: React.FC<ResolutionResultsProps> = ({
  result,
  viewMode,
  contextValues,
  onSave,
  getEditedValue,
  saveEdit
}) => {
  if (!result.success) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h4 className="font-medium text-red-800 mb-2">Resolution Failed</h4>
        <p className="text-sm text-red-600">{result.error}</p>
      </div>
    );
  }

  if (viewMode === 'raw') {
    return (
      <div className="space-y-4">
        <div>
          <h4 className="font-medium text-gray-800 mb-2">Raw Resolution Data</h4>
          <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
            {JSON.stringify(
              {
                context: contextValues,
                resource: result.resource
                  ? {
                      id: result.resource.id,
                      candidateCount: result.resource.candidates.length
                    }
                  : null,
                bestCandidate: result.bestCandidate?.json,
                allCandidates: result.allCandidates?.map((c) => c.json),
                composedValue: result.composedValue,
                error: result.error
              },
              null,
              2
            )}
          </pre>
        </div>
      </div>
    );
  }

  if (viewMode === 'composed') {
    return (
      <div className="space-y-4">
        {result.composedValue ? (
          <EditableJsonView
            value={result.composedValue}
            title="Composed Resource Value"
            description="Composed value from all matching candidates"
            viewType="composed"
            onSave={onSave}
            resourceId={result.resource?.id}
            editedValue={result.resource?.id ? getEditedValue(result.resource.id) : undefined}
            onEditSave={(resourceId, editedValue) => {
              saveEdit(resourceId, editedValue);
            }}
          />
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <p className="text-sm text-yellow-800">No composed value available for the current context.</p>
            {result.error && <p className="text-xs text-yellow-600 mt-1">{result.error}</p>}
          </div>
        )}

        {result.resource && (
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Resource Info</h4>
            <div className="bg-white p-3 rounded border text-sm">
              <div>
                <strong>ID:</strong> {result.resource.id}
              </div>
              <div>
                <strong>Type:</strong> {result.resource.resourceType.key}
              </div>
              <div>
                <strong>Total Candidates:</strong> {result.resource.candidates.length}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (viewMode === 'all') {
    const regularMatchingCandidates =
      result.candidateDetails?.filter((c) => c.matched && !c.isDefaultMatch) || [];
    const defaultMatchingCandidates =
      result.candidateDetails?.filter((c) => c.matched && c.isDefaultMatch) || [];
    const nonMatchingCandidates = result.candidateDetails?.filter((c) => !c.matched) || [];

    const getMatchTypeColor = (type: ConditionMatchType) => {
      switch (type) {
        case 'match':
          return 'bg-green-100 text-green-800';
        case 'matchAsDefault':
          return 'bg-amber-100 text-amber-800';
        case 'noMatch':
          return 'bg-red-100 text-red-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };

    const getMatchTypeIcon = (type: ConditionMatchType) => {
      switch (type) {
        case 'match':
          return '✓';
        case 'matchAsDefault':
          return '≈';
        case 'noMatch':
          return '✗';
        default:
          return '?';
      }
    };

    return (
      <div className="space-y-4">
        {/* Regular Matching Candidates */}
        {regularMatchingCandidates.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Regular Matches</h4>
            <div className="space-y-2">
              {regularMatchingCandidates.map((candidateInfo, index) => (
                <div
                  key={`${selectedResource}-${candidateInfo.candidateIndex}`}
                  className="bg-white p-3 rounded border border-green-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                      <span>
                        Candidate {candidateInfo.candidateIndex + 1} {index === 0 ? '(Best Match)' : ''}
                      </span>
                      {candidateInfo.conditionSetKey && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {candidateInfo.conditionSetKey}
                        </span>
                      )}
                      <span
                        className={`px-2 py-1 rounded text-xs ${getMatchTypeColor(candidateInfo.matchType)}`}
                      >
                        {getMatchTypeIcon(candidateInfo.matchType)} {candidateInfo.matchType}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs">
                      {candidateInfo.candidate.isPartial && (
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Partial</span>
                      )}
                      {candidateInfo.candidate.mergeMethod && (
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {candidateInfo.candidate.mergeMethod}
                        </span>
                      )}
                    </div>
                  </div>
                  <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto mt-2">
                    {JSON.stringify(candidateInfo.candidate.json, null, 2)}
                  </pre>
                  {candidateInfo.conditionEvaluations && (
                    <ConditionEvaluationDisplay evaluations={candidateInfo.conditionEvaluations} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Default Matching Candidates */}
        {defaultMatchingCandidates.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Default Matches</h4>
            <div className="space-y-2">
              {defaultMatchingCandidates.map((candidateInfo, index) => (
                <div
                  key={`${selectedResource}-default-${candidateInfo.candidateIndex}`}
                  className="bg-white p-3 rounded border border-amber-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                      <span>Candidate {candidateInfo.candidateIndex + 1}</span>
                      {candidateInfo.conditionSetKey && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {candidateInfo.conditionSetKey}
                        </span>
                      )}
                      <span
                        className={`px-2 py-1 rounded text-xs ${getMatchTypeColor(candidateInfo.matchType)}`}
                      >
                        {getMatchTypeIcon(candidateInfo.matchType)} {candidateInfo.matchType}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs">
                      {candidateInfo.candidate.isPartial && (
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Partial</span>
                      )}
                      {candidateInfo.candidate.mergeMethod && (
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {candidateInfo.candidate.mergeMethod}
                        </span>
                      )}
                    </div>
                  </div>
                  <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto mt-2">
                    {JSON.stringify(candidateInfo.candidate.json, null, 2)}
                  </pre>
                  {candidateInfo.conditionEvaluations && (
                    <ConditionEvaluationDisplay evaluations={candidateInfo.conditionEvaluations} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Show message when no matches */}
        {regularMatchingCandidates.length === 0 && defaultMatchingCandidates.length === 0 && (
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Matching Candidates</h4>
            <p className="text-sm text-gray-600">No candidates matched the current context.</p>
          </div>
        )}

        {/* Non-matching Candidates */}

        {nonMatchingCandidates.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-500 mb-2">Non-matching Candidates</h4>
            <div className="space-y-2">
              {nonMatchingCandidates.map((candidateInfo) => (
                <div
                  key={`${selectedResource}-nonmatching-${candidateInfo.candidateIndex}`}
                  className="bg-gray-50 p-3 rounded border border-gray-200 opacity-75"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-gray-500">
                      Candidate {candidateInfo.candidateIndex + 1}
                      {candidateInfo.conditionSetKey && (
                        <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                          {candidateInfo.conditionSetKey}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-xs">
                      {candidateInfo.candidate.isPartial && (
                        <span className="bg-yellow-200 text-yellow-700 px-2 py-1 rounded">Partial</span>
                      )}
                      {candidateInfo.candidate.mergeMethod && (
                        <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded">
                          {candidateInfo.candidate.mergeMethod}
                        </span>
                      )}
                    </div>
                  </div>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto text-gray-600">
                    {JSON.stringify(candidateInfo.candidate.json, null, 2)}
                  </pre>
                  {candidateInfo.conditionEvaluations && (
                    <ConditionEvaluationDisplay evaluations={candidateInfo.conditionEvaluations} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Best candidate view
  const bestCandidateInfo = result.candidateDetails?.find((c) => c.matched);

  const getMatchTypeColor = (type: ConditionMatchType) => {
    switch (type) {
      case 'match':
        return 'bg-green-100 text-green-800';
      case 'matchAsDefault':
        return 'bg-amber-100 text-amber-800';
      case 'noMatch':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMatchTypeIcon = (type: ConditionMatchType) => {
    switch (type) {
      case 'match':
        return '✓';
      case 'matchAsDefault':
        return '≈';
      case 'noMatch':
        return '✗';
      default:
        return '?';
    }
  };

  const getMatchDescription = (candidateInfo: CandidateInfo | undefined) => {
    if (!candidateInfo) return 'Selected candidate for current context';

    if (candidateInfo.isDefaultMatch) {
      return 'Selected candidate (matched via default values)';
    } else {
      return 'Selected candidate (direct match)';
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium text-gray-800 mb-2">Best Match</h4>
        {result.bestCandidate ? (
          <div
            className={`bg-white p-3 rounded border ${
              bestCandidateInfo?.isDefaultMatch ? 'border-amber-200' : 'border-green-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                <span>{getMatchDescription(bestCandidateInfo)}</span>
                {bestCandidateInfo?.conditionSetKey && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {bestCandidateInfo.conditionSetKey}
                  </span>
                )}
                {bestCandidateInfo && (
                  <span
                    className={`px-2 py-1 rounded text-xs ${getMatchTypeColor(bestCandidateInfo.matchType)}`}
                  >
                    {getMatchTypeIcon(bestCandidateInfo.matchType)} {bestCandidateInfo.matchType}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2 text-xs">
                {result.bestCandidate.isPartial && (
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Partial</span>
                )}
                {result.bestCandidate.mergeMethod && (
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    {result.bestCandidate.mergeMethod}
                  </span>
                )}
              </div>
            </div>
            <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
              {JSON.stringify(result.bestCandidate.json, null, 2)}
            </pre>
            {bestCandidateInfo?.conditionEvaluations && (
              <ConditionEvaluationDisplay evaluations={bestCandidateInfo.conditionEvaluations} />
            )}
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <p className="text-sm text-yellow-800">No best candidate found for the current context.</p>
            {result.error && <p className="text-xs text-yellow-600 mt-1">{result.error}</p>}
          </div>
        )}
      </div>

      {result.resource && (
        <div>
          <h4 className="font-medium text-gray-800 mb-2">Resource Info</h4>
          <div className="bg-white p-3 rounded border text-sm">
            <div>
              <strong>ID:</strong> {result.resource.id}
            </div>
            <div>
              <strong>Type:</strong> {result.resource.resourceType.key}
            </div>
            <div>
              <strong>Total Candidates:</strong> {result.resource.candidates.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResolutionViewer;
