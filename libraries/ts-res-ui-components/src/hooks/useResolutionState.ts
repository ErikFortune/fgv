import React, { useState, useCallback, useMemo } from 'react';
import { Runtime } from '@fgv/ts-res';
import {
  ResolutionState,
  ResolutionActions,
  ResolutionResult,
  ProcessedResources,
  JsonValue
} from '../types';
import {
  createResolverWithContext,
  resolveResourceDetailed,
  getAvailableQualifiers,
  hasPendingContextChanges
} from '../utils/resolutionUtils';
import {
  validateEditedResource,
  computeResourceDelta,
  rebuildSystemWithEdits,
  extractResolutionContext,
  checkEditConflicts
} from '../utils/resolutionEditing';

export interface UseResolutionStateReturn {
  state: ResolutionState;
  actions: ResolutionActions;
  availableQualifiers: string[];
}

export function useResolutionState(
  processedResources: ProcessedResources | null,
  onMessage?: (type: 'info' | 'warning' | 'error' | 'success', message: string) => void,
  onSystemUpdate?: (updatedResources: ProcessedResources) => void
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

  // Edit state - stores original, edited, and delta for each resource
  const [editedResources, setEditedResources] = useState<
    Map<string, { originalValue: JsonValue; editedValue: JsonValue; delta: JsonValue }>
  >(new Map());
  const [isApplyingEdits, setIsApplyingEdits] = useState(false);

  // Update context state when defaults change
  React.useEffect(() => {
    setContextValues(defaultContextValues);
    setPendingContextValues(defaultContextValues);
  }, [defaultContextValues]);

  // Check for pending changes
  const hasPendingChanges = useMemo(() => {
    return hasPendingContextChanges(contextValues, pendingContextValues);
  }, [contextValues, pendingContextValues]);

  // Check for unsaved edits
  const hasUnsavedEdits = useMemo(() => {
    return editedResources.size > 0;
  }, [editedResources]);

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

  // Edit management functions
  const saveEdit = useCallback(
    (resourceId: string, editedValue: JsonValue, originalValue?: JsonValue) => {
      try {
        // Validate the edited value
        const validation = validateEditedResource(editedValue);
        if (!validation.isValid) {
          onMessage?.('error', `Invalid edit: ${validation.errors.join(', ')}`);
          return;
        }

        // Show warnings if any
        if (validation.warnings.length > 0) {
          validation.warnings.forEach((warning) => onMessage?.('warning', warning));
        }

        // Compute the delta between original and edited
        const resolvedValue = originalValue || editedValue; // Use originalValue as the resolved/baseline
        const deltaResult = computeResourceDelta(undefined, resolvedValue, editedValue);

        if (deltaResult.isFailure()) {
          onMessage?.('warning', `Could not compute delta, saving full value: ${deltaResult.message}`);
        }

        const delta = deltaResult.isSuccess() ? deltaResult.value : null;

        // Save the edit with original, edited, and delta
        setEditedResources((prev) => {
          const newMap = new Map(prev);
          newMap.set(resourceId, {
            originalValue: resolvedValue,
            editedValue,
            delta
          });
          return newMap;
        });

        // Log info about delta
        if (delta !== null && delta !== editedValue) {
          const deltaSize = JSON.stringify(delta).length;
          const fullSize = JSON.stringify(editedValue).length;
          const reduction = Math.round((1 - deltaSize / fullSize) * 100);
          onMessage?.('info', `Edit saved for ${resourceId} (delta: ${reduction}% smaller)`);
        } else {
          onMessage?.('info', `Edit saved for resource ${resourceId}`);
        }
      } catch (error) {
        onMessage?.(
          'error',
          `Failed to save edit: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    },
    [onMessage]
  );

  const getEditedValue = useCallback(
    (resourceId: string) => {
      const edit = editedResources.get(resourceId);
      return edit?.editedValue;
    },
    [editedResources]
  );

  const hasEdit = useCallback(
    (resourceId: string) => {
      return editedResources.has(resourceId);
    },
    [editedResources]
  );

  const clearEdits = useCallback(() => {
    setEditedResources(new Map());
    onMessage?.('info', 'All edits cleared');
  }, [onMessage]);

  const discardEdits = useCallback(() => {
    if (hasUnsavedEdits) {
      setEditedResources(new Map());
      onMessage?.('info', 'All unsaved edits discarded');
    }
  }, [hasUnsavedEdits, onMessage]);

  const applyEdits = useCallback(async () => {
    if (!processedResources || editedResources.size === 0) {
      onMessage?.('warning', 'No edits to apply');
      return;
    }

    if (!onSystemUpdate) {
      onMessage?.('error', 'System update callback not provided');
      return;
    }

    setIsApplyingEdits(true);

    try {
      // Extract current resolution context (filter out undefined values)
      const cleanedContextValues: Record<string, string> = {};
      Object.entries(contextValues).forEach(([key, value]) => {
        if (value !== undefined) {
          cleanedContextValues[key] = value;
        }
      });

      const currentContext = extractResolutionContext(
        currentResolver as Runtime.ResourceResolver,
        cleanedContextValues
      );

      // Check for potential conflicts
      const conflictCheck = checkEditConflicts(
        processedResources.system.resourceManager,
        editedResources,
        currentContext
      );

      // Show warnings about potential conflicts
      conflictCheck.warnings.forEach((warning) => onMessage?.('warning', warning));

      if (conflictCheck.conflicts.length > 0) {
        onMessage?.('error', `Conflicts detected: ${conflictCheck.conflicts.join(', ')}`);
        return;
      }

      // Rebuild the system with edits
      const rebuildResult = await rebuildSystemWithEdits(
        processedResources.system,
        editedResources,
        currentContext
      );

      if (rebuildResult.isFailure()) {
        onMessage?.('error', `Failed to apply edits: ${rebuildResult.message}`);
        return;
      }

      // Update the system through the callback
      onSystemUpdate(rebuildResult.value);

      // Clear edits after successful application
      setEditedResources(new Map());

      onMessage?.('success', `Successfully applied ${editedResources.size} edit(s)`);
    } catch (error) {
      onMessage?.('error', `Error applying edits: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsApplyingEdits(false);
    }
  }, [processedResources, editedResources, onSystemUpdate, currentResolver, contextValues, onMessage]);

  const state: ResolutionState = {
    contextValues,
    pendingContextValues,
    selectedResourceId,
    currentResolver,
    resolutionResult,
    viewMode,
    hasPendingChanges,
    // Edit state
    editedResources,
    hasUnsavedEdits,
    isApplyingEdits
  };

  const actions: ResolutionActions = {
    updateContextValue,
    applyContext,
    selectResource,
    setViewMode,
    resetCache,
    // Edit actions
    saveEdit,
    getEditedValue,
    hasEdit,
    clearEdits,
    applyEdits,
    discardEdits
  };

  return {
    state,
    actions,
    availableQualifiers
  };
}
