import React, { useState, useCallback, useMemo } from 'react';
import { Runtime, ResourceJson, ResourceTypes, ResourceId } from '@fgv/ts-res';
import type { JsonObject as ResourceJsonObject } from '@fgv/ts-json-base';
import { Result, succeed, fail } from '@fgv/ts-utils';
import {
  ResolutionState,
  ResolutionActions,
  ResolutionResult,
  ProcessedResources,
  JsonValue,
  CreatePendingResourceParams,
  StartNewResourceParams,
  OrchestratorActionResult,
  DraftLifecycleOptions
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
  rebuildSystemWithChanges,
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
 * - **Draft Lifecycle**: Optional callbacks for draft state changes
 * - **Debug Logging**: Optional verbose logging for development
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
 * @param lifecycleOptions - Optional draft lifecycle callbacks and debug options
 * @returns Object containing resolution state, actions, and available qualifiers
 * @public
 */
export function useResolutionState(
  processedResources: ProcessedResources | null,
  onMessage?: (type: 'info' | 'warning' | 'error' | 'success', message: string) => void,
  onSystemUpdate?: (updatedResources: ProcessedResources) => void,
  lifecycleOptions?: DraftLifecycleOptions
): UseResolutionStateReturn {
  // Extract lifecycle options
  const { onDraftUpdate, enableDebugLogging } = lifecycleOptions || {};

  // Debug logging helper
  const debugLog = useCallback(
    (message: string, data?: any) => {
      if (enableDebugLogging) {
        console.log(`[ResolutionState] ${message}`, data || '');
      }
    },
    [enableDebugLogging]
  );
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
    (resourceId: string, editedValue: JsonValue, originalValue?: JsonValue): Result<void> => {
      try {
        // Validate the edited value
        const validation = validateEditedResource(editedValue);
        if (!validation.isValid) {
          const errorMsg = `Invalid edit: ${validation.errors.join(', ')}`;
          onMessage?.('error', errorMsg);
          return fail(errorMsg);
        }

        // Show warnings if any
        if (validation.warnings.length > 0) {
          validation.warnings.forEach((warning) => onMessage?.('warning', warning));
        }

        // Check if this is a pending new resource
        const pendingResource = pendingResources.get(resourceId);
        if (pendingResource) {
          // Update the pending resource's template directly
          // Always stamp conditions from the current effective context for pending resources
          const contextConditions: ResourceJson.Json.ILooseConditionDecl[] = [];
          Object.entries(effectiveContext).forEach(([qualifierName, qualifierValue]) => {
            if (typeof qualifierValue === 'string' && qualifierValue.trim() !== '') {
              contextConditions.push({ qualifierName, operator: 'matches', value: qualifierValue });
            }
          });
          const updatedResource = {
            ...pendingResource,
            candidates: [
              {
                json: (typeof editedValue === 'object' && editedValue !== null && !Array.isArray(editedValue)
                  ? editedValue
                  : { value: editedValue }) as ResourceJsonObject,
                conditions: contextConditions.length > 0 ? contextConditions : undefined,
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
          return succeed(undefined);
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
        return succeed(undefined);
      } catch (error) {
        const errorMsg = `Failed to save edit: ${error instanceof Error ? error.message : String(error)}`;
        onMessage?.('error', errorMsg);
        return fail(errorMsg);
      }
    },
    [onMessage, pendingResources, selectedResourceId, effectiveContext]
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

  // Removed applyEdits in favor of unified applyPendingResources

  // Resource creation actions
  const startNewResource = useCallback(
    (params?: StartNewResourceParams): Result<OrchestratorActionResult> => {
      try {
        // Handle both legacy string parameter and new params object
        let defaultTypeName: string | undefined;
        let presetId: string | undefined;
        let presetJson: JsonValue | undefined;

        if (typeof params === 'string') {
          // Legacy support - will be removed
          defaultTypeName = params;
        } else if (params) {
          defaultTypeName = params.resourceTypeName;
          presetId = params.id;
          presetJson = params.json;
        }

        const defaultType = defaultTypeName
          ? availableResourceTypes.find((t) => t.key === defaultTypeName) || availableResourceTypes[0]
          : availableResourceTypes[0];
        if (!defaultType) {
          const errorMsg = 'No resource types available';
          onMessage?.('error', errorMsg);
          return fail(errorMsg);
        }

        // Use preset ID or generate temporary ID
        const resourceId = (presetId || 'new-resource-' + Date.now()) as unknown as ResourceId;
        let template = defaultType.createTemplate(resourceId);

        // Apply preset JSON if provided
        if (presetJson !== undefined) {
          template = {
            ...template,
            candidates: [
              {
                json: (typeof presetJson === 'object' && presetJson !== null && !Array.isArray(presetJson)
                  ? presetJson
                  : { value: presetJson }) as ResourceJsonObject,
                conditions: undefined,
                isPartial: false,
                mergeMethod: 'replace' as const
              }
            ]
          };
        }

        // Stamp conditions from current effective context at creation time (include host-managed values)
        const contextConditions: ResourceJson.Json.ILooseConditionDecl[] = [];
        Object.entries(effectiveContext).forEach(([qualifierName, qualifierValue]) => {
          if (typeof qualifierValue === 'string' && qualifierValue.trim() !== '') {
            contextConditions.push({ qualifierName, operator: 'matches', value: qualifierValue });
          }
        });
        if (contextConditions.length > 0) {
          template = {
            ...template,
            candidates: (template.candidates || []).map((c) => ({
              ...c,
              conditions: contextConditions
            }))
          };
        }

        const draft = {
          resourceId: resourceId as string,
          resourceType: defaultType.key,
          template,
          isValid: !presetId || !isResourceIdTaken(presetId)
        };

        setNewResourceDraft(draft);
        debugLog('Draft created', draft);
        onDraftUpdate?.(draft);

        return succeed({
          success: true,
          draft,
          pendingResources: new Map(pendingResources)
        });
      } catch (error) {
        const errorMsg = `Failed to start new resource: ${
          error instanceof Error ? error.message : String(error)
        }`;
        onMessage?.('error', errorMsg);
        return fail(errorMsg);
      }
    },
    [availableResourceTypes, onMessage, effectiveContext, pendingResources, debugLog, onDraftUpdate]
  );

  // Helper to check if resource ID is taken
  const isResourceIdTaken = useCallback(
    (id: string): boolean => {
      const existingIds = new Set<string>();
      if (processedResources?.summary?.resourceIds) {
        processedResources.summary.resourceIds.forEach((rid) => existingIds.add(rid));
      }
      pendingResources.forEach((_, rid) => existingIds.add(rid));
      return existingIds.has(id);
    },
    [processedResources, pendingResources]
  );

  const updateNewResourceId = useCallback(
    (id: string): Result<OrchestratorActionResult> => {
      if (!newResourceDraft) {
        const errorMsg = 'No resource draft to update';
        return fail(errorMsg);
      }

      // Validate ID is not temporary
      if (id.startsWith('new-resource-')) {
        const errorMsg = `Cannot use temporary ID: ${id}. Please provide a permanent resource ID.`;
        onMessage?.('error', errorMsg);
        return fail(errorMsg);
      }

      // Check if ID already exists
      const isValid = id.length > 0 && !isResourceIdTaken(id);

      if (!isValid && id.length > 0) {
        const errorMsg = `Resource ID '${id}' already exists`;
        onMessage?.('warning', errorMsg);
      }

      const draft = {
        ...newResourceDraft,
        resourceId: id,
        template: {
          ...newResourceDraft.template,
          id
        },
        isValid
      };

      setNewResourceDraft(draft);
      debugLog('Draft ID updated', draft);
      onDraftUpdate?.(draft);

      return succeed({
        success: true,
        draft,
        pendingResources: new Map(pendingResources)
      });
    },
    [newResourceDraft, isResourceIdTaken, pendingResources, onMessage, debugLog, onDraftUpdate]
  );

  const selectResourceType = useCallback(
    (typeName: string): Result<OrchestratorActionResult> => {
      if (!newResourceDraft) {
        const errorMsg = 'No resource draft to update';
        return fail(errorMsg);
      }

      const type = availableResourceTypes.find((t) => t.key === typeName);
      if (!type) {
        const errorMsg = `Resource type '${typeName}' not found. Available types: ${availableResourceTypes
          .map((t) => t.key)
          .join(', ')}`;
        onMessage?.('error', errorMsg);
        return fail(errorMsg);
      }

      const template = type.createTemplate(newResourceDraft.resourceId as unknown as ResourceId);

      const draft = {
        ...newResourceDraft,
        resourceType: typeName,
        template
      };

      setNewResourceDraft(draft);
      debugLog('Draft type selected', draft);
      onDraftUpdate?.(draft);

      return succeed({
        success: true,
        draft,
        pendingResources: new Map(pendingResources)
      });
    },
    [newResourceDraft, availableResourceTypes, onMessage, pendingResources, debugLog, onDraftUpdate]
  );

  // New action: Update JSON content of draft
  const updateNewResourceJson = useCallback(
    (json: JsonValue): Result<void> => {
      if (!newResourceDraft) {
        return fail('No resource draft to update');
      }

      const updatedTemplate = {
        ...newResourceDraft.template,
        candidates: [
          {
            json: (typeof json === 'object' && json !== null && !Array.isArray(json)
              ? json
              : { value: json }) as ResourceJsonObject,
            conditions: undefined,
            isPartial: false,
            mergeMethod: 'replace' as const
          }
        ]
      };

      const updatedDraft = {
        ...newResourceDraft,
        template: updatedTemplate
      };

      setNewResourceDraft(updatedDraft);
      debugLog('Draft JSON updated', updatedDraft);
      onDraftUpdate?.(updatedDraft);

      return succeed(undefined);
    },
    [newResourceDraft, debugLog, onDraftUpdate]
  );

  const saveNewResourceAsPending = useCallback((): Result<OrchestratorActionResult> => {
    if (!newResourceDraft) {
      const errorMsg = 'No resource draft to save';
      return fail(errorMsg);
    }

    // Validate not using temporary ID
    if (newResourceDraft.resourceId.startsWith('new-resource-')) {
      const errorMsg = `Cannot save resource with temporary ID '${newResourceDraft.resourceId}'. Please set a permanent resource ID first.`;
      onMessage?.('error', errorMsg);
      return fail(errorMsg);
    }

    // Validate resource type is set
    if (!newResourceDraft.resourceType) {
      const errorMsg = 'Cannot save resource without a resource type. Please select a resource type.';
      onMessage?.('error', errorMsg);
      return fail(errorMsg);
    }

    // Validate candidates exist
    if (!newResourceDraft.template.candidates || newResourceDraft.template.candidates.length === 0) {
      const errorMsg = 'Cannot save resource without candidates. Please add resource content.';
      onMessage?.('error', errorMsg);
      return fail(errorMsg);
    }

    if (!newResourceDraft.isValid) {
      const errorMsg = 'Cannot save invalid resource. Please fix validation errors.';
      onMessage?.('error', errorMsg);
      return fail(errorMsg);
    }

    // Ensure resourceTypeName is included in the template
    const stampedTemplate: ResourceJson.Json.ILooseResourceDecl = {
      ...newResourceDraft.template,
      resourceTypeName: newResourceDraft.resourceType,
      candidates: (newResourceDraft.template.candidates || []).map((c) => {
        // Stamp conditions from current effective context
        const contextConditions: ResourceJson.Json.ILooseConditionDecl[] = [];
        Object.entries(effectiveContext).forEach(([qualifierName, qualifierValue]) => {
          if (typeof qualifierValue === 'string' && qualifierValue.trim() !== '') {
            contextConditions.push({ qualifierName, operator: 'matches', value: qualifierValue });
          }
        });

        return {
          ...c,
          conditions: contextConditions.length > 0 ? contextConditions : c.conditions
        };
      })
    };

    setPendingResources((prev) => {
      const newMap = new Map(prev);
      // Always use full resource ID as key
      const fullResourceId = newResourceDraft.resourceId;
      newMap.set(fullResourceId, stampedTemplate);
      return newMap;
    });

    setNewResourceDraft(undefined);
    debugLog('Draft saved to pending', newResourceDraft);
    onDraftUpdate?.(undefined);
    onMessage?.('info', `Resource ${newResourceDraft.resourceId} added to pending`);

    return succeed({
      success: true,
      pendingResources: new Map(pendingResources).set(newResourceDraft.resourceId, stampedTemplate)
    });
  }, [newResourceDraft, onMessage, effectiveContext, pendingResources, debugLog, onDraftUpdate]);

  const cancelNewResource = useCallback(() => {
    setNewResourceDraft(undefined);
    debugLog('Draft cancelled');
    onDraftUpdate?.(undefined);
  }, [debugLog, onDraftUpdate]);

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

  // NEW: Atomic API to create a pending resource in one call
  const createPendingResource = useCallback(
    async (params: CreatePendingResourceParams): Promise<Result<void>> => {
      try {
        const { id, resourceTypeName, json } = params;

        // Validate ID is not temporary
        if (id.startsWith('new-resource-')) {
          return fail(
            `Cannot create resource with temporary ID '${id}'. Please provide a permanent resource ID.`
          );
        }

        // Validate ID is not already taken
        if (isResourceIdTaken(id)) {
          return fail(`Resource ID '${id}' already exists`);
        }

        // Validate resource type exists
        const resourceType = availableResourceTypes.find((t) => t.key === resourceTypeName);
        if (!resourceType) {
          return fail(
            `Resource type '${resourceTypeName}' not found. Available types: ${availableResourceTypes
              .map((t) => t.key)
              .join(', ')}`
          );
        }

        // Create the ILooseResourceDecl with proper structure
        let resourceDecl: ResourceJson.Json.ILooseResourceDecl = {
          id,
          resourceTypeName,
          candidates: [
            {
              json: (typeof json === 'object' && json !== null && !Array.isArray(json)
                ? json
                : { value: json }) as ResourceJsonObject,
              conditions: undefined,
              isPartial: false,
              mergeMethod: 'replace'
            }
          ]
        };

        // Stamp current context conditions if any
        const contextConditions: ResourceJson.Json.ILooseConditionDecl[] = [];
        Object.entries(effectiveContext).forEach(([qualifierName, qualifierValue]) => {
          if (typeof qualifierValue === 'string' && qualifierValue.trim() !== '') {
            contextConditions.push({ qualifierName, operator: 'matches', value: qualifierValue });
          }
        });

        if (contextConditions.length > 0 && resourceDecl.candidates) {
          // Update the resource declaration with new candidates array
          resourceDecl = {
            ...resourceDecl,
            candidates: [
              {
                ...resourceDecl.candidates[0],
                conditions: contextConditions
              },
              ...resourceDecl.candidates.slice(1)
            ]
          };
        }

        // Add to pending resources with full ID as key
        setPendingResources((prev) => {
          const newMap = new Map(prev);
          newMap.set(id, resourceDecl);
          return newMap;
        });

        onMessage?.('success', `Resource '${id}' created and added to pending`);
        return succeed(undefined);
      } catch (error) {
        const errorMsg = `Failed to create pending resource: ${
          error instanceof Error ? error.message : String(error)
        }`;
        return fail(errorMsg);
      }
    },
    [availableResourceTypes, isResourceIdTaken, effectiveContext, onMessage]
  );

  const applyPendingResources = useCallback(async (): Promise<Result<void>> => {
    const hasAnyChanges =
      editedResourcesInternal.size > 0 || pendingResources.size > 0 || pendingResourceDeletions.size > 0;
    if (!hasAnyChanges || !processedResources || !onSystemUpdate) {
      if (!hasAnyChanges) {
        onMessage?.('warning', 'No pending changes to apply');
        return fail('No pending changes to apply');
      } else if (!processedResources) {
        onMessage?.('error', 'No resource system available');
        return fail('No resource system available');
      } else if (!onSystemUpdate) {
        onMessage?.('error', 'No system update handler provided');
        return fail('No system update handler provided');
      }
      return fail('Unable to apply pending resources');
    }

    try {
      setIsApplyingEdits(true);
      // Extract current resolution context (filter out undefined values)
      const cleanedContextValues: Record<string, string> = {};
      Object.entries(effectiveContext).forEach(([key, value]) => {
        if (value !== undefined) {
          cleanedContextValues[key] = value as string;
        }
      });

      // Ensure we have a resolver instance to extract context
      let resolverForContext = currentResolver as Runtime.ResourceResolver | null;
      if (!resolverForContext) {
        const resolverCreateResult = Runtime.ResourceResolver.create({
          resourceManager: processedResources.system.resourceManager,
          qualifierTypes: processedResources.system.qualifierTypes,
          contextQualifierProvider: processedResources.system.contextQualifierProvider
        });
        if (resolverCreateResult.isFailure()) {
          const errorMsg = `Failed to create resolver: ${resolverCreateResult.message}`;
          onMessage?.('error', errorMsg);
          return fail(errorMsg);
        }
        resolverForContext = resolverCreateResult.value;
      }

      const currentContext = extractResolutionContext(resolverForContext, cleanedContextValues);

      // Convert pending new resources (map → array)
      const newResourcesArray = Array.from(pendingResources.values());

      // Rebuild system with both edits and new resources in one pass
      const rebuildResult = await rebuildSystemWithChanges(
        processedResources.system,
        {
          editedResources: editedResourcesInternal,
          newResources: newResourcesArray
        },
        currentContext
      );

      if (rebuildResult.isFailure()) {
        const errorMsg = `Failed to apply changes: ${rebuildResult.message}`;
        onMessage?.('error', errorMsg);
        return fail(errorMsg);
      }

      onSystemUpdate(rebuildResult.value);

      onMessage?.(
        'success',
        `Applied ${editedResourcesInternal.size} edits, ${newResourcesArray.length} additions, and ${pendingResourceDeletions.size} deletions`
      );

      // Clear pending additions after successful application (deletions still deferred)
      setPendingResources(new Map());
      setPendingResourceDeletions(new Set());
      // Clear edits as well if we applied them
      if (editedResourcesInternal.size > 0) {
        setEditedResourcesInternal(new Map());
      }

      return succeed(undefined);
    } catch (error) {
      const errorMsg = `Failed to apply pending resources: ${
        error instanceof Error ? error.message : String(error)
      }`;
      onMessage?.('error', errorMsg);
      return fail(errorMsg);
    } finally {
      setIsApplyingEdits(false);
    }
  }, [
    pendingResources,
    pendingResourceDeletions,
    processedResources,
    onSystemUpdate,
    onMessage,
    effectiveContext,
    currentResolver,
    editedResourcesInternal
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
      discardEdits,
      // Resource creation actions (multi-step)
      startNewResource,
      updateNewResourceId,
      selectResourceType,
      updateNewResourceJson,
      saveNewResourceAsPending,
      cancelNewResource,
      // Atomic resource creation
      createPendingResource,
      // Pending resource management
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
      discardEdits,
      startNewResource,
      updateNewResourceId,
      selectResourceType,
      updateNewResourceJson,
      saveNewResourceAsPending,
      cancelNewResource,
      createPendingResource,
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
