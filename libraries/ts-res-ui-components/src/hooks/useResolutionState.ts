import React, { useState, useCallback, useMemo } from 'react';
import { Runtime, ResourceJson, ResourceTypes, ResourceId } from '@fgv/ts-res';
import { Result, succeed, fail } from '@fgv/ts-utils';
import type { JsonObject as ResourceJsonObject } from '@fgv/ts-json-base';
import {
  ResolutionState,
  ResolutionActions,
  ResolutionResult,
  ProcessedResources,
  JsonValue,
  CreatePendingResourceParams,
  ResolutionActionResult,
  StartNewResourceParams
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

  // Atomic resource creation API
  const createPendingResource = useCallback(
    async (params: CreatePendingResourceParams): Promise<Result<void>> => {
      try {
        if (!processedResources) {
          return fail('No resource system available');
        }

        // Validate resource ID format (should be full resource ID)
        if (!params.id || params.id.trim().length === 0) {
          return fail('Resource ID is required and cannot be empty');
        }

        // Prevent temporary IDs from being persisted
        if (params.id.startsWith('new-resource-')) {
          return fail(
            `Cannot save resource with temporary ID '${params.id}'. Please provide a final resource ID.`
          );
        }

        // Validate resource ID uniqueness
        const existingIds = new Set<string>();
        if (processedResources?.summary?.resourceIds) {
          processedResources.summary.resourceIds.forEach((rid) => existingIds.add(rid));
        }
        pendingResources.forEach((_, rid) => existingIds.add(rid));

        if (existingIds.has(params.id)) {
          return fail(`Resource ID '${params.id}' already exists. Resource IDs must be unique.`);
        }

        // Validate resource type exists
        const resourceType = availableResourceTypes.find((t) => t.key === params.resourceTypeName);
        if (!resourceType) {
          const availableTypes = availableResourceTypes.map((t) => t.key).join(', ');
          return fail(
            `Resource type '${params.resourceTypeName}' not found. Available types: ${availableTypes}`
          );
        }

        // Validate JSON content
        if (params.json === undefined || params.json === null) {
          return fail('JSON content is required for resource creation');
        }

        // Create resource template using the resource type
        const template = resourceType.createTemplate(params.id as unknown as ResourceId);

        // Create conditions from current effective context
        const contextConditions: ResourceJson.Json.ILooseConditionDecl[] = [];
        Object.entries(effectiveContext).forEach(([qualifierName, qualifierValue]) => {
          if (typeof qualifierValue === 'string' && qualifierValue.trim() !== '') {
            contextConditions.push({ qualifierName, operator: 'matches', value: qualifierValue });
          }
        });

        // Create the loose resource declaration
        const looseResourceDecl: ResourceJson.Json.ILooseResourceDecl = {
          ...template,
          id: params.id,
          resourceTypeName: params.resourceTypeName,
          candidates: [
            {
              json: (typeof params.json === 'object' && params.json !== null && !Array.isArray(params.json)
                ? params.json
                : { value: params.json }) as ResourceJsonObject,
              conditions: contextConditions.length > 0 ? contextConditions : undefined,
              isPartial: false,
              mergeMethod: 'replace' as const
            }
          ]
        };

        // Add to pending resources
        setPendingResources((prev) => {
          const newMap = new Map(prev);
          newMap.set(params.id, looseResourceDecl);
          return newMap;
        });

        onMessage?.('success', `Resource '${params.id}' created and added to pending resources`);
        return succeed(undefined);
      } catch (error) {
        const errorMessage = `Failed to create pending resource: ${
          error instanceof Error ? error.message : String(error)
        }`;
        onMessage?.('error', errorMessage);
        return fail(errorMessage);
      }
    },
    [processedResources, pendingResources, availableResourceTypes, effectiveContext, onMessage]
  );

  // Resource creation actions (enhanced with better return values)
  const startNewResource = useCallback(
    (params?: StartNewResourceParams): ResolutionActionResult<ResolutionState['newResourceDraft']> => {
      try {
        // Determine resource type to use
        let targetTypeName = params?.defaultTypeName || params?.resourceTypeName;
        const targetType = targetTypeName
          ? availableResourceTypes.find((t) => t.key === targetTypeName) || availableResourceTypes[0]
          : availableResourceTypes[0];

        if (!targetType) {
          const error = 'No resource types available for resource creation';
          onMessage?.('error', error);
          return {
            success: false,
            error,
            diagnostics: [`Available types: ${availableResourceTypes.map((t) => t.key).join(', ')}`]
          };
        }

        // Determine resource ID (pre-seeded or generate temporary)
        const resourceId = params?.id || `new-resource-${Date.now()}`;

        // If pre-seeded with an ID, validate it
        if (params?.id) {
          const existingIds = new Set<string>();
          if (processedResources?.summary?.resourceIds) {
            processedResources.summary.resourceIds.forEach((rid) => existingIds.add(rid));
          }
          pendingResources.forEach((_, rid) => existingIds.add(rid));

          if (existingIds.has(params.id)) {
            const error = `Resource ID '${params.id}' already exists. Resource IDs must be unique.`;
            onMessage?.('error', error);
            return {
              success: false,
              error,
              diagnostics: ['Use a different resource ID or let the system generate a temporary one']
            };
          }
        }

        // Create template
        let template = targetType.createTemplate(resourceId as unknown as ResourceId);

        // Pre-seed with JSON if provided
        if (params?.json !== undefined) {
          template = {
            ...template,
            candidates: [
              {
                json: (typeof params.json === 'object' && params.json !== null && !Array.isArray(params.json)
                  ? params.json
                  : { value: params.json }) as ResourceJsonObject,
                isPartial: false,
                mergeMethod: 'replace' as const
              }
            ]
          };
        }

        // Stamp conditions from current effective context at creation time
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
          resourceType: targetType.key,
          template,
          isValid: !resourceId.startsWith('new-resource-') // Valid if not temporary
        };

        setNewResourceDraft(draft);

        const diagnostics = [];
        if (params?.id) diagnostics.push('Pre-seeded with resource ID');
        if (params?.resourceTypeName) diagnostics.push('Pre-seeded with resource type');
        if (params?.json) diagnostics.push('Pre-seeded with JSON content');
        if (contextConditions.length > 0)
          diagnostics.push(`Stamped with ${contextConditions.length} context conditions`);

        onMessage?.('info', `Started new ${targetType.key} resource: ${resourceId}`);
        return {
          success: true,
          state: draft,
          diagnostics
        };
      } catch (error) {
        const errorMessage = `Failed to start new resource: ${
          error instanceof Error ? error.message : String(error)
        }`;
        onMessage?.('error', errorMessage);
        return {
          success: false,
          error: errorMessage
        };
      }
    },
    [availableResourceTypes, onMessage, effectiveContext, processedResources, pendingResources]
  );

  const updateNewResourceId = useCallback(
    (id: string): ResolutionActionResult<ResolutionState['newResourceDraft']> => {
      try {
        if (!newResourceDraft) {
          const error = 'No resource draft in progress. Call startNewResource first.';
          onMessage?.('error', error);
          return {
            success: false,
            error,
            diagnostics: ['Use startNewResource() to begin creating a new resource']
          };
        }

        // Validate ID format
        if (!id || id.trim().length === 0) {
          const error = 'Resource ID cannot be empty';
          onMessage?.('error', error);
          return {
            success: false,
            error,
            state: newResourceDraft
          };
        }

        // Check if ID already exists
        const existingIds = new Set<string>();
        if (processedResources?.summary?.resourceIds) {
          processedResources.summary.resourceIds.forEach((rid) => existingIds.add(rid));
        }
        pendingResources.forEach((_, rid) => existingIds.add(rid));

        const diagnostics = [];
        let isValid = true;
        let validationError: string | undefined;

        if (existingIds.has(id)) {
          isValid = false;
          validationError = `Resource ID '${id}' already exists. Resource IDs must be unique.`;
          diagnostics.push('ID uniqueness validation failed');
        } else if (id.startsWith('new-resource-')) {
          isValid = false;
          validationError = `Resource ID '${id}' appears to be a temporary ID. Please provide a final resource ID.`;
          diagnostics.push('Temporary ID detected - not suitable for saving');
        } else {
          diagnostics.push('ID validation passed');
        }

        const updatedDraft = {
          ...newResourceDraft,
          resourceId: id,
          template: {
            ...newResourceDraft.template,
            id
          },
          isValid
        };

        setNewResourceDraft(updatedDraft);

        if (validationError) {
          onMessage?.('warning', validationError);
        } else {
          onMessage?.('info', `Updated resource ID to: ${id}`);
        }

        return {
          success: true,
          state: updatedDraft,
          diagnostics,
          ...(validationError ? { error: validationError } : {})
        };
      } catch (error) {
        const errorMessage = `Failed to update resource ID: ${
          error instanceof Error ? error.message : String(error)
        }`;
        onMessage?.('error', errorMessage);
        return {
          success: false,
          error: errorMessage
        };
      }
    },
    [newResourceDraft, processedResources, pendingResources, onMessage]
  );

  const selectResourceType = useCallback(
    (typeName: string): ResolutionActionResult<ResolutionState['newResourceDraft']> => {
      try {
        if (!newResourceDraft) {
          const error = 'No resource draft in progress. Call startNewResource first.';
          onMessage?.('error', error);
          return {
            success: false,
            error,
            diagnostics: ['Use startNewResource() to begin creating a new resource']
          };
        }

        const type = availableResourceTypes.find((t) => t.key === typeName);
        if (!type) {
          const availableTypes = availableResourceTypes.map((t) => t.key).join(', ');
          const error = `Resource type '${typeName}' not found`;
          onMessage?.('error', error);
          return {
            success: false,
            error,
            state: newResourceDraft,
            diagnostics: [`Available types: ${availableTypes}`]
          };
        }

        const template = type.createTemplate(newResourceDraft.resourceId as unknown as ResourceId);

        const updatedDraft = {
          ...newResourceDraft,
          resourceType: typeName,
          template
        };

        setNewResourceDraft(updatedDraft);
        onMessage?.('info', `Selected resource type: ${typeName}`);

        return {
          success: true,
          state: updatedDraft,
          diagnostics: [`Created ${typeName} template for resource ${newResourceDraft.resourceId}`]
        };
      } catch (error) {
        const errorMessage = `Failed to select resource type: ${
          error instanceof Error ? error.message : String(error)
        }`;
        onMessage?.('error', errorMessage);
        return {
          success: false,
          error: errorMessage
        };
      }
    },
    [newResourceDraft, availableResourceTypes, onMessage]
  );

  // New public updateNewResourceJson action
  const updateNewResourceJson = useCallback(
    (json: JsonValue): ResolutionActionResult<ResolutionState['newResourceDraft']> => {
      try {
        if (!newResourceDraft) {
          const error = 'No resource draft in progress. Call startNewResource first.';
          onMessage?.('error', error);
          return {
            success: false,
            error,
            diagnostics: ['Use startNewResource() to begin creating a new resource']
          };
        }

        // Validate JSON content
        if (json === undefined || json === null) {
          const error = 'JSON content cannot be null or undefined';
          onMessage?.('error', error);
          return {
            success: false,
            error,
            state: newResourceDraft
          };
        }

        // Update the template with new JSON content
        const updatedTemplate = {
          ...newResourceDraft.template,
          candidates: [
            {
              json: (typeof json === 'object' && json !== null && !Array.isArray(json)
                ? json
                : { value: json }) as ResourceJsonObject,
              // Preserve existing conditions if any
              conditions: newResourceDraft.template.candidates?.[0]?.conditions,
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
        onMessage?.('info', `Updated JSON content for resource ${newResourceDraft.resourceId}`);

        return {
          success: true,
          state: updatedDraft,
          diagnostics: ['JSON content updated successfully', 'Resource is ready for saving as pending']
        };
      } catch (error) {
        const errorMessage = `Failed to update resource JSON: ${
          error instanceof Error ? error.message : String(error)
        }`;
        onMessage?.('error', errorMessage);
        return {
          success: false,
          error: errorMessage
        };
      }
    },
    [newResourceDraft, onMessage]
  );

  const saveNewResourceAsPending = useCallback((): ResolutionActionResult<
    Map<string, ResourceJson.Json.ILooseResourceDecl>
  > => {
    try {
      // Enhanced validation with specific error messages
      if (!newResourceDraft) {
        const error = 'No resource draft in progress. Call startNewResource first.';
        onMessage?.('error', error);
        return {
          success: false,
          error,
          diagnostics: ['Use startNewResource() to begin creating a new resource']
        };
      }

      if (!newResourceDraft.isValid) {
        const errors = [];
        if (newResourceDraft.resourceId.startsWith('new-resource-')) {
          errors.push('Resource ID is temporary - please set a final resource ID');
        }
        if (!newResourceDraft.resourceType) {
          errors.push('Resource type is not selected');
        }
        if (!newResourceDraft.template.candidates || newResourceDraft.template.candidates.length === 0) {
          errors.push('Resource template has no candidates');
        }

        const error = `Cannot save resource with validation errors: ${errors.join(', ')}`;
        onMessage?.('error', error);
        return {
          success: false,
          error,
          diagnostics: errors
        };
      }

      // Prevent temporary IDs from being persisted (additional safety check)
      if (newResourceDraft.resourceId.startsWith('new-resource-')) {
        const error = `Cannot save resource with temporary ID '${newResourceDraft.resourceId}'. Please set a final resource ID first.`;
        onMessage?.('error', error);
        return {
          success: false,
          error,
          diagnostics: ['Use updateNewResourceId() to set a final resource ID before saving']
        };
      }

      // Check resource type exists
      if (
        !newResourceDraft.resourceType ||
        !availableResourceTypes.find((t) => t.key === newResourceDraft.resourceType)
      ) {
        const error = `Resource type '${newResourceDraft.resourceType}' is not available`;
        const availableTypes = availableResourceTypes.map((t) => t.key).join(', ');
        onMessage?.('error', error);
        return {
          success: false,
          error,
          diagnostics: [`Available types: ${availableTypes}`]
        };
      }

      // Check candidates exist
      if (!newResourceDraft.template.candidates || newResourceDraft.template.candidates.length === 0) {
        const error = 'Resource template must have at least one candidate';
        onMessage?.('error', error);
        return {
          success: false,
          error,
          diagnostics: ['Use updateNewResourceJson() to add JSON content to the resource']
        };
      }

      let updatedPendingResources: Map<string, ResourceJson.Json.ILooseResourceDecl>;

      setPendingResources((prev) => {
        const newMap = new Map(prev);
        // Stamp conditions from current effective context onto all candidates for the new resource
        const contextConditions: ResourceJson.Json.ILooseConditionDecl[] = [];
        Object.entries(effectiveContext).forEach(([qualifierName, qualifierValue]) => {
          if (typeof qualifierValue === 'string' && qualifierValue.trim() !== '') {
            contextConditions.push({ qualifierName, operator: 'matches', value: qualifierValue });
          }
        });

        const stampedTemplate: ResourceJson.Json.ILooseResourceDecl = {
          ...newResourceDraft.template,
          candidates: (newResourceDraft.template.candidates || []).map((c) => ({
            ...c,
            conditions: contextConditions.length > 0 ? contextConditions : c.conditions
          }))
        };

        newMap.set(newResourceDraft.resourceId, stampedTemplate);
        updatedPendingResources = newMap;
        return newMap;
      });

      setNewResourceDraft(undefined);

      const diagnostics = [];
      if (effectiveContext && Object.keys(effectiveContext).length > 0) {
        const contextKeys = Object.keys(effectiveContext).filter((k) => effectiveContext[k] !== undefined);
        if (contextKeys.length > 0) {
          diagnostics.push(`Stamped with context: ${contextKeys.join(', ')}`);
        }
      }
      diagnostics.push('Resource draft cleared');

      onMessage?.('success', `Resource '${newResourceDraft.resourceId}' added to pending resources`);

      return {
        success: true,
        state: updatedPendingResources!,
        diagnostics
      };
    } catch (error) {
      const errorMessage = `Failed to save resource as pending: ${
        error instanceof Error ? error.message : String(error)
      }`;
      onMessage?.('error', errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  }, [newResourceDraft, onMessage, effectiveContext, availableResourceTypes]);

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
    const hasAnyChanges =
      editedResourcesInternal.size > 0 || pendingResources.size > 0 || pendingResourceDeletions.size > 0;
    if (!hasAnyChanges || !processedResources || !onSystemUpdate) {
      if (!hasAnyChanges) {
        onMessage?.('warning', 'No pending changes to apply');
      } else if (!processedResources) {
        onMessage?.('error', 'No resource system available');
      } else if (!onSystemUpdate) {
        onMessage?.('error', 'No system update handler provided');
      }
      return;
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
          onMessage?.('error', `Failed to create resolver: ${resolverCreateResult.message}`);
          return;
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
        onMessage?.('error', `Failed to apply changes: ${rebuildResult.message}`);
        return;
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
    } catch (error) {
      onMessage?.(
        'error',
        `Failed to apply pending resources: ${error instanceof Error ? error.message : String(error)}`
      );
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
      // Enhanced resource creation actions
      createPendingResource,
      startNewResource,
      updateNewResourceId,
      selectResourceType,
      updateNewResourceJson,
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
      discardEdits,
      createPendingResource,
      startNewResource,
      updateNewResourceId,
      selectResourceType,
      updateNewResourceJson,
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
