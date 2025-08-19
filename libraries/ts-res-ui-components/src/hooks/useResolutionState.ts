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

/**
 * Return type for the useResolutionState hook.
 *
 * @public
 */
export interface UseResolutionStateReturn {
  /** Current resolution state including context, results, and editing state */
  state: ResolutionState;
  /** Available actions for managing resolution and editing */
  actions: ResolutionActions;
  /** List of available qualifier keys that can be used in the resolution context */
  availableQualifiers: string[];
}

/**
 * Hook for managing resource resolution state and editing operations.
 *
 * This hook provides comprehensive state management for resource resolution,
 * including context management, resource editing, and conflict detection.
 * It integrates with the ts-res library to provide real-time resolution
 * results and supports editing resources with validation and preview functionality.
 *
 * Key features:
 * - **Context Management**: Set and update resolution context (qualifiers)
 * - **Resource Resolution**: Real-time resolution with detailed results
 * - **Resource Editing**: Edit resources with validation and conflict detection
 * - **Preview Mode**: See how edits affect resolution without committing
 * - **Change Tracking**: Track pending changes and detect conflicts
 *
 * @example
 * ```tsx
 * function ResourceResolutionView({ processedResources }: { processedResources: ProcessedResources }) {
 *   const { state, actions, availableQualifiers } = useResolutionState(
 *     processedResources,
 *     (type, message) => console.log(`${type}: ${message}`),
 *     (updatedResources) => {
 *       // Handle system updates when edits are applied
 *       setProcessedResources(updatedResources);
 *     }
 *   );
 *
 *   return (
 *     <div>
 *       <QualifierSelector
 *         availableQualifiers={availableQualifiers}
 *         context={state.context}
 *         onChange={actions.updateContext}
 *       />
 *
 *       <ResourcePicker
 *         selectedResourceId={state.selectedResourceId}
 *         onResourceSelect={(selection) => {
 *           actions.selectResource(selection.resourceId);
 *         }}
 *       />
 *
 *       {state.resolutionResult && (
 *         <ResolutionDisplay
 *           result={state.resolutionResult}
 *           isEditing={state.isEditing}
 *           editedValue={state.editedValue}
 *           onEdit={actions.startEditing}
 *           onSave={actions.saveEdit}
 *           onCancel={actions.cancelEdit}
 *         />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 *
 * @param processedResources - The processed resources to work with
 * @param onMessage - Optional callback for displaying messages to the user
 * @param onSystemUpdate - Optional callback when the resource system is updated with edits
 * @returns Object containing resolution state, actions, and available qualifiers
 * @public
 */
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

  // Resolution state - Three layers:
  // 1. appliedUserValues: User values that have been applied (via Apply button)
  // 2. pendingUserValues: User values that haven't been applied yet
  // 3. hostManagedValues: Values controlled by the host (passed as prop)
  // Effective context = appliedUserValues + hostManagedValues (host overrides user)

  const [appliedUserValues, setAppliedUserValues] = useState<Record<string, string | undefined>>({});
  const [pendingUserValues, setPendingUserValues] = useState<Record<string, string | undefined>>({});
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [currentResolver, setCurrentResolver] = useState<Runtime.ResourceResolver | null>(null);
  const [resolutionResult, setResolutionResult] = useState<ResolutionResult | null>(null);
  const [viewMode, setViewMode] = useState<'composed' | 'best' | 'all' | 'raw'>('composed');

  // Store host-managed values that can be updated via applyContext
  const [hostManagedValues, setHostManagedValues] = useState<Record<string, string | undefined>>({});

  // Compute effective context: user values + host values (host wins)
  const effectiveContext = useMemo(
    () => ({
      ...appliedUserValues,
      ...hostManagedValues
    }),
    [appliedUserValues, hostManagedValues]
  );

  // Edit state - stores original, edited, and delta for each resource
  const [editedResources, setEditedResources] = useState<
    Map<string, { originalValue: JsonValue; editedValue: JsonValue; delta: JsonValue }>
  >(new Map());
  const [isApplyingEdits, setIsApplyingEdits] = useState(false);

  // Update context state when defaults change
  React.useEffect(() => {
    setAppliedUserValues(defaultContextValues);
    setPendingUserValues(defaultContextValues);
  }, [defaultContextValues]);

  // Check for pending changes - only user values, not host values
  const hasPendingChanges = useMemo(() => {
    return hasPendingContextChanges(appliedUserValues, pendingUserValues);
  }, [appliedUserValues, pendingUserValues]);

  // Check for unsaved edits
  const hasUnsavedEdits = useMemo(() => {
    return editedResources.size > 0;
  }, [editedResources]);

  // Update context value (only updates pending user values, not host values)
  const updateContextValue = useCallback((qualifierName: string, value: string | undefined) => {
    setPendingUserValues((prev) => ({
      ...prev,
      [qualifierName]: value
    }));
  }, []);

  // Apply context changes - applies pending user values and/or updates host values
  const applyContext = useCallback(
    (newHostManagedValues?: Record<string, string | undefined>) => {
      if (!processedResources) {
        onMessage?.('error', 'No resources loaded');
        return;
      }

      try {
        if (newHostManagedValues !== undefined) {
          // When called with host values, ONLY update host values
          console.log('Applying host managed values:', newHostManagedValues);
          setHostManagedValues(newHostManagedValues);
        } else {
          // When called without arguments (from Apply button), apply pending user values
          console.log('Applying pending user values:', pendingUserValues);
          setAppliedUserValues(pendingUserValues);

          // Create resolver with the new effective context
          const newEffectiveContext = {
            ...pendingUserValues,
            ...hostManagedValues
          };

          // Create resolver with effective context
          const resolverResult = createResolverWithContext(processedResources, newEffectiveContext, {
            enableCaching: true,
            enableDebugLogging: false
          });

          if (resolverResult.isFailure()) {
            onMessage?.('error', `Failed to create resolver: ${resolverResult.message}`);
            return;
          }

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
        }
      } catch (error) {
        onMessage?.(
          'error',
          `Failed to apply context: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    },
    [processedResources, pendingUserValues, selectedResourceId, onMessage, hostManagedValues]
  );

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

  // Auto-apply when resources are loaded or host values change
  React.useEffect(() => {
    if (!processedResources) return;

    console.log('Auto-applying effective context:', effectiveContext);
    console.log('Host managed values in hook:', hostManagedValues);
    console.log('Applied user values in hook:', appliedUserValues);

    // Create resolver with effective context whenever host values change
    const resolverResult = createResolverWithContext(processedResources, effectiveContext, {
      enableCaching: true,
      enableDebugLogging: false
    });

    if (resolverResult.isSuccess()) {
      setCurrentResolver(resolverResult.value);
      console.log('Resolver created successfully with context:', effectiveContext);

      // Re-resolve selected resource if any
      if (selectedResourceId) {
        console.log('Re-resolving resource:', selectedResourceId);
        const resolutionResult = resolveResourceDetailed(
          resolverResult.value,
          selectedResourceId,
          processedResources
        );

        if (resolutionResult.isSuccess()) {
          console.log('Resolution successful for resource:', selectedResourceId);
          setResolutionResult(resolutionResult.value);
        } else {
          console.error('Resolution failed:', resolutionResult.message);
        }
      }
    } else {
      console.error('Failed to create resolver with effective context:', resolverResult.message);
    }
  }, [processedResources, effectiveContext, selectedResourceId, hostManagedValues, appliedUserValues]);

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
      Object.entries(effectiveContext).forEach(([key, value]) => {
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
  }, [processedResources, editedResources, onSystemUpdate, currentResolver, onMessage]);

  const state: ResolutionState = {
    contextValues: effectiveContext, // Effective context (user + host)
    pendingContextValues: pendingUserValues, // Only user's pending values
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

  const actions: ResolutionActions = useMemo(
    () => ({
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
    }),
    [
      updateContextValue,
      applyContext,
      selectResource,
      setViewMode,
      resetCache,
      saveEdit,
      getEditedValue,
      hasEdit,
      clearEdits,
      applyEdits,
      discardEdits
    ]
  );

  return {
    state,
    actions,
    availableQualifiers
  };
}
