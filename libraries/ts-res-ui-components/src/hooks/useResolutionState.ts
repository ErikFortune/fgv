import React, { useState, useCallback, useMemo } from 'react';
import { Qualifiers, Runtime, ResourceJson, ResourceTypes, Validate, QualifierName } from '@fgv/ts-res';
import { Result, succeed, fail, MessageAggregator } from '@fgv/ts-utils';
import type { JsonObject as ResourceJsonObject } from '@fgv/ts-json-base';
import { isJsonObject } from '@fgv/ts-json-base';
import {
  IResolutionState,
  IResolutionActions,
  IResolutionResult,
  IProcessedResources,
  JsonValue,
  ICreatePendingResourceParams,
  IStartNewResourceParams
} from '../types';
import {
  createResolverWithContext,
  resolveResourceDetailed,
  getAvailableQualifiers,
  hasPendingContextChanges
} from '../utils/resolutionUtils';
import { useObservability } from '../contexts';
import {
  validateEditedResource,
  computeResourceDelta,
  rebuildSystemWithChanges,
  extractResolutionContext
} from '../utils/resolutionEditing';

/**
 * Return type for the useResolutionState hook.
 *
 * @public
 */
export interface IUseResolutionStateReturn {
  /** Current resolution state including context, results, and editing state */
  state: IResolutionState;
  /** Available actions for managing resolution and editing */
  actions: IResolutionActions;
  /** List of available qualifier keys that can be used in the resolution context */
  availableQualifiers: string[];
}

/**
 * Helper function to find and validate a resource type by name.
 *
 * @param typeName - The resource type name to find
 * @param availableResourceTypes - Array of available resource types
 * @returns Result containing the found resource type or error
 */
function findResourceType(
  typeName: string,
  availableResourceTypes: ResourceTypes.IResourceType[]
): Result<ResourceTypes.IResourceType> {
  const resourceType = availableResourceTypes.find((t) => t.key === typeName);

  if (!resourceType) {
    const availableTypes = availableResourceTypes.map((t) => t.key).join(', ');
    return fail(`${typeName}: Resource type not found. Available types: ${availableTypes}`);
  }

  return succeed(resourceType);
}

/**
 * Helper function to create condition declarations from context with proper validation.
 *
 * @param effectiveContext - The context values to create conditions from
 * @param qualifiers - The qualifiers collection for validation
 * @returns Result containing condition declarations or error
 */
function createContextConditions(
  effectiveContext: Record<string, string | undefined>,
  qualifiers: Qualifiers.IReadOnlyQualifierCollector | undefined
): Result<ResourceJson.Json.ILooseConditionDecl[]> {
  // Qualifiers are required for proper validation
  if (!qualifiers) {
    return fail('context-validation: Qualifiers not available - cannot validate context values');
  }
  const contextConditions: ResourceJson.Json.ILooseConditionDecl[] = [];
  const errors: MessageAggregator = new MessageAggregator();

  for (const [qualifierName, qualifierValue] of Object.entries(effectiveContext)) {
    if (qualifierValue === undefined || qualifierValue === null) {
      continue; // Skip undefined/null values
    }

    qualifiers
      .get(qualifierName as QualifierName)
      .asResult.withErrorFormat((error) => `${qualifierName}: Unknown qualifier - ${error}`)
      .onSuccess((qualifier) => {
        return qualifier
          .validateCondition(qualifierValue)
          .withErrorFormat((error) => `${qualifierName}: Invalid value '${qualifierValue}' - ${error}`);
      })
      .onSuccess((qualifier) => {
        contextConditions.push({ qualifierName, operator: 'matches', value: qualifierValue });
        return succeed(qualifier);
      })
      .aggregateError(errors);
  }

  return errors.returnOrReport(succeed(contextConditions));
}

/**
 * Helper function to check if a resource ID already exists.
 *
 * @param resourceId - The resource ID to check
 * @param processedResources - The processed resources (may be null)
 * @param pendingResources - Map of pending resources
 * @returns true if the ID already exists, false otherwise
 */
function isResourceIdTaken(
  resourceId: string,
  processedResources: IProcessedResources | null,
  pendingResources: Map<string, ResourceJson.Json.ILooseResourceDecl>
): boolean {
  return (
    processedResources?.summary?.resourceIds?.find((rid) => rid === resourceId) !== undefined ||
    pendingResources.has(resourceId)
  );
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
 * @param onSystemUpdate - Optional callback when the resource system is updated with edits
 * @returns Object containing resolution state, actions, and available qualifiers
 * @public
 */
export function useResolutionState(
  processedResources: IProcessedResources | null,
  onSystemUpdate?: (updatedResources: IProcessedResources) => void
): IUseResolutionStateReturn {
  // Get observability context
  const o11y = useObservability();
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
  const [resolutionResult, setResolutionResult] = useState<IResolutionResult | null>(null);
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

  // Pending resource edit state - tracks edits to pending resources separately from templates
  const [pendingResourceEdits, setPendingResourceEdits] = useState<
    Map<string, { originalValue: JsonValue; editedValue: JsonValue }>
  >(new Map());

  // Convert to the simpler Map format expected by ResolutionState
  const editedResources = useMemo(() => {
    const simpleMap = new Map<string, JsonValue>();

    // Include existing resource edits
    editedResourcesInternal.forEach((value, key) => {
      simpleMap.set(key, value.editedValue);
    });

    // Include pending resource edits
    pendingResourceEdits.forEach((value, key) => {
      simpleMap.set(key, value.editedValue);
    });

    return simpleMap;
  }, [editedResourcesInternal, pendingResourceEdits]);
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
    return editedResourcesInternal.size > 0 || pendingResourceEdits.size > 0;
  }, [editedResourcesInternal, pendingResourceEdits]);

  // Check for pending resource changes
  const hasPendingResourceChanges = useMemo(() => {
    return pendingResources.size > 0 || pendingResourceDeletions.size > 0;
  }, [pendingResources, pendingResourceDeletions]);

  // Update context value (only updates pending user values, not host values)
  const updateContextValue = useCallback(
    (qualifierName: string, value: string | undefined): Result<void> => {
      let validatedQualifierName: QualifierName | undefined;
      try {
        // Validate qualifier name using proper ts-res validator
        const qualifierNameResult = Validate.toQualifierName(qualifierName);
        if (qualifierNameResult.isFailure()) {
          const error = `${qualifierName}: Invalid qualifier name - ${qualifierNameResult.message}`;
          o11y.user.error(error);
          return fail(error);
        }

        validatedQualifierName = qualifierNameResult.value;

        // Validate qualifier exists in system (if available)
        if (processedResources?.system?.qualifiers) {
          const availableQualifiers = Array.from(processedResources.system.qualifiers.keys());
          if (!availableQualifiers.includes(validatedQualifierName)) {
            const error = `${qualifierName}: Unknown qualifier. Available qualifiers: ${availableQualifiers.join(
              ', '
            )}`;
            o11y.user.warn(error);
            // Continue anyway for flexibility, but warn user
          }
        }

        setPendingUserValues((prev) => ({
          ...prev,
          [validatedQualifierName as string]: value
        }));

        o11y.user.info(`${validatedQualifierName}: Updated context value to ${value ?? 'undefined'}`);
        return succeed(undefined);
      } catch (error) {
        const errorMessage = `${validatedQualifierName ?? qualifierName}: Failed to update context value - ${
          error instanceof Error ? error.message : String(error)
        }`;
        o11y.user.error(errorMessage);
        return fail(errorMessage);
      }
    },
    [processedResources, o11y]
  );

  // Apply context changes - applies pending user values and/or updates host values
  const applyContext = useCallback(
    (newHostManagedValues?: Record<string, string | undefined>): Result<void> => {
      if (!processedResources) {
        const error = 'context-apply: No resources loaded - cannot apply context';
        o11y.user.error(error);
        return fail(error);
      }

      try {
        if (newHostManagedValues !== undefined) {
          // When called with host values, ONLY update host values
          o11y.diag.info('context-apply: Applying host managed values', newHostManagedValues);
          setHostManagedValues(newHostManagedValues);
          o11y.diag.info('context-apply: Host-managed context values updated');
          return succeed(undefined);
        } else {
          // When called without arguments (from Apply button), apply pending user values
          o11y.diag.info('context-apply: Applying pending user values', pendingUserValues);
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
            const error = `Failed to create resolver: ${resolverResult.message}`;
            o11y.user.error(error);
            return fail(error);
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
              o11y.user.warn(
                `resolution: Failed to resolve selected resource after context change - ${resolutionResult.message}`
              );
              // Don't fail the context apply just because selected resource failed
            }
          } else if (selectedResourceId && pendingResources.has(selectedResourceId)) {
            // Re-create the mock result for pending resource with new context
            const pendingResource = pendingResources.get(selectedResourceId);
            if (pendingResource) {
              const mockResult: IResolutionResult = {
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

          const appliedValuesCount = Object.keys(pendingUserValues).length;
          const appliedValuesList = Object.entries(pendingUserValues)
            .map(([key, value]) => `${key}=${value ?? 'undefined'}`)
            .join(', ');
          o11y.user.success(`Context applied: ${appliedValuesCount} value(s) (${appliedValuesList})`);
          return succeed(undefined);
        }
      } catch (error) {
        const errorMessage = `context-apply: Failed to apply context - ${
          error instanceof Error ? error.message : String(error)
        }`;
        o11y.user.error(errorMessage);
        return fail(errorMessage);
      }
    },
    [processedResources, pendingUserValues, selectedResourceId, o11y, hostManagedValues, pendingResources]
  );

  // Select resource and resolve it
  const selectResource = useCallback(
    (resourceId: string): Result<void> => {
      try {
        // Validate resource ID using proper ts-res validator
        const resourceIdResult = Validate.toResourceId(resourceId);
        if (resourceIdResult.isFailure()) {
          const error = `Invalid resource ID: ${resourceIdResult.message}`;
          o11y.user.error(error);
          return fail(error);
        }

        const validatedResourceId = resourceIdResult.value;

        // Check if this is a pending new resource
        const pendingResource = pendingResources.get(resourceId);
        if (pendingResource) {
          setSelectedResourceId(resourceId);
          setResolutionResult(null);

          // For pending new resources, create a mock resolution result
          const mockResult: IResolutionResult = {
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
          o11y.diag.info(`Selected pending resource: ${resourceId}`);
          return succeed(undefined);
        }

        // Check if resource exists in the system before setting selection
        if (!processedResources) {
          const error = 'No resource system available for resource lookup';
          o11y.user.error(error);
          return fail(error);
        }

        // Check if resource exists in the system
        const resourceExists = processedResources.summary.resourceIds.includes(resourceId);

        if (!resourceExists) {
          // Resource doesn't exist - create error result but still set selection for UI consistency
          setSelectedResourceId(resourceId);
          const errorResult: IResolutionResult = {
            success: false,
            resourceId,
            error: `Failed to get resource: ${resourceId}: not found.`
          };
          setResolutionResult(errorResult);
          const error = `Resource '${resourceId}' not found in the system`;
          o11y.user.error(error);
          return fail(error);
        }

        // Resource exists, proceed with selection and resolution
        setSelectedResourceId(resourceId);
        setResolutionResult(null);

        // For existing resources, resolve normally
        if (!currentResolver) {
          const error = 'No resolver available for resource resolution';
          o11y.user.error(error);
          return fail(error);
        }

        return resolveResourceDetailed(currentResolver, validatedResourceId, processedResources)
          .onSuccess((resolvedResult) => {
            setResolutionResult(resolvedResult);
            o11y.user.info(`Selected resource: ${resourceId}`);
            return succeed(undefined);
          })
          .onFailure((resolutionError) => {
            // Create error result
            const errorResult: IResolutionResult = {
              success: false,
              resourceId,
              error: resolutionError
            };
            setResolutionResult(errorResult);
            const error = `Failed to resolve resource '${resourceId}': ${resolutionError}`;
            o11y.user.error(error);
            return fail(error);
          });
      } catch (error) {
        const errorMessage = `Unexpected error selecting resource '${resourceId}': ${
          error instanceof Error ? error.message : String(error)
        }`;
        o11y.user.error(errorMessage);
        return fail(errorMessage);
      }
    },
    [currentResolver, processedResources, pendingResources, o11y]
  );

  // Reset cache
  const resetCache = useCallback((): Result<void> => {
    if (!currentResolver) {
      const error = 'No resolver available - cache cannot be cleared';
      o11y.user.warn(error);
      return fail(error);
    }

    try {
      currentResolver.clearConditionCache();
      o11y.diag.info('resolution: Cache cleared successfully');
      return succeed(undefined);
    } catch (error) {
      const errorMessage = `Failed to clear cache: ${error instanceof Error ? error.message : String(error)}`;
      o11y.user.error(errorMessage);
      return fail(errorMessage);
    }
  }, [currentResolver, o11y]);

  // Auto-apply when resources are loaded or host values change
  React.useEffect(() => {
    if (!processedResources) return;

    o11y.diag.info('context-auto: Auto-applying effective context', effectiveContext);
    o11y.diag.info('context-hook: Host managed values', hostManagedValues);
    o11y.diag.info('context-hook: Applied user values', appliedUserValues);

    // Create resolver with effective context whenever host values change
    const resolverResult = createResolverWithContext(processedResources, effectiveContext, {
      enableCaching: true,
      enableDebugLogging: false
    });

    if (resolverResult.isSuccess()) {
      setCurrentResolver(resolverResult.value);
      o11y.diag.info('Resolver created successfully with context:', effectiveContext);

      // Re-resolve selected resource if any (but skip pending resources)
      if (selectedResourceId && !pendingResources.has(selectedResourceId)) {
        o11y.diag.info('Re-resolving resource:', selectedResourceId);
        const resolutionResult = resolveResourceDetailed(
          resolverResult.value,
          selectedResourceId,
          processedResources
        );

        if (resolutionResult.isSuccess()) {
          o11y.diag.info('Resolution successful for resource:', selectedResourceId);
          setResolutionResult(resolutionResult.value);
        } else {
          o11y.diag.error('Resolution failed:', resolutionResult.message);
        }
      } else if (selectedResourceId && pendingResources.has(selectedResourceId)) {
        // Keep the existing mock resolution result for pending resources
        o11y.diag.info('Skipping resolution for pending resource:', selectedResourceId);
      }
    } else {
      o11y.diag.error('Failed to create resolver with effective context:', resolverResult.message);
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
        // Validate inputs using proper validators
        const resourceIdResult = Validate.toResourceId(resourceId);
        if (resourceIdResult.isFailure()) {
          const error = `Invalid resource ID: ${resourceIdResult.message}`;
          o11y.user.error(error);
          return fail(error);
        }

        // Validate edited value is not null/undefined (JsonValue allows null, but we need a real value)
        if (editedValue === null || editedValue === undefined) {
          const error = 'Edited value cannot be null or undefined';
          o11y.user.error(error);
          return fail(error);
        }

        // Validate the edited value
        const validation = validateEditedResource(editedValue);
        if (!validation.isValid) {
          const error = `Invalid edit: ${validation.errors.join(', ')}`;
          o11y.user.error(error);
          return fail(error);
        }

        // Show warnings if any
        if (validation.warnings.length > 0) {
          validation.warnings.forEach((warning: string) => o11y.user.warn(warning));
        }

        // Check if this is a pending new resource
        const pendingResource = pendingResources.get(resourceId);
        if (pendingResource) {
          // For pending resources, track the edit separately from the original template
          const originalCandidate = pendingResource.candidates?.[0];
          const originalValue = originalCandidate?.json || {};

          // Store the edit in pending resource edits
          setPendingResourceEdits((prev) => {
            const newMap = new Map(prev);
            newMap.set(resourceId, {
              originalValue,
              editedValue
            });
            return newMap;
          });

          // Update the resolution result to reflect the new value
          if (selectedResourceId === resourceId) {
            const mockResult: IResolutionResult = {
              success: true,
              resourceId,
              composedValue: isJsonObject(editedValue) ? editedValue : { value: editedValue },
              candidateDetails: [
                {
                  candidate: {
                    json: (isJsonObject(editedValue)
                      ? editedValue
                      : { value: editedValue }) as ResourceJsonObject,
                    conditions: originalCandidate?.conditions,
                    isPartial: false,
                    mergeMethod: 'replace'
                  } as Runtime.IResourceCandidate,
                  conditionSetKey: null,
                  candidateIndex: 0,
                  matched: true,
                  matchType: 'match' as const,
                  isDefaultMatch: false
                }
              ]
            };
            setResolutionResult(mockResult);
          }

          o11y.user.success(`Edit saved for pending resource: ${resourceId}`);
          return succeed(undefined);
        }

        // Check if resource exists (for existing resources)
        if (!processedResources?.summary.resourceIds.includes(resourceId)) {
          const error = `Resource '${resourceId}' not found in the system`;
          o11y.user.error(error);
          return fail(error);
        }

        // For existing resources, compute the delta and save as edit
        const resolvedValue = originalValue || editedValue; // Use originalValue as the resolved/baseline
        const deltaResult = computeResourceDelta(undefined, resolvedValue, editedValue);

        if (deltaResult.isFailure()) {
          o11y.user.warn(`Could not compute delta, saving full value: ${deltaResult.message}`);
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
          o11y.user.success(`Edit saved for ${resourceId} (delta: ${reduction}% smaller)`);
        } else {
          o11y.user.success(`Edit saved for resource ${resourceId}`);
        }

        return succeed(undefined);
      } catch (error) {
        const errorMessage = `Failed to save edit: ${error instanceof Error ? error.message : String(error)}`;
        o11y.user.error(errorMessage);
        return fail(errorMessage);
      }
    },
    [o11y, pendingResources, selectedResourceId, effectiveContext, processedResources]
  );

  const getEditedValue = useCallback(
    (resourceId: string) => {
      // Check pending resource edits first
      const pendingEdit = pendingResourceEdits.get(resourceId);
      if (pendingEdit) {
        return pendingEdit.editedValue;
      }

      // Check existing resource edits
      const existingEdit = editedResourcesInternal.get(resourceId);
      if (existingEdit) {
        return existingEdit.editedValue;
      }

      // Fall back to original pending resource value if no edits
      const pendingResource = pendingResources.get(resourceId);
      if (pendingResource) {
        return pendingResource.candidates?.[0]?.json;
      }

      return undefined;
    },
    [pendingResourceEdits, editedResourcesInternal, pendingResources]
  );

  const hasEdit = useCallback(
    (resourceId: string) => {
      // Check if there are pending resource edits
      if (pendingResourceEdits.has(resourceId)) {
        return true;
      }

      // Check if there are existing resource edits
      if (editedResourcesInternal.has(resourceId)) {
        return true;
      }

      // No edits found
      return false;
    },
    [pendingResourceEdits, editedResourcesInternal]
  );

  const clearEdits = useCallback((): Result<{ clearedCount: number }> => {
    try {
      const existingResourceEditCount = editedResourcesInternal.size;
      const pendingResourceEditCount = pendingResourceEdits.size;
      const totalCount = existingResourceEditCount + pendingResourceEditCount;

      // Clear both types of edits
      setEditedResourcesInternal(new Map());
      setPendingResourceEdits(new Map());

      const message =
        totalCount > 0
          ? `Cleared ${totalCount} pending edit${
              totalCount === 1 ? '' : 's'
            } (${existingResourceEditCount} existing resource${
              existingResourceEditCount === 1 ? '' : 's'
            }, ${pendingResourceEditCount} pending resource${pendingResourceEditCount === 1 ? '' : 's'})`
          : 'No pending edits to clear';

      o11y.diag.info(message);
      return succeed({ clearedCount: totalCount });
    } catch (error) {
      const errorMessage = `Failed to clear edits: ${error instanceof Error ? error.message : String(error)}`;
      o11y.user.error(errorMessage);
      return fail(errorMessage);
    }
  }, [editedResourcesInternal, pendingResourceEdits, o11y]);

  const discardEdits = useCallback((): Result<{ discardedCount: number }> => {
    try {
      const existingResourceEditCount = editedResourcesInternal.size;
      const pendingResourceEditCount = pendingResourceEdits.size;
      const totalCount = existingResourceEditCount + pendingResourceEditCount;

      if (!hasUnsavedEdits || totalCount === 0) {
        o11y.diag.info('edits: No unsaved edits to discard');
        return succeed({ discardedCount: 0 });
      }

      // Clear both types of edits
      setEditedResourcesInternal(new Map());
      setPendingResourceEdits(new Map());

      const message = `Discarded ${totalCount} unsaved edit${
        totalCount === 1 ? '' : 's'
      } (${existingResourceEditCount} existing resource${
        existingResourceEditCount === 1 ? '' : 's'
      }, ${pendingResourceEditCount} pending resource${pendingResourceEditCount === 1 ? '' : 's'})`;
      o11y.diag.info(message);
      return succeed({ discardedCount: totalCount });
    } catch (error) {
      const errorMessage = `Failed to discard edits: ${
        error instanceof Error ? error.message : String(error)
      }`;
      o11y.user.error(errorMessage);
      return fail(errorMessage);
    }
  }, [editedResourcesInternal, pendingResourceEdits, hasUnsavedEdits, o11y]);

  // Removed applyEdits in favor of unified applyPendingResources

  // Atomic resource creation API
  const createPendingResource = useCallback(
    (params: ICreatePendingResourceParams): Result<void> => {
      try {
        if (!processedResources) {
          return fail('No resource system available');
        }

        // Validate resource ID format first (catches empty, null, and invalid formats)
        const resourceIdResult = Validate.toResourceId(params.id);
        if (resourceIdResult.isFailure()) {
          return fail(`Invalid resource ID format '${params.id}': ${resourceIdResult.message}`);
        }

        const validatedResourceId = resourceIdResult.value;

        // Prevent temporary IDs from being persisted
        if (params.id.startsWith('new-resource-')) {
          return fail(
            `Cannot save resource with temporary ID '${params.id}'. Please provide a final resource ID.`
          );
        }

        // Validate resource ID uniqueness
        if (isResourceIdTaken(params.id, processedResources, pendingResources)) {
          return fail(`Resource ID '${params.id}' already exists. Resource IDs must be unique.`);
        }

        // Validate resource type exists
        const resourceTypeResult = findResourceType(params.resourceTypeName, availableResourceTypes);
        if (resourceTypeResult.isFailure()) {
          return fail(resourceTypeResult.message);
        }
        const resourceType = resourceTypeResult.value;

        // Create conditions from current effective context
        const contextConditionsResult = createContextConditions(
          effectiveContext,
          processedResources?.system.qualifiers
        );
        if (contextConditionsResult.isFailure()) {
          return fail(contextConditionsResult.message);
        }
        const contextConditions = contextConditionsResult.value;

        // Prepare initial JSON value - if no json provided, let resource type use its base template
        const initialJson =
          params.json !== undefined
            ? isJsonObject(params.json)
              ? params.json
              : { value: params.json }
            : undefined;

        // Create resource template using the new API with conditions and resolver
        // Pass undefined initialJson to allow resource type to provide base template
        const templateResult = resourceType.createTemplate(
          validatedResourceId,
          initialJson,
          contextConditions.length > 0 ? contextConditions : undefined,
          processedResources?.resolver
        );
        if (templateResult.isFailure()) {
          return fail(templateResult.message);
        }
        const looseResourceDecl = templateResult.value;

        // Add to pending resources
        setPendingResources((prev) => {
          const newMap = new Map(prev);
          newMap.set(params.id, looseResourceDecl);
          return newMap;
        });

        o11y.user.success(`Resource '${params.id}' created and added to pending resources`);
        return succeed(undefined);
      } catch (error) {
        const errorMessage = `Failed to create pending resource: ${
          error instanceof Error ? error.message : String(error)
        }`;
        o11y.user.error(errorMessage);
        return fail(errorMessage);
      }
    },
    [processedResources, pendingResources, availableResourceTypes, effectiveContext, o11y]
  );

  // Resource creation actions (enhanced with Result pattern return values)
  const startNewResource = useCallback(
    (
      params?: IStartNewResourceParams
    ): Result<{ draft: IResolutionState['newResourceDraft']; diagnostics: string[] }> => {
      try {
        // Determine resource type to use
        const targetTypeName = params?.resourceTypeName || params?.defaultTypeName;
        const targetType = targetTypeName
          ? availableResourceTypes.find((t) => t.key === targetTypeName) || availableResourceTypes[0]
          : availableResourceTypes[0];

        if (!targetType) {
          const error = 'No resource types available for resource creation';
          o11y.user.error(error);
          const diagnostics = `Available types: ${availableResourceTypes.map((t) => t.key).join(', ')}`;
          return fail(`${error}\n${diagnostics}`);
        }

        // Determine resource ID (pre-seeded or generate temporary)
        const resourceId = params?.id || `new-resource-${Date.now()}`;

        // If pre-seeded with an ID, validate it
        if (params?.id) {
          if (isResourceIdTaken(params.id, processedResources, pendingResources)) {
            const error = `Resource ID '${params.id}' already exists. Resource IDs must be unique.`;
            o11y.user.error(error);
            return fail(`${error}\nUse a different resource ID or let the system generate a temporary one`);
          }
        }

        // Stamp conditions from current effective context at creation time
        const contextConditionsResult = createContextConditions(
          effectiveContext,
          processedResources?.system.qualifiers
        );
        if (contextConditionsResult.isFailure()) {
          return fail(contextConditionsResult.message);
        }
        const contextConditions = contextConditionsResult.value;

        // Prepare initial JSON value if provided
        const initialJson =
          params?.json !== undefined
            ? isJsonObject(params.json)
              ? params.json
              : { value: params.json }
            : undefined;

        // Create template using new API with context conditions and resolver
        // For pre-seeded IDs, use the validated one; for temporary IDs, convert to ResourceId
        if (!Validate.isValidResourceId(resourceId)) {
          return fail(
            `Invalid resource ID '${resourceId}'. Resource IDs must be dot-separated identifiers and cannot be empty.`
          );
        }
        const templateResourceId = resourceId;

        const templateResult = targetType.createTemplate(
          templateResourceId,
          initialJson,
          contextConditions.length > 0 ? contextConditions : undefined,
          processedResources?.resolver
        );
        if (templateResult.isFailure()) {
          return fail(templateResult.message);
        }
        const template = templateResult.value;

        const draft = {
          resourceId,
          resourceType: targetType.key,
          template,
          isValid: !resourceId.startsWith('new-resource-') && Validate.isValidResourceId(resourceId)
        };

        setNewResourceDraft(draft);

        const diagnostics = [];
        if (params?.id) diagnostics.push(`Pre-seeded with resource ID '${params.id}'`);
        if (params?.resourceTypeName)
          diagnostics.push(`Pre-seeded with resource type '${params.resourceTypeName}'`);
        if (params?.json) diagnostics.push('Pre-seeded with JSON content');
        if (contextConditions.length > 0)
          diagnostics.push(`Stamped with ${contextConditions.length} context conditions`);

        o11y.diag.info(`Started new ${targetType.key} resource: ${resourceId}`);
        return succeed({ draft, diagnostics });
      } catch (error) {
        const errorMessage = `Failed to start new resource: ${
          error instanceof Error ? error.message : String(error)
        }`;
        o11y.user.error(errorMessage);
        return fail(errorMessage);
      }
    },
    [availableResourceTypes, o11y, effectiveContext, processedResources, pendingResources]
  );

  const updateNewResourceId = useCallback(
    (id: string): Result<{ draft: IResolutionState['newResourceDraft']; diagnostics: string[] }> => {
      try {
        if (!newResourceDraft) {
          const error = 'No resource draft in progress. Call startNewResource first.';
          o11y.user.error(error);
          return fail(`${error}\nUse startNewResource() to begin creating a new resource`);
        }

        // Validate ID format
        if (!Validate.isValidResourceId(id)) {
          const error = `Invalid resource ID '${id}'. Resource IDs must be dot-separated identifiers and cannot be empty.`;
          o11y.user.error(error);
          return fail(error);
        }

        // Check if ID already exists
        const diagnostics = [];
        let isValid = true;
        let validationError: string | undefined;

        if (isResourceIdTaken(id, processedResources, pendingResources)) {
          isValid = false;
          validationError = `Resource ID '${id}' already exists. Resource IDs must be unique.`;
          diagnostics.push('ID uniqueness validation failed');
        } else if (id.startsWith('new-resource-')) {
          isValid = false;
          validationError = `Resource ID '${id}' appears to be a temporary ID. Please provide a final resource ID.`;
        } else if (!Validate.isValidResourceId(id)) {
          isValid = false;
          validationError = `Resource ID '${id}' has invalid format. Resource IDs must be dot-separated identifiers.`;
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
          o11y.user.warn(validationError);
          return fail(`${validationError}\n${diagnostics.join('\n')}`);
        } else {
          o11y.diag.info(`Updated resource ID to: ${id}`);
          return succeed({ draft: updatedDraft, diagnostics });
        }
      } catch (error) {
        const errorMessage = `Failed to update resource ID: ${
          error instanceof Error ? error.message : String(error)
        }`;
        o11y.user.error(errorMessage);
        return fail(errorMessage);
      }
    },
    [newResourceDraft, processedResources, pendingResources, o11y]
  );

  const selectResourceType = useCallback(
    (typeName: string): Result<{ draft: IResolutionState['newResourceDraft']; diagnostics: string[] }> => {
      try {
        if (!newResourceDraft) {
          const error = 'No resource draft in progress. Call startNewResource first.';
          o11y.user.error(error);
          return fail(`${error}\nUse startNewResource() to begin creating a new resource`);
        }

        const typeResult = findResourceType(typeName, availableResourceTypes);
        if (typeResult.isFailure()) {
          return fail(typeResult.message);
        }
        const type = typeResult.value;

        // Extract existing JSON content and conditions from current template
        const existingCandidate = newResourceDraft.template.candidates?.[0];
        const existingJson = existingCandidate?.json;
        const existingConditions = existingCandidate?.conditions;

        // Create template with new API, preserving existing content and conditions
        if (!Validate.isValidResourceId(newResourceDraft.resourceId)) {
          return fail(
            `${newResourceDraft.resourceId}: Invalid resource ID. Resource IDs must be dot-separated identifiers and cannot be empty.`
          );
        }
        const templateResourceId = newResourceDraft.resourceId;

        const templateResult = type.createTemplate(
          templateResourceId,
          existingJson,
          existingConditions,
          processedResources?.resolver
        );
        if (templateResult.isFailure()) {
          return fail(templateResult.message);
        }

        const updatedDraft = {
          ...newResourceDraft,
          resourceType: typeName,
          template: templateResult.value
        };

        setNewResourceDraft(updatedDraft);
        o11y.diag.info(`Selected resource type: ${typeName}`);

        return succeed({
          draft: updatedDraft,
          diagnostics: [`Created ${typeName} template for resource ${newResourceDraft.resourceId}`]
        });
      } catch (error) {
        const errorMessage = `Failed to select resource type: ${
          error instanceof Error ? error.message : String(error)
        }`;
        o11y.user.error(errorMessage);
        return fail(errorMessage);
      }
    },
    [newResourceDraft, availableResourceTypes, o11y]
  );

  // New public updateNewResourceJson action
  const updateNewResourceJson = useCallback(
    (json: JsonValue): Result<{ draft: IResolutionState['newResourceDraft']; diagnostics: string[] }> => {
      try {
        if (!newResourceDraft) {
          const error = 'No resource draft in progress. Call startNewResource first.';
          o11y.user.error(error);
          return fail(`${error}\nUse startNewResource() to begin creating a new resource`);
        }

        // Validate JSON content using proper validation
        if (json === undefined || json === null) {
          const error = 'JSON content cannot be null or undefined';
          o11y.user.error(error);
          return fail(error);
        }

        // Validate that the JSON content is a valid structure
        try {
          // Ensure the JSON can be serialized and is valid
          JSON.stringify(json);
        } catch (jsonError) {
          const error = `Invalid JSON content: ${
            jsonError instanceof Error ? jsonError.message : String(jsonError)
          }`;
          o11y.user.error(error);
          return fail(error);
        }

        // Update the template with new JSON content
        const updatedTemplate = {
          ...newResourceDraft.template,
          candidates: [
            {
              json: (isJsonObject(json) ? json : { value: json }) as ResourceJsonObject,
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
        o11y.diag.info(`Updated JSON content for resource ${newResourceDraft.resourceId}`);

        return succeed({
          draft: updatedDraft,
          diagnostics: ['JSON content updated successfully', 'Resource is ready for saving as pending']
        });
      } catch (error) {
        const errorMessage = `Failed to update resource JSON: ${
          error instanceof Error ? error.message : String(error)
        }`;
        o11y.user.error(errorMessage);
        return fail(errorMessage);
      }
    },
    [newResourceDraft, o11y]
  );

  const saveNewResourceAsPending = useCallback((): Result<{
    pendingResources: Map<string, ResourceJson.Json.ILooseResourceDecl>;
    diagnostics: string[];
  }> => {
    try {
      // Enhanced validation with specific error messages
      if (!newResourceDraft) {
        const error = 'No resource draft in progress. Call startNewResource first.';
        o11y.user.error(error);
        return fail(`${error}\nUse startNewResource() to begin creating a new resource`);
      }

      if (!newResourceDraft.isValid) {
        const errors = [];
        if (newResourceDraft.resourceId.startsWith('new-resource-')) {
          errors.push('Resource ID is temporary - please set a final resource ID');
        } else if (!Validate.isValidResourceId(newResourceDraft.resourceId)) {
          errors.push('Resource ID has invalid format - must be dot-separated identifiers');
        }
        if (!newResourceDraft.resourceType) {
          errors.push('Resource type is not selected');
        }
        if (!newResourceDraft.template.candidates || newResourceDraft.template.candidates.length === 0) {
          errors.push('Resource template has no candidates');
        }

        const error = `Cannot save resource with validation errors: ${errors.join(', ')}`;
        o11y.user.error(error);
        return fail(`${error}\n${errors.join('\n')}`);
      }

      // Prevent temporary IDs from being persisted (additional safety check)
      if (
        newResourceDraft.resourceId.startsWith('new-resource-') ||
        !Validate.isValidResourceId(newResourceDraft.resourceId)
      ) {
        const error = newResourceDraft.resourceId.startsWith('new-resource-')
          ? `Cannot save resource with temporary ID '${newResourceDraft.resourceId}'. Please set a final resource ID first.`
          : `Cannot save resource with invalid ID '${newResourceDraft.resourceId}'. Resource IDs must be dot-separated identifiers.`;
        o11y.user.error(error);
        return fail(`${error}\nUse updateNewResourceId() to set a final resource ID before saving`);
      }

      // Check resource type exists
      if (!newResourceDraft.resourceType) {
        const error = `Resource type is required`;
        o11y.user.error(error);
        return fail(error);
      }

      const resourceTypeResult = findResourceType(newResourceDraft.resourceType, availableResourceTypes);
      if (resourceTypeResult.isFailure()) {
        return fail(resourceTypeResult.message);
      }

      // Check candidates exist
      if (!newResourceDraft.template.candidates || newResourceDraft.template.candidates.length === 0) {
        const error = 'Resource template must have at least one candidate';
        o11y.user.error(error);
        return fail(`${error}\nUse updateNewResourceJson() to add JSON content to the resource`);
      }

      let updatedPendingResources: Map<string, ResourceJson.Json.ILooseResourceDecl>;

      setPendingResources((prev) => {
        const newMap = new Map(prev);
        // Stamp conditions from current effective context onto all candidates for the new resource
        const contextConditionsResult = createContextConditions(
          effectiveContext,
          processedResources?.system.qualifiers
        );
        if (contextConditionsResult.isFailure()) {
          o11y.diag.warn(`Failed to create context conditions: ${contextConditionsResult.message}`);
          return prev; // Return previous state if validation fails
        }
        const contextConditions = contextConditionsResult.value;

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

      o11y.user.success(`${newResourceDraft.resourceId}: Resource added to pending resources`);

      return succeed({
        pendingResources: updatedPendingResources!,
        diagnostics
      });
    } catch (error) {
      const errorMessage = `Failed to save resource as pending: ${
        error instanceof Error ? error.message : String(error)
      }`;
      o11y.user.error(errorMessage);
      return fail(errorMessage);
    }
  }, [newResourceDraft, o11y, effectiveContext, availableResourceTypes]);

  const cancelNewResource = useCallback(() => {
    setNewResourceDraft(undefined);
  }, []);

  const removePendingResource = useCallback(
    (resourceId: string): Result<void> => {
      try {
        // Validate resource ID using proper ts-res validator
        const resourceIdResult = Validate.toResourceId(resourceId);
        if (resourceIdResult.isFailure()) {
          const error = `Invalid resource ID: ${resourceIdResult.message}`;
          o11y.user.error(error);
          return fail(error);
        }

        // Check if the pending resource exists
        if (!pendingResources.has(resourceId)) {
          const error = `Pending resource '${resourceId}' not found`;
          o11y.user.warn(error);
          return fail(error);
        }

        // Remove the pending resource
        setPendingResources((prev) => {
          const newMap = new Map(prev);
          newMap.delete(resourceId);
          return newMap;
        });

        // Also remove any edits for this pending resource
        setPendingResourceEdits((prev) => {
          const newMap = new Map(prev);
          newMap.delete(resourceId);
          return newMap;
        });

        // Clear selection if this resource was selected
        if (selectedResourceId === resourceId) {
          setSelectedResourceId(null);
          setResolutionResult(null);
        }

        o11y.diag.info(`Removed pending resource: ${resourceId}`);
        return succeed(undefined);
      } catch (error) {
        const errorMessage = `Failed to remove pending resource '${resourceId}': ${
          error instanceof Error ? error.message : String(error)
        }`;
        o11y.user.error(errorMessage);
        return fail(errorMessage);
      }
    },
    [pendingResources, selectedResourceId, o11y]
  );

  const markResourceForDeletion = useCallback(
    (resourceId: string) => {
      setPendingResourceDeletions((prev) => {
        const newSet = new Set(prev);
        newSet.add(resourceId);
        return newSet;
      });
      o11y.user.info(`${resourceId}: Marked resource for deletion`);
    },
    [o11y]
  );

  const applyPendingResources = useCallback(async (): Promise<
    Result<{
      appliedCount: number;
      existingResourceEditCount: number;
      pendingResourceEditCount: number;
      newResourceCount: number;
      deletionCount: number;
    }>
  > => {
    const hasAnyChanges =
      editedResourcesInternal.size > 0 ||
      pendingResourceEdits.size > 0 ||
      pendingResources.size > 0 ||
      pendingResourceDeletions.size > 0;

    if (!hasAnyChanges) {
      const error = 'No pending changes to apply';
      o11y.user.warn(error);
      return fail(error);
    }

    if (!processedResources) {
      const error = 'No resource system available';
      o11y.user.error(error);
      return fail(error);
    }

    if (!onSystemUpdate) {
      const error = 'No system update handler provided';
      o11y.user.error(error);
      return fail(error);
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
      let resolverForContext = currentResolver;
      if (!resolverForContext) {
        const resolverCreateResult = Runtime.ResourceResolver.create({
          resourceManager: processedResources.system.resourceManager,
          qualifierTypes: processedResources.system.qualifierTypes,
          contextQualifierProvider: processedResources.system.contextQualifierProvider
        });
        if (resolverCreateResult.isFailure()) {
          const error = `Failed to create resolver: ${resolverCreateResult.message}`;
          o11y.user.error(error);
          return fail(error);
        }
        resolverForContext = resolverCreateResult.value;
      }

      const currentContext = extractResolutionContext(resolverForContext, cleanedContextValues);

      // Convert pending new resources (map → array) and apply any edits to them
      const newResourcesArray: ResourceJson.Json.ILooseResourceDecl[] = [];
      for (const [resourceId, resource] of pendingResources.entries()) {
        const pendingEdit = pendingResourceEdits.get(resourceId);
        if (pendingEdit) {
          // Apply the edit to the pending resource
          const updatedResource = {
            ...resource,
            candidates: [
              {
                json: (isJsonObject(pendingEdit.editedValue)
                  ? pendingEdit.editedValue
                  : { value: pendingEdit.editedValue }) as ResourceJsonObject,
                conditions: resource.candidates?.[0]?.conditions,
                isPartial: false,
                mergeMethod: 'replace' as const
              }
            ]
          };
          newResourcesArray.push(updatedResource);
        } else {
          newResourcesArray.push(resource);
        }
      }

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
        const error = `Failed to apply changes: ${rebuildResult.message}`;
        o11y.user.error(error);
        return fail(error);
      }

      // Capture counts before clearing the state
      const existingResourceEditCount = editedResourcesInternal.size;
      const pendingResourceEditCount = pendingResourceEdits.size;
      const newResourceCount = newResourcesArray.length;
      const deletionCount = pendingResourceDeletions.size;
      const appliedCount =
        existingResourceEditCount + pendingResourceEditCount + newResourceCount + deletionCount;

      onSystemUpdate(rebuildResult.value);

      o11y.user.success(
        `Applied ${existingResourceEditCount} existing resource edits, ${pendingResourceEditCount} pending resource edits, ${newResourceCount} additions, and ${deletionCount} deletions`
      );

      // Clear pending additions and edits after successful application
      setPendingResources(new Map());
      setPendingResourceEdits(new Map());
      setPendingResourceDeletions(new Set());
      setEditedResourcesInternal(new Map());

      return succeed({
        appliedCount,
        existingResourceEditCount,
        pendingResourceEditCount,
        newResourceCount,
        deletionCount
      });
    } catch (error) {
      const errorMessage = `Failed to apply pending resources: ${
        error instanceof Error ? error.message : String(error)
      }`;
      o11y.user.error(errorMessage);
      return fail(errorMessage);
    } finally {
      setIsApplyingEdits(false);
    }
  }, [
    pendingResources,
    pendingResourceEdits,
    pendingResourceDeletions,
    processedResources,
    onSystemUpdate,
    o11y,
    effectiveContext,
    currentResolver,
    editedResourcesInternal
  ]);

  const discardPendingResources = useCallback(() => {
    if (hasPendingResourceChanges || pendingResourceEdits.size > 0) {
      setPendingResources(new Map());
      setPendingResourceEdits(new Map());
      setPendingResourceDeletions(new Set());
      o11y.user.info('Discarded all pending resource changes and edits');
    }
  }, [hasPendingResourceChanges, pendingResourceEdits, o11y]);

  const state: IResolutionState = {
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

  const actions: IResolutionActions = useMemo(
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
