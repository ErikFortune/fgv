import React, { useState, useCallback, useMemo } from 'react';
import { Runtime, ResourceJson, ResourceTypes, ResourceId } from '@fgv/ts-res';
import type { JsonObject as ResourceJsonObject } from '@fgv/ts-json-base';
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
  const [editedResourcesInternal, setEditedResourcesInternal] = useState<
    Map<string, { originalValue: JsonValue; editedValue: JsonValue; delta: JsonValue }>
  >(new Map());

  // Convert to the simpler Map format expected by ResolutionState
  const editedResources = useMemo(() => {
    const simpleMap = new Map<string, JsonValue>();
    editedResourcesInternal.forEach((value, key) => {
      simpleMap.set(key, value.editedValue);
    });
    return simpleMap;
  }, [editedResourcesInternal]);
  const [isApplyingEdits, setIsApplyingEdits] = useState(false);

  // Pending resource state
  const [pendingResources, setPendingResources] = useState<Map<string, ResourceJson.Json.ILooseResourceDecl>>(
    new Map()
  );
  const [pendingResourceDeletions, setPendingResourceDeletions] = useState<Set<string>>(new Set());
  const [newResourceDraft, setNewResourceDraft] = useState<
    | {
        resourceId: string;
        resourceType: string;
        template: ResourceJson.Json.ILooseResourceDecl;
        isValid: boolean;
      }
    | undefined
  >(undefined);

  // Get available resource types from the processed resources
  const availableResourceTypes = useMemo<ResourceTypes.IResourceType[]>(() => {
    if (!processedResources) return [];
    const types: ResourceTypes.IResourceType[] = [];
    processedResources.system.resourceTypes.forEach((type) => {
      types.push(type as ResourceTypes.IResourceType);
    });
    return types;
  }, [processedResources]);

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

  // Check for pending resource changes
  const hasPendingResourceChanges = useMemo(() => {
    return pendingResources.size > 0 || pendingResourceDeletions.size > 0;
  }, [pendingResources, pendingResourceDeletions]);

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

          // If a resource is selected, resolve it with the new context (skip pending resources)
          if (selectedResourceId && !pendingResources.has(selectedResourceId)) {
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
          } else if (selectedResourceId && pendingResources.has(selectedResourceId)) {
            // Re-create the mock result for pending resource with new context
            const pendingResource = pendingResources.get(selectedResourceId);
            if (pendingResource) {
              const mockResult: ResolutionResult = {
                success: true,
                resourceId: selectedResourceId,
                composedValue: pendingResource.candidates?.[0]?.json || {},
                candidateDetails: (pendingResource.candidates || []).map((c, index) => ({
                  candidate: {
                    json: c.json || {},
                    conditions: c.conditions,
                    isPartial: c.isPartial || false,
                    mergeMethod: c.mergeMethod || 'replace'
                  } as Runtime.IResourceCandidate,
                  conditionSetKey: null,
                  candidateIndex: index,
                  matched: true,
                  matchType: 'match' as const,
                  isDefaultMatch: false
                }))
              };
              setResolutionResult(mockResult);
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
    [
      processedResources,
      pendingUserValues,
      selectedResourceId,
      onMessage,
      hostManagedValues,
      pendingResources
    ]
  );

  // Select resource and resolve it
  const selectResource = useCallback(
    (resourceId: string) => {
      setSelectedResourceId(resourceId);
      setResolutionResult(null);

      // Check if this is a pending new resource
      const pendingResource = pendingResources.get(resourceId);
      if (pendingResource) {
        // For pending new resources, create a mock resolution result
        const mockResult: ResolutionResult = {
          success: true,
          resourceId,
          composedValue: pendingResource.candidates?.[0]?.json || {},
          candidateDetails: (pendingResource.candidates || []).map((c, index) => ({
            candidate: {
              json: c.json || {},
              conditions: c.conditions,
              isPartial: c.isPartial || false,
              mergeMethod: c.mergeMethod || 'replace'
            } as Runtime.IResourceCandidate,
            conditionSetKey: null,
            candidateIndex: index,
            matched: true,
            matchType: 'match' as const,
            isDefaultMatch: false
          }))
        };
        setResolutionResult(mockResult);
        onMessage?.('info', `Selected pending resource: ${resourceId}`);
        return;
      }

      // For existing resources, resolve normally
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
    [currentResolver, processedResources, pendingResources, onMessage]
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

      // Re-resolve selected resource if any (but skip pending resources)
      if (selectedResourceId && !pendingResources.has(selectedResourceId)) {
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
      } else if (selectedResourceId && pendingResources.has(selectedResourceId)) {
        // Keep the existing mock resolution result for pending resources
        console.log('Skipping resolution for pending resource:', selectedResourceId);
      }
    } else {
      console.error('Failed to create resolver with effective context:', resolverResult.message);
    }
  }, [
    processedResources,
    effectiveContext,
    selectedResourceId,
    hostManagedValues,
    appliedUserValues,
    pendingResources
  ]);

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

        // Check if this is a pending new resource
        const pendingResource = pendingResources.get(resourceId);
        if (pendingResource) {
          // Update the pending resource's template directly
          const updatedResource = {
            ...pendingResource,
            candidates: [
              {
                json: (typeof editedValue === 'object' && editedValue !== null && !Array.isArray(editedValue)
                  ? editedValue
                  : { value: editedValue }) as ResourceJsonObject,
                conditions: undefined,
                isPartial: false,
                mergeMethod: 'replace' as const
              }
            ]
          };

          setPendingResources((prev) => {
            const newMap = new Map(prev);
            newMap.set(resourceId, updatedResource);
            return newMap;
          });

          // Update the resolution result to reflect the new value
          if (selectedResourceId === resourceId) {
            const mockResult: ResolutionResult = {
              success: true,
              resourceId,
              composedValue: updatedResource.candidates[0].json,
              candidateDetails: updatedResource.candidates.map((c, index) => ({
                candidate: {
                  json: c.json || {},
                  conditions: c.conditions,
                  isPartial: c.isPartial || false,
                  mergeMethod: c.mergeMethod || 'replace'
                } as Runtime.IResourceCandidate,
                conditionSetKey: null,
                candidateIndex: index,
                matched: true,
                matchType: 'match' as const,
                isDefaultMatch: false
              }))
            };
            setResolutionResult(mockResult);
          }

          onMessage?.('info', `Updated pending resource: ${resourceId}`);
          return;
        }

        // For existing resources, compute the delta and save as edit
        const resolvedValue = originalValue || editedValue; // Use originalValue as the resolved/baseline
        const deltaResult = computeResourceDelta(undefined, resolvedValue, editedValue);

        if (deltaResult.isFailure()) {
          onMessage?.('warning', `Could not compute delta, saving full value: ${deltaResult.message}`);
        }

        const delta = deltaResult.isSuccess() ? deltaResult.value : null;

        // Save the edit with original, edited, and delta
        setEditedResourcesInternal((prev) => {
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
    [onMessage, pendingResources, selectedResourceId]
  );

  const getEditedValue = useCallback(
    (resourceId: string) => {
      // Check if this is a pending new resource
      const pendingResource = pendingResources.get(resourceId);
      if (pendingResource) {
        // Return the JSON value from the first candidate
        return pendingResource.candidates?.[0]?.json;
      }

      // For existing resources, check for edits
      const edit = editedResourcesInternal.get(resourceId);
      return edit?.editedValue;
    },
    [editedResourcesInternal, pendingResources]
  );

  const hasEdit = useCallback(
    (resourceId: string) => {
      // Pending new resources are considered "edited" if they exist
      // since they represent unsaved changes
      if (pendingResources.has(resourceId)) {
        return false; // Don't show edit indicator for pending new resources (they have their own indicator)
      }
      return editedResourcesInternal.has(resourceId);
    },
    [editedResourcesInternal, pendingResources]
  );

  const clearEdits = useCallback(() => {
    setEditedResourcesInternal(new Map());
    onMessage?.('info', 'All edits cleared');
  }, [onMessage]);

  const discardEdits = useCallback(() => {
    if (hasUnsavedEdits) {
      setEditedResourcesInternal(new Map());
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
        editedResourcesInternal,
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
        editedResourcesInternal,
        currentContext
      );

      if (rebuildResult.isFailure()) {
        onMessage?.('error', `Failed to apply edits: ${rebuildResult.message}`);
        return;
      }

      // Update the system through the callback
      onSystemUpdate(rebuildResult.value);

      // Clear edits after successful application
      setEditedResourcesInternal(new Map());

      onMessage?.('success', `Successfully applied ${editedResourcesInternal.size} edit(s)`);
    } catch (error) {
      onMessage?.('error', `Error applying edits: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsApplyingEdits(false);
    }
  }, [
    processedResources,
    editedResourcesInternal,
    onSystemUpdate,
    currentResolver,
    onMessage,
    effectiveContext
  ]);

  // Resource creation actions
  const startNewResource = useCallback(() => {
    const defaultType = availableResourceTypes[0];
    if (!defaultType) {
      onMessage?.('error', 'No resource types available');
      return;
    }

    const resourceId = ('new-resource-' + Date.now()) as unknown as ResourceId;
    const template = defaultType.createTemplate(resourceId);

    setNewResourceDraft({
      resourceId: resourceId as string,
      resourceType: defaultType.key,
      template,
      isValid: true
    });
  }, [availableResourceTypes, onMessage]);

  const updateNewResourceId = useCallback(
    (id: string) => {
      if (!newResourceDraft) return;

      // Check if ID already exists
      const existingIds = new Set<string>();
      if (processedResources?.summary?.resourceIds) {
        processedResources.summary.resourceIds.forEach((rid) => existingIds.add(rid));
      }
      pendingResources.forEach((_, rid) => existingIds.add(rid));

      const isValid = id.length > 0 && !existingIds.has(id);

      setNewResourceDraft({
        ...newResourceDraft,
        resourceId: id,
        template: {
          ...newResourceDraft.template,
          id
        },
        isValid
      });
    },
    [newResourceDraft, processedResources, pendingResources]
  );

  const selectResourceType = useCallback(
    (typeName: string) => {
      if (!newResourceDraft) return;

      const type = availableResourceTypes.find((t) => t.key === typeName);
      if (!type) {
        onMessage?.('error', `Resource type ${typeName} not found`);
        return;
      }

      const template = type.createTemplate(newResourceDraft.resourceId as unknown as ResourceId);

      setNewResourceDraft({
        ...newResourceDraft,
        resourceType: typeName,
        template
      });
    },
    [newResourceDraft, availableResourceTypes, onMessage]
  );

  const saveNewResourceAsPending = useCallback(() => {
    if (!newResourceDraft || !newResourceDraft.isValid) {
      onMessage?.('error', 'Cannot save invalid resource');
      return;
    }

    setPendingResources((prev) => {
      const newMap = new Map(prev);
      newMap.set(newResourceDraft.resourceId, newResourceDraft.template);
      return newMap;
    });

    setNewResourceDraft(undefined);
    onMessage?.('info', `Resource ${newResourceDraft.resourceId} added to pending`);
  }, [newResourceDraft, onMessage]);

  const cancelNewResource = useCallback(() => {
    setNewResourceDraft(undefined);
  }, []);

  const removePendingResource = useCallback(
    (resourceId: string) => {
      setPendingResources((prev) => {
        const newMap = new Map(prev);
        newMap.delete(resourceId);
        return newMap;
      });
      onMessage?.('info', `Removed pending resource ${resourceId}`);
    },
    [onMessage]
  );

  const markResourceForDeletion = useCallback(
    (resourceId: string) => {
      setPendingResourceDeletions((prev) => {
        const newSet = new Set(prev);
        newSet.add(resourceId);
        return newSet;
      });
      onMessage?.('info', `Marked resource ${resourceId} for deletion`);
    },
    [onMessage]
  );

  const applyPendingResources = useCallback(async () => {
    if (!hasPendingResourceChanges || !processedResources || !onSystemUpdate) {
      if (!hasPendingResourceChanges) {
        onMessage?.('warning', 'No pending resource changes to apply');
      } else if (!processedResources) {
        onMessage?.('error', 'No resource system available');
      } else if (!onSystemUpdate) {
        onMessage?.('error', 'No system update handler provided');
      }
      return;
    }

    try {
      // Get the current resource manager
      const resourceManager = processedResources.system.resourceManager;

      // Apply deletions
      pendingResourceDeletions.forEach((resourceId) => {
        // TODO: Add remove resource functionality to resource manager
        onMessage?.('warning', `Resource deletion not yet implemented for ${resourceId}`);
      });

      // Add pending new resources to the resource manager
      pendingResources.forEach((resource) => {
        const addResult = resourceManager.addResource(resource);
        if (addResult.isFailure()) {
          onMessage?.('error', `Failed to add resource ${resource.id}: ${addResult.message}`);
        }
      });

      // Compile the updated collection
      const compileResult = resourceManager.getCompiledResourceCollection({ includeMetadata: true });
      if (compileResult.isFailure()) {
        onMessage?.('error', `Failed to compile resources: ${compileResult.message}`);
        return;
      }

      // Create a new resolver with the updated collection
      const { Runtime } = await import('@fgv/ts-res');
      const resolverResult = Runtime.ResourceResolver.create({
        resourceManager: resourceManager,
        qualifierTypes: processedResources.system.qualifierTypes,
        contextQualifierProvider: processedResources.system.contextQualifierProvider
      });

      if (resolverResult.isFailure()) {
        onMessage?.('error', `Failed to create resolver: ${resolverResult.message}`);
        return;
      }

      // Get updated resource count and IDs from the resource manager
      const resourceIds = Array.from(resourceManager.resources.keys());

      // Update the system with the new compiled collection and resolver
      const updatedProcessedResources: ProcessedResources = {
        ...processedResources,
        compiledCollection: compileResult.value,
        resolver: resolverResult.value,
        resourceCount: resourceIds.length,
        summary: {
          ...processedResources.summary,
          totalResources: resourceIds.length,
          resourceIds
        }
      };

      // Call the system update handler
      onSystemUpdate(updatedProcessedResources);

      onMessage?.(
        'success',
        `Applied ${pendingResources.size} additions and ${pendingResourceDeletions.size} deletions`
      );

      // Clear pending after successful application
      setPendingResources(new Map());
      setPendingResourceDeletions(new Set());
    } catch (error) {
      onMessage?.('error', `Failed to apply pending resources: ${error}`);
    }
  }, [
    hasPendingResourceChanges,
    pendingResources,
    pendingResourceDeletions,
    processedResources,
    onSystemUpdate,
    onMessage
  ]);

  const discardPendingResources = useCallback(() => {
    if (hasPendingResourceChanges) {
      setPendingResources(new Map());
      setPendingResourceDeletions(new Set());
      onMessage?.('info', 'Discarded all pending resource changes');
    }
  }, [hasPendingResourceChanges, onMessage]);

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
    isApplyingEdits,
    // Pending resource state
    pendingResources,
    pendingResourceDeletions,
    newResourceDraft,
    availableResourceTypes,
    hasPendingResourceChanges
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
      discardEdits,
      // Resource creation actions
      startNewResource,
      updateNewResourceId,
      selectResourceType,
      saveNewResourceAsPending,
      cancelNewResource,
      removePendingResource,
      markResourceForDeletion,
      applyPendingResources,
      discardPendingResources
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
      discardEdits,
      startNewResource,
      updateNewResourceId,
      selectResourceType,
      saveNewResourceAsPending,
      cancelNewResource,
      removePendingResource,
      markResourceForDeletion,
      applyPendingResources,
      discardPendingResources
    ]
  );

  return {
    state,
    actions,
    availableQualifiers
  };
}
