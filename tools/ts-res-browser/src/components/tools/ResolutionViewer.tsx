import React, { useState, useMemo, useCallback } from 'react';
import { MagnifyingGlassIcon, CubeIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { UseResourceManagerReturn } from '../../hooks/useResourceManager';
import { Message } from '../../types/app';
import { Runtime } from '@fgv/ts-res';
import { createSimpleContext, DEFAULT_SYSTEM_CONFIGURATION } from '../../utils/tsResIntegration';

interface ResolutionViewerProps {
  onMessage?: (type: Message['type'], message: string) => void;
  resourceManager: UseResourceManagerReturn;
}

interface ContextState {
  [qualifierName: string]: string;
}

interface CandidateInfo {
  candidate: Runtime.IResourceCandidate;
  conditionSetKey: string | null;
  candidateIndex: number;
  matched: boolean;
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

const ResolutionViewer: React.FC<ResolutionViewerProps> = ({ onMessage, resourceManager }) => {
  const { state: resourceState } = resourceManager;

  // Available qualifiers
  const availableQualifiers = useMemo(() => {
    if (resourceState.processedResources?.compiledCollection.qualifiers) {
      // Get qualifier names from the compiled collection
      return resourceState.processedResources.compiledCollection.qualifiers.map((q) => q.name);
    }

    // Use active configuration if available, otherwise fall back to default
    const config = resourceState.activeConfiguration || DEFAULT_SYSTEM_CONFIGURATION;
    return config.qualifiers.map((q) => q.name);
  }, [resourceState.processedResources?.compiledCollection.qualifiers, resourceState.activeConfiguration]);

  // Initialize context with default values for available qualifiers
  const defaultContextValues = useMemo(() => {
    const defaults: ContextState = {};

    // Predefined default values
    const predefinedDefaults: Record<string, string> = {
      homeTerritory: 'US',
      currentTerritory: 'US',
      language: 'en-US',
      platform: 'web',
      environment: 'production',
      role: 'user',
      density: 'standard',
      // Additional defaults for various configurations
      env: 'production',
      device: 'desktop',
      graphics: 'medium',
      playerLevel: 'intermediate',
      gameMode: 'single',
      tenant: 'corp',
      securityLevel: 'internal',
      department: 'engineering',
      featureFlag: 'enabled'
    };

    availableQualifiers.forEach((qualifierName) => {
      // Use predefined default if available, otherwise empty string
      defaults[qualifierName] = predefinedDefaults[qualifierName] || '';
    });

    return defaults;
  }, [availableQualifiers]);

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

  // Cache metrics state
  const [cacheMetrics, setCacheMetrics] =
    useState<Runtime.ResourceResolverCacheMetricsListener<Runtime.AggregateCacheMetrics> | null>(null);

  // Available resources
  const availableResources = useMemo(() => {
    if (!resourceState.processedResources?.summary.resourceIds) {
      return [];
    }
    return resourceState.processedResources.summary.resourceIds.sort();
  }, [resourceState.processedResources?.summary.resourceIds]);

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

  const getCandidateConditionSetKey = useCallback(
    (candidateIndex: number, resource: any, compiledCollection: any): string | null => {
      try {
        // Get the decision for this resource
        const decision = compiledCollection.decisions[resource.decision];
        if (!decision || !decision.conditionSets) {
          return null;
        }

        // Map candidate index to condition set index
        // Assuming candidates correspond to condition sets in order
        if (candidateIndex >= decision.conditionSets.length) {
          return null;
        }

        const conditionSetIndex = decision.conditionSets[candidateIndex];
        const conditionSet = compiledCollection.conditionSets[conditionSetIndex];
        if (!conditionSet) {
          return null;
        }

        return getConditionSetKey(conditionSet, conditionSetIndex, compiledCollection);
      } catch (error) {
        return null;
      }
    },
    [getConditionSetKey]
  );

  // Apply context changes
  const applyContext = useCallback(() => {
    if (!resourceState.processedResources?.system) {
      onMessage?.('error', 'No resources loaded');
      return;
    }

    // Create new context provider
    const contextResult = createSimpleContext(pendingContextValues, resourceState.processedResources.system);
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
      resourceManager: resourceState.processedResources.system.resourceManager,
      qualifierTypes: resourceState.processedResources.system.qualifierTypes,
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
  }, [pendingContextValues, resourceState.processedResources?.system, selectedResourceId, onMessage]);

  // Resolve the currently selected resource
  const resolveSelectedResource = useCallback(
    (resolver: Runtime.ResourceResolver, resourceId: string) => {
      if (
        !resourceState.processedResources?.system.resourceManager ||
        !resourceState.processedResources?.compiledCollection
      ) {
        setResolutionResult({ success: false, error: 'No resource manager available' });
        return;
      }

      const resourceResult =
        resourceState.processedResources.system.resourceManager.getBuiltResource(resourceId);
      if (resourceResult.isFailure()) {
        setResolutionResult({
          success: false,
          error: `Failed to get resource: ${resourceResult.message}`
        });
        return;
      }

      const resource = resourceResult.value;
      const compiledCollection = resourceState.processedResources.compiledCollection;

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

      // Build detailed candidate information
      const candidateDetails: CandidateInfo[] = [];
      const matchedCandidates = allResult.isSuccess() ? allResult.value : [];

      resource.candidates.forEach((candidate, index) => {
        const conditionSetKey = getCandidateConditionSetKey(index, compiledResource, compiledCollection);
        const matched = matchedCandidates.some((mc) => mc === candidate);

        candidateDetails.push({
          candidate,
          conditionSetKey,
          candidateIndex: index,
          matched
        });
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

      setResolutionResult({
        success: true,
        resource,
        bestCandidate: bestResult.isSuccess() ? bestResult.value : undefined,
        allCandidates: allResult.isSuccess() ? allResult.value : undefined,
        candidateDetails,
        composedValue: composedResult.isSuccess() ? composedResult.value : undefined,
        error: bestResult.isFailure() ? bestResult.message : undefined
      });
    },
    [
      resourceState.processedResources?.system.resourceManager,
      resourceState.processedResources?.compiledCollection,
      getCandidateConditionSetKey
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
  const handleContextChange = useCallback((qualifierName: string, value: string) => {
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

  // Auto-apply default context when resources are loaded
  React.useEffect(() => {
    if (
      resourceState.processedResources?.system &&
      Object.keys(defaultContextValues).length > 0 &&
      !currentResolver
    ) {
      // Apply the default context automatically
      applyContext();
    }
  }, [resourceState.processedResources?.system, defaultContextValues, currentResolver, applyContext]);

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
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Context Input Panel */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Context Configuration</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="mb-4">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Qualifier</th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {availableQualifiers.map((qualifierName) => (
                    <tr key={qualifierName} className="border-b border-gray-200">
                      <td className="py-2 px-3 text-sm text-gray-700 font-medium w-32">{qualifierName}</td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={pendingContextValues[qualifierName] || ''}
                          onChange={(e) => handleContextChange(qualifierName, e.target.value)}
                          className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder={`Enter ${qualifierName} value`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Current:{' '}
                {Object.entries(contextValues)
                  .map(([key, value]) => `${key}=${value}`)
                  .join(', ')}
              </div>
              <button
                onClick={applyContext}
                disabled={!hasPendingChanges}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  hasPendingChanges
                    ? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {hasPendingChanges ? 'Apply Changes' : currentResolver ? 'Context Applied' : 'Apply Context'}
              </button>
            </div>
          </div>
        </div>

        {/* Cache Dashboard */}
        <CacheDashboard cacheMetrics={cacheMetrics} resolver={currentResolver} onReset={handleCacheReset} />

        {/* Main Browser/Details Layout */}
        <div className="flex flex-col lg:flex-row gap-6 h-[600px]">
          {/* Left side: Resource Selection */}
          <div className="lg:w-1/2 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Resources</h3>
              <div className="text-sm text-gray-500">{availableResources.length} available</div>
            </div>

            <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50">
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
                    onClick={() => setViewMode('raw')}
                    className={`px-3 py-1 text-xs rounded ${
                      viewMode === 'raw' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Raw
                  </button>
                  <button
                    onClick={() => setViewMode('composed')}
                    className={`px-3 py-1 text-xs rounded ${
                      viewMode === 'composed' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Composed
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
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Resolution Results Component
interface ResolutionResultsProps {
  result: ResolutionResult;
  viewMode: ViewMode;
  contextValues: ContextState;
}

const ResolutionResults: React.FC<ResolutionResultsProps> = ({ result, viewMode, contextValues }) => {
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
        <div>
          <h4 className="font-medium text-gray-800 mb-2">Composed Resource Value</h4>
          {result.composedValue ? (
            <div className="bg-white p-3 rounded border">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Composed value from all matching candidates
              </div>
              <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                {JSON.stringify(result.composedValue, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <p className="text-sm text-yellow-800">No composed value available for the current context.</p>
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
  }

  if (viewMode === 'all') {
    const matchingCandidates = result.candidateDetails?.filter((c) => c.matched) || [];
    const nonMatchingCandidates = result.candidateDetails?.filter((c) => !c.matched) || [];

    return (
      <div className="space-y-4">
        <div>
          <h4 className="font-medium text-gray-800 mb-2">Matching Candidates</h4>
          {matchingCandidates.length > 0 ? (
            <div className="space-y-2">
              {matchingCandidates.map((candidateInfo, index) => (
                <div key={candidateInfo.candidateIndex} className="bg-white p-3 rounded border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-gray-700">
                      Candidate {candidateInfo.candidateIndex + 1} {index === 0 ? '(Best Match)' : ''}
                      {candidateInfo.conditionSetKey && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {candidateInfo.conditionSetKey}
                        </span>
                      )}
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
                  <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                    {JSON.stringify(candidateInfo.candidate.json, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">No candidates matched the current context.</p>
          )}
        </div>

        {nonMatchingCandidates.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-500 mb-2">Non-matching Candidates</h4>
            <div className="space-y-2">
              {nonMatchingCandidates.map((candidateInfo) => (
                <div
                  key={candidateInfo.candidateIndex}
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

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium text-gray-800 mb-2">Best Match</h4>
        {result.bestCandidate ? (
          <div className="bg-white p-3 rounded border">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-700">
                Selected candidate for current context
                {bestCandidateInfo?.conditionSetKey && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {bestCandidateInfo.conditionSetKey}
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
