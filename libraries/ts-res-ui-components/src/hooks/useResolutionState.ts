import React, { useState, useCallback, useMemo } from 'react';
import { Runtime } from '@fgv/ts-res';
import { ResolutionState, ResolutionActions, ResolutionResult, ProcessedResources } from '../types';
import {
  createResolverWithContext,
  resolveResourceDetailed,
  getAvailableQualifiers,
  hasPendingContextChanges
} from '../utils/resolutionUtils';

export interface UseResolutionStateReturn {
  state: ResolutionState;
  actions: ResolutionActions;
  availableQualifiers: string[];
}

export function useResolutionState(
  processedResources: ProcessedResources | null,
  onMessage?: (type: 'info' | 'warning' | 'error' | 'success', message: string) => void
): UseResolutionStateReturn {
  // Get available qualifiers
  const availableQualifiers = useMemo(() => {
    if (!processedResources) return [];
    return getAvailableQualifiers(processedResources);
  }, [processedResources]);

  // Initialize context with all qualifiers undefined
  const defaultContextValues = useMemo(() => {
    const defaults: Record<string, string | undefined> = {};
    availableQualifiers.forEach((qualifierName) => {
      defaults[qualifierName] = undefined;
    });
    return defaults;
  }, [availableQualifiers]);

  // Resolution state
  const [contextValues, setContextValues] = useState<Record<string, string | undefined>>({});
  const [pendingContextValues, setPendingContextValues] = useState<Record<string, string | undefined>>({});
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [currentResolver, setCurrentResolver] = useState<Runtime.ResourceResolver | null>(null);
  const [resolutionResult, setResolutionResult] = useState<ResolutionResult | null>(null);
  const [viewMode, setViewMode] = useState<'composed' | 'best' | 'all' | 'raw'>('composed');

  // Update context state when defaults change
  React.useEffect(() => {
    setContextValues(defaultContextValues);
    setPendingContextValues(defaultContextValues);
  }, [defaultContextValues]);

  // Check for pending changes
  const hasPendingChanges = useMemo(() => {
    return hasPendingContextChanges(contextValues, pendingContextValues);
  }, [contextValues, pendingContextValues]);

  // Update context value
  const updateContextValue = useCallback((qualifierName: string, value: string | undefined) => {
    setPendingContextValues((prev) => ({
      ...prev,
      [qualifierName]: value
    }));
  }, []);

  // Apply context changes
  const applyContext = useCallback(() => {
    if (!processedResources) {
      onMessage?.('error', 'No resources loaded');
      return;
    }

    try {
      // Create resolver with new context
      const resolverResult = createResolverWithContext(processedResources, pendingContextValues, {
        enableCaching: true,
        enableDebugLogging: false
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
        const resolutionResult = resolveResourceDetailed(
          resolverResult.value,
          selectedResourceId,
          processedResources
        );

        if (resolutionResult.isSuccess()) {
          setResolutionResult(resolutionResult.value);
        } else {
          onMessage?.('error', `Failed to resolve resource: ${resolutionResult.message}`);
        }
      }

      onMessage?.('success', 'Context applied successfully');
    } catch (error) {
      onMessage?.(
        'error',
        `Failed to apply context: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }, [processedResources, pendingContextValues, selectedResourceId, onMessage]);

  // Select resource and resolve it
  const selectResource = useCallback(
    (resourceId: string) => {
      setSelectedResourceId(resourceId);
      setResolutionResult(null);

      if (currentResolver && processedResources) {
        const resolutionResult = resolveResourceDetailed(currentResolver, resourceId, processedResources);

        if (resolutionResult.isSuccess()) {
          setResolutionResult(resolutionResult.value);
          onMessage?.('info', `Selected resource: ${resourceId}`);
        } else {
          onMessage?.('error', `Failed to resolve resource: ${resolutionResult.message}`);
        }
      }
    },
    [currentResolver, processedResources, onMessage]
  );

  // Reset cache
  const resetCache = useCallback(() => {
    if (currentResolver) {
      currentResolver.clearConditionCache();
      onMessage?.('info', 'Cache cleared');
    }
  }, [currentResolver, onMessage]);

  // Auto-apply default context when resources are loaded
  React.useEffect(() => {
    if (processedResources && Object.keys(defaultContextValues).length > 0) {
      applyContext();
    }
  }, [processedResources, defaultContextValues]);

  const state: ResolutionState = {
    contextValues,
    pendingContextValues,
    selectedResourceId,
    currentResolver,
    resolutionResult,
    viewMode,
    hasPendingChanges
  };

  const actions: ResolutionActions = {
    updateContextValue,
    applyContext,
    selectResource,
    setViewMode,
    resetCache
  };

  return {
    state,
    actions,
    availableQualifiers
  };
}
