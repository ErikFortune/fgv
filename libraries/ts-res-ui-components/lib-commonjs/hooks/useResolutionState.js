'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.useResolutionState = useResolutionState;
const tslib_1 = require('tslib');
const react_1 = tslib_1.__importStar(require('react'));
const ts_res_1 = require('@fgv/ts-res');
const ts_utils_1 = require('@fgv/ts-utils');
const ts_json_base_1 = require('@fgv/ts-json-base');
const resolutionUtils_1 = require('../utils/resolutionUtils');
const contexts_1 = require('../contexts');
const resolutionEditing_1 = require('../utils/resolutionEditing');
/**
 * Helper function to find and validate a resource type by name.
 *
 * @param typeName - The resource type name to find
 * @param availableResourceTypes - Array of available resource types
 * @param onMessage - Optional callback for error messages
 * @returns Result containing the found resource type or error
 */
function findResourceType(typeName, availableResourceTypes, onMessage) {
  const resourceType = availableResourceTypes.find((t) => t.key === typeName);
  if (!resourceType) {
    const availableTypes = availableResourceTypes.map((t) => t.key).join(', ');
    const error = `Resource type '${typeName}' not found`;
    onMessage?.('error', error);
    return (0, ts_utils_1.fail)(`${error}\nAvailable types: ${availableTypes}`);
  }
  return (0, ts_utils_1.succeed)(resourceType);
}
/**
 * Helper function to create condition declarations from context with proper validation.
 *
 * @param effectiveContext - The context values to create conditions from
 * @param qualifiers - The qualifiers collection for validation
 * @param onMessage - Optional callback for error messages
 * @returns Result containing condition declarations or error
 */
function createContextConditions(effectiveContext, qualifiers, onMessage) {
  // Qualifiers are required for proper validation
  if (!qualifiers) {
    const error = 'Qualifiers not available - cannot validate context values';
    onMessage?.('error', error);
    return (0, ts_utils_1.fail)(error);
  }
  const contextConditions = [];
  const errors = new ts_utils_1.MessageAggregator();
  for (const [qualifierName, qualifierValue] of Object.entries(effectiveContext)) {
    if (qualifierValue === undefined || qualifierValue === null) {
      continue; // Skip undefined/null values
    }
    qualifiers
      .get(qualifierName)
      .asResult.withErrorFormat((error) => `${qualifierName}: unknown qualifier': ${error}`)
      .onSuccess((qualifier) => {
        return qualifier
          .validateCondition(qualifierValue)
          .withErrorFormat((error) => `${qualifierName}: invalid value '${qualifierValue}': ${error}`);
      })
      .onSuccess((qualifier) => {
        contextConditions.push({ qualifierName, operator: 'matches', value: qualifierValue });
        return (0, ts_utils_1.succeed)(qualifier);
      })
      .onFailure((error) => {
        onMessage?.('error', error);
        return (0, ts_utils_1.fail)(error);
      })
      .aggregateError(errors);
  }
  return errors.returnOrReport((0, ts_utils_1.succeed)(contextConditions));
}
/**
 * Helper function to check if a resource ID already exists.
 *
 * @param resourceId - The resource ID to check
 * @param processedResources - The processed resources (may be null)
 * @param pendingResources - Map of pending resources
 * @returns true if the ID already exists, false otherwise
 */
function isResourceIdTaken(resourceId, processedResources, pendingResources) {
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
function useResolutionState(processedResources, onMessage, onSystemUpdate) {
  // Get observability context
  const o11y = (0, contexts_1.useObservability)();
  // Get available qualifiers
  const availableQualifiers = (0, react_1.useMemo)(() => {
    if (!processedResources) return [];
    return (0, resolutionUtils_1.getAvailableQualifiers)(processedResources);
  }, [processedResources]);
  // Initialize context with all qualifiers undefined
  const defaultContextValues = (0, react_1.useMemo)(() => {
    const defaults = {};
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
  const [appliedUserValues, setAppliedUserValues] = (0, react_1.useState)({});
  const [pendingUserValues, setPendingUserValues] = (0, react_1.useState)({});
  const [selectedResourceId, setSelectedResourceId] = (0, react_1.useState)(null);
  const [currentResolver, setCurrentResolver] = (0, react_1.useState)(null);
  const [resolutionResult, setResolutionResult] = (0, react_1.useState)(null);
  const [viewMode, setViewMode] = (0, react_1.useState)('composed');
  // Store host-managed values that can be updated via applyContext
  const [hostManagedValues, setHostManagedValues] = (0, react_1.useState)({});
  // Compute effective context: user values + host values (host wins)
  const effectiveContext = (0, react_1.useMemo)(
    () => ({
      ...appliedUserValues,
      ...hostManagedValues
    }),
    [appliedUserValues, hostManagedValues]
  );
  // Edit state - stores original, edited, and delta for each resource
  const [editedResourcesInternal, setEditedResourcesInternal] = (0, react_1.useState)(new Map());
  // Pending resource edit state - tracks edits to pending resources separately from templates
  const [pendingResourceEdits, setPendingResourceEdits] = (0, react_1.useState)(new Map());
  // Convert to the simpler Map format expected by ResolutionState
  const editedResources = (0, react_1.useMemo)(() => {
    const simpleMap = new Map();
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
  const [isApplyingEdits, setIsApplyingEdits] = (0, react_1.useState)(false);
  // Pending resource state
  const [pendingResources, setPendingResources] = (0, react_1.useState)(new Map());
  const [pendingResourceDeletions, setPendingResourceDeletions] = (0, react_1.useState)(new Set());
  const [newResourceDraft, setNewResourceDraft] = (0, react_1.useState)(undefined);
  // Get available resource types from the processed resources
  const availableResourceTypes = (0, react_1.useMemo)(() => {
    if (!processedResources) return [];
    const types = [];
    processedResources.system.resourceTypes.forEach((type) => {
      types.push(type);
    });
    return types;
  }, [processedResources]);
  // Update context state when defaults change
  react_1.default.useEffect(() => {
    setAppliedUserValues(defaultContextValues);
    setPendingUserValues(defaultContextValues);
  }, [defaultContextValues]);
  // Check for pending changes - only user values, not host values
  const hasPendingChanges = (0, react_1.useMemo)(() => {
    return (0, resolutionUtils_1.hasPendingContextChanges)(appliedUserValues, pendingUserValues);
  }, [appliedUserValues, pendingUserValues]);
  // Check for unsaved edits
  const hasUnsavedEdits = (0, react_1.useMemo)(() => {
    return editedResourcesInternal.size > 0 || pendingResourceEdits.size > 0;
  }, [editedResourcesInternal, pendingResourceEdits]);
  // Check for pending resource changes
  const hasPendingResourceChanges = (0, react_1.useMemo)(() => {
    return pendingResources.size > 0 || pendingResourceDeletions.size > 0;
  }, [pendingResources, pendingResourceDeletions]);
  // Update context value (only updates pending user values, not host values)
  const updateContextValue = (0, react_1.useCallback)(
    (qualifierName, value) => {
      let validatedQualifierName;
      try {
        // Validate qualifier name using proper ts-res validator
        const qualifierNameResult = ts_res_1.Validate.toQualifierName(qualifierName);
        if (qualifierNameResult.isFailure()) {
          const error = `Invalid qualifier name: ${qualifierNameResult.message}`;
          onMessage?.('error', error);
          return (0, ts_utils_1.fail)(error);
        }
        validatedQualifierName = qualifierNameResult.value;
        // Validate qualifier exists in system (if available)
        if (processedResources?.system?.qualifiers) {
          const availableQualifiers = Array.from(processedResources.system.qualifiers.keys());
          if (!availableQualifiers.includes(validatedQualifierName)) {
            const error = `Unknown qualifier '${qualifierName}'. Available qualifiers: ${availableQualifiers.join(
              ', '
            )}`;
            onMessage?.('warning', error);
            // Continue anyway for flexibility, but warn user
          }
        }
        setPendingUserValues((prev) => ({
          ...prev,
          [validatedQualifierName]: value
        }));
        onMessage?.('info', `Updated context value: ${validatedQualifierName} = ${value ?? 'undefined'}`);
        return (0, ts_utils_1.succeed)(undefined);
      } catch (error) {
        const errorMessage = `Failed to update context value '${validatedQualifierName ?? qualifierName}': ${
          error instanceof Error ? error.message : String(error)
        }`;
        onMessage?.('error', errorMessage);
        return (0, ts_utils_1.fail)(errorMessage);
      }
    },
    [processedResources, onMessage]
  );
  // Apply context changes - applies pending user values and/or updates host values
  const applyContext = (0, react_1.useCallback)(
    (newHostManagedValues) => {
      if (!processedResources) {
        const error = 'No resources loaded - cannot apply context';
        onMessage?.('error', error);
        return (0, ts_utils_1.fail)(error);
      }
      try {
        if (newHostManagedValues !== undefined) {
          // When called with host values, ONLY update host values
          o11y.diag.info('Applying host managed values:', newHostManagedValues);
          setHostManagedValues(newHostManagedValues);
          onMessage?.('success', 'Host-managed context values updated');
          return (0, ts_utils_1.succeed)(undefined);
        } else {
          // When called without arguments (from Apply button), apply pending user values
          o11y.diag.info('Applying pending user values:', pendingUserValues);
          setAppliedUserValues(pendingUserValues);
          // Create resolver with the new effective context
          const newEffectiveContext = {
            ...pendingUserValues,
            ...hostManagedValues
          };
          // Create resolver with effective context
          const resolverResult = (0, resolutionUtils_1.createResolverWithContext)(
            processedResources,
            newEffectiveContext,
            {
              enableCaching: true,
              enableDebugLogging: false
            }
          );
          if (resolverResult.isFailure()) {
            const error = `Failed to create resolver: ${resolverResult.message}`;
            onMessage?.('error', error);
            return (0, ts_utils_1.fail)(error);
          }
          setCurrentResolver(resolverResult.value);
          // If a resource is selected, resolve it with the new context (skip pending resources)
          if (selectedResourceId && !pendingResources.has(selectedResourceId)) {
            const resolutionResult = (0, resolutionUtils_1.resolveResourceDetailed)(
              resolverResult.value,
              selectedResourceId,
              processedResources
            );
            if (resolutionResult.isSuccess()) {
              setResolutionResult(resolutionResult.value);
            } else {
              onMessage?.(
                'warning',
                `Failed to resolve selected resource after context change: ${resolutionResult.message}`
              );
              // Don't fail the context apply just because selected resource failed
            }
          } else if (selectedResourceId && pendingResources.has(selectedResourceId)) {
            // Re-create the mock result for pending resource with new context
            const pendingResource = pendingResources.get(selectedResourceId);
            if (pendingResource) {
              const mockResult = {
                success: true,
                resourceId: selectedResourceId,
                composedValue: pendingResource.candidates?.[0]?.json || {},
                candidateDetails: (pendingResource.candidates || []).map((c, index) => ({
                  candidate: {
                    json: c.json || {},
                    conditions: c.conditions,
                    isPartial: c.isPartial || false,
                    mergeMethod: c.mergeMethod || 'replace'
                  },
                  conditionSetKey: null,
                  candidateIndex: index,
                  matched: true,
                  matchType: 'match',
                  isDefaultMatch: false
                }))
              };
              setResolutionResult(mockResult);
            }
          }
          onMessage?.('success', 'Context applied successfully');
          return (0, ts_utils_1.succeed)(undefined);
        }
      } catch (error) {
        const errorMessage = `Failed to apply context: ${
          error instanceof Error ? error.message : String(error)
        }`;
        onMessage?.('error', errorMessage);
        return (0, ts_utils_1.fail)(errorMessage);
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
  const selectResource = (0, react_1.useCallback)(
    (resourceId) => {
      try {
        // Validate resource ID using proper ts-res validator
        const resourceIdResult = ts_res_1.Validate.toResourceId(resourceId);
        if (resourceIdResult.isFailure()) {
          const error = `Invalid resource ID: ${resourceIdResult.message}`;
          onMessage?.('error', error);
          return (0, ts_utils_1.fail)(error);
        }
        const validatedResourceId = resourceIdResult.value;
        // Check if this is a pending new resource
        const pendingResource = pendingResources.get(resourceId);
        if (pendingResource) {
          setSelectedResourceId(resourceId);
          setResolutionResult(null);
          // For pending new resources, create a mock resolution result
          const mockResult = {
            success: true,
            resourceId,
            composedValue: pendingResource.candidates?.[0]?.json || {},
            candidateDetails: (pendingResource.candidates || []).map((c, index) => ({
              candidate: {
                json: c.json || {},
                conditions: c.conditions,
                isPartial: c.isPartial || false,
                mergeMethod: c.mergeMethod || 'replace'
              },
              conditionSetKey: null,
              candidateIndex: index,
              matched: true,
              matchType: 'match',
              isDefaultMatch: false
            }))
          };
          setResolutionResult(mockResult);
          onMessage?.('info', `Selected pending resource: ${resourceId}`);
          return (0, ts_utils_1.succeed)(undefined);
        }
        // Check if resource exists in the system before setting selection
        if (!processedResources) {
          const error = 'No resource system available for resource lookup';
          onMessage?.('error', error);
          return (0, ts_utils_1.fail)(error);
        }
        // Check if resource exists in the system
        const resourceExists = processedResources.summary.resourceIds.includes(resourceId);
        if (!resourceExists) {
          // Resource doesn't exist - create error result but still set selection for UI consistency
          setSelectedResourceId(resourceId);
          const errorResult = {
            success: false,
            resourceId,
            error: `Failed to get resource: ${resourceId}: not found.`
          };
          setResolutionResult(errorResult);
          const error = `Resource '${resourceId}' not found in the system`;
          onMessage?.('error', error);
          return (0, ts_utils_1.fail)(error);
        }
        // Resource exists, proceed with selection and resolution
        setSelectedResourceId(resourceId);
        setResolutionResult(null);
        // For existing resources, resolve normally
        if (!currentResolver) {
          const error = 'No resolver available for resource resolution';
          onMessage?.('error', error);
          return (0, ts_utils_1.fail)(error);
        }
        return (0, resolutionUtils_1.resolveResourceDetailed)(
          currentResolver,
          validatedResourceId,
          processedResources
        )
          .onSuccess((resolvedResult) => {
            setResolutionResult(resolvedResult);
            onMessage?.('info', `Selected resource: ${resourceId}`);
            return (0, ts_utils_1.succeed)(undefined);
          })
          .onFailure((resolutionError) => {
            // Create error result
            const errorResult = {
              success: false,
              resourceId,
              error: resolutionError
            };
            setResolutionResult(errorResult);
            const error = `Failed to resolve resource '${resourceId}': ${resolutionError}`;
            onMessage?.('error', error);
            return (0, ts_utils_1.fail)(error);
          });
      } catch (error) {
        const errorMessage = `Unexpected error selecting resource '${resourceId}': ${
          error instanceof Error ? error.message : String(error)
        }`;
        onMessage?.('error', errorMessage);
        return (0, ts_utils_1.fail)(errorMessage);
      }
    },
    [currentResolver, processedResources, pendingResources, onMessage]
  );
  // Reset cache
  const resetCache = (0, react_1.useCallback)(() => {
    if (!currentResolver) {
      const error = 'No resolver available - cache cannot be cleared';
      onMessage?.('warning', error);
      return (0, ts_utils_1.fail)(error);
    }
    try {
      currentResolver.clearConditionCache();
      onMessage?.('info', 'Resolution cache cleared successfully');
      return (0, ts_utils_1.succeed)(undefined);
    } catch (error) {
      const errorMessage = `Failed to clear cache: ${error instanceof Error ? error.message : String(error)}`;
      onMessage?.('error', errorMessage);
      return (0, ts_utils_1.fail)(errorMessage);
    }
  }, [currentResolver, onMessage]);
  // Auto-apply when resources are loaded or host values change
  react_1.default.useEffect(() => {
    if (!processedResources) return;
    o11y.diag.info('Auto-applying effective context:', effectiveContext);
    o11y.diag.info('Host managed values in hook:', hostManagedValues);
    o11y.diag.info('Applied user values in hook:', appliedUserValues);
    // Create resolver with effective context whenever host values change
    const resolverResult = (0, resolutionUtils_1.createResolverWithContext)(
      processedResources,
      effectiveContext,
      {
        enableCaching: true,
        enableDebugLogging: false
      }
    );
    if (resolverResult.isSuccess()) {
      setCurrentResolver(resolverResult.value);
      o11y.diag.info('Resolver created successfully with context:', effectiveContext);
      // Re-resolve selected resource if any (but skip pending resources)
      if (selectedResourceId && !pendingResources.has(selectedResourceId)) {
        o11y.diag.info('Re-resolving resource:', selectedResourceId);
        const resolutionResult = (0, resolutionUtils_1.resolveResourceDetailed)(
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
  const saveEdit = (0, react_1.useCallback)(
    (resourceId, editedValue, originalValue) => {
      try {
        // Validate inputs using proper validators
        const resourceIdResult = ts_res_1.Validate.toResourceId(resourceId);
        if (resourceIdResult.isFailure()) {
          const error = `Invalid resource ID: ${resourceIdResult.message}`;
          onMessage?.('error', error);
          return (0, ts_utils_1.fail)(error);
        }
        // Validate edited value is not null/undefined (JsonValue allows null, but we need a real value)
        if (editedValue === null || editedValue === undefined) {
          const error = 'Edited value cannot be null or undefined';
          onMessage?.('error', error);
          return (0, ts_utils_1.fail)(error);
        }
        // Validate the edited value
        const validation = (0, resolutionEditing_1.validateEditedResource)(editedValue);
        if (!validation.isValid) {
          const error = `Invalid edit: ${validation.errors.join(', ')}`;
          onMessage?.('error', error);
          return (0, ts_utils_1.fail)(error);
        }
        // Show warnings if any
        if (validation.warnings.length > 0) {
          validation.warnings.forEach((warning) => onMessage?.('warning', warning));
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
            const mockResult = {
              success: true,
              resourceId,
              composedValue: (0, ts_json_base_1.isJsonObject)(editedValue)
                ? editedValue
                : { value: editedValue },
              candidateDetails: [
                {
                  candidate: {
                    json: (0, ts_json_base_1.isJsonObject)(editedValue)
                      ? editedValue
                      : { value: editedValue },
                    conditions: originalCandidate?.conditions,
                    isPartial: false,
                    mergeMethod: 'replace'
                  },
                  conditionSetKey: null,
                  candidateIndex: 0,
                  matched: true,
                  matchType: 'match',
                  isDefaultMatch: false
                }
              ]
            };
            setResolutionResult(mockResult);
          }
          onMessage?.('info', `Edit saved for pending resource: ${resourceId}`);
          return (0, ts_utils_1.succeed)(undefined);
        }
        // Check if resource exists (for existing resources)
        if (!processedResources?.summary.resourceIds.includes(resourceId)) {
          const error = `Resource '${resourceId}' not found in the system`;
          onMessage?.('error', error);
          return (0, ts_utils_1.fail)(error);
        }
        // For existing resources, compute the delta and save as edit
        const resolvedValue = originalValue || editedValue; // Use originalValue as the resolved/baseline
        const deltaResult = (0, resolutionEditing_1.computeResourceDelta)(
          undefined,
          resolvedValue,
          editedValue
        );
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
        return (0, ts_utils_1.succeed)(undefined);
      } catch (error) {
        const errorMessage = `Failed to save edit: ${error instanceof Error ? error.message : String(error)}`;
        onMessage?.('error', errorMessage);
        return (0, ts_utils_1.fail)(errorMessage);
      }
    },
    [onMessage, pendingResources, selectedResourceId, effectiveContext, processedResources]
  );
  const getEditedValue = (0, react_1.useCallback)(
    (resourceId) => {
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
  const hasEdit = (0, react_1.useCallback)(
    (resourceId) => {
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
  const clearEdits = (0, react_1.useCallback)(() => {
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
      onMessage?.('info', message);
      return (0, ts_utils_1.succeed)({ clearedCount: totalCount });
    } catch (error) {
      const errorMessage = `Failed to clear edits: ${error instanceof Error ? error.message : String(error)}`;
      onMessage?.('error', errorMessage);
      return (0, ts_utils_1.fail)(errorMessage);
    }
  }, [editedResourcesInternal, pendingResourceEdits, onMessage]);
  const discardEdits = (0, react_1.useCallback)(() => {
    try {
      const existingResourceEditCount = editedResourcesInternal.size;
      const pendingResourceEditCount = pendingResourceEdits.size;
      const totalCount = existingResourceEditCount + pendingResourceEditCount;
      if (!hasUnsavedEdits || totalCount === 0) {
        onMessage?.('info', 'No unsaved edits to discard');
        return (0, ts_utils_1.succeed)({ discardedCount: 0 });
      }
      // Clear both types of edits
      setEditedResourcesInternal(new Map());
      setPendingResourceEdits(new Map());
      const message = `Discarded ${totalCount} unsaved edit${
        totalCount === 1 ? '' : 's'
      } (${existingResourceEditCount} existing resource${
        existingResourceEditCount === 1 ? '' : 's'
      }, ${pendingResourceEditCount} pending resource${pendingResourceEditCount === 1 ? '' : 's'})`;
      onMessage?.('info', message);
      return (0, ts_utils_1.succeed)({ discardedCount: totalCount });
    } catch (error) {
      const errorMessage = `Failed to discard edits: ${
        error instanceof Error ? error.message : String(error)
      }`;
      onMessage?.('error', errorMessage);
      return (0, ts_utils_1.fail)(errorMessage);
    }
  }, [editedResourcesInternal, pendingResourceEdits, hasUnsavedEdits, onMessage]);
  // Removed applyEdits in favor of unified applyPendingResources
  // Atomic resource creation API
  const createPendingResource = (0, react_1.useCallback)(
    (params) => {
      try {
        if (!processedResources) {
          return (0, ts_utils_1.fail)('No resource system available');
        }
        // Validate resource ID format first (catches empty, null, and invalid formats)
        const resourceIdResult = ts_res_1.Validate.toResourceId(params.id);
        if (resourceIdResult.isFailure()) {
          return (0, ts_utils_1.fail)(
            `Invalid resource ID format '${params.id}': ${resourceIdResult.message}`
          );
        }
        const validatedResourceId = resourceIdResult.value;
        // Prevent temporary IDs from being persisted
        if (params.id.startsWith('new-resource-')) {
          return (0, ts_utils_1.fail)(
            `Cannot save resource with temporary ID '${params.id}'. Please provide a final resource ID.`
          );
        }
        // Validate resource ID uniqueness
        if (isResourceIdTaken(params.id, processedResources, pendingResources)) {
          return (0, ts_utils_1.fail)(
            `Resource ID '${params.id}' already exists. Resource IDs must be unique.`
          );
        }
        // Validate resource type exists
        const resourceTypeResult = findResourceType(
          params.resourceTypeName,
          availableResourceTypes,
          onMessage
        );
        if (resourceTypeResult.isFailure()) {
          return (0, ts_utils_1.fail)(resourceTypeResult.message);
        }
        const resourceType = resourceTypeResult.value;
        // Create conditions from current effective context
        const contextConditionsResult = createContextConditions(
          effectiveContext,
          processedResources?.system.qualifiers,
          onMessage
        );
        if (contextConditionsResult.isFailure()) {
          return (0, ts_utils_1.fail)(contextConditionsResult.message);
        }
        const contextConditions = contextConditionsResult.value;
        // Prepare initial JSON value - if no json provided, let resource type use its base template
        const initialJson =
          params.json !== undefined
            ? (0, ts_json_base_1.isJsonObject)(params.json)
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
          return (0, ts_utils_1.fail)(templateResult.message);
        }
        const looseResourceDecl = templateResult.value;
        // Add to pending resources
        setPendingResources((prev) => {
          const newMap = new Map(prev);
          newMap.set(params.id, looseResourceDecl);
          return newMap;
        });
        onMessage?.('success', `Resource '${params.id}' created and added to pending resources`);
        return (0, ts_utils_1.succeed)(undefined);
      } catch (error) {
        const errorMessage = `Failed to create pending resource: ${
          error instanceof Error ? error.message : String(error)
        }`;
        onMessage?.('error', errorMessage);
        return (0, ts_utils_1.fail)(errorMessage);
      }
    },
    [processedResources, pendingResources, availableResourceTypes, effectiveContext, onMessage]
  );
  // Resource creation actions (enhanced with Result pattern return values)
  const startNewResource = (0, react_1.useCallback)(
    (params) => {
      try {
        // Determine resource type to use
        let targetTypeName = params?.resourceTypeName || params?.defaultTypeName;
        const targetType = targetTypeName
          ? availableResourceTypes.find((t) => t.key === targetTypeName) || availableResourceTypes[0]
          : availableResourceTypes[0];
        if (!targetType) {
          const error = 'No resource types available for resource creation';
          onMessage?.('error', error);
          const diagnostics = `Available types: ${availableResourceTypes.map((t) => t.key).join(', ')}`;
          return (0, ts_utils_1.fail)(`${error}\n${diagnostics}`);
        }
        // Determine resource ID (pre-seeded or generate temporary)
        const resourceId = params?.id || `new-resource-${Date.now()}`;
        // If pre-seeded with an ID, validate it
        if (params?.id) {
          if (isResourceIdTaken(params.id, processedResources, pendingResources)) {
            const error = `Resource ID '${params.id}' already exists. Resource IDs must be unique.`;
            onMessage?.('error', error);
            return (0, ts_utils_1.fail)(
              `${error}\nUse a different resource ID or let the system generate a temporary one`
            );
          }
        }
        // Stamp conditions from current effective context at creation time
        const contextConditionsResult = createContextConditions(
          effectiveContext,
          processedResources?.system.qualifiers,
          onMessage
        );
        if (contextConditionsResult.isFailure()) {
          return (0, ts_utils_1.fail)(contextConditionsResult.message);
        }
        const contextConditions = contextConditionsResult.value;
        // Prepare initial JSON value if provided
        const initialJson =
          params?.json !== undefined
            ? (0, ts_json_base_1.isJsonObject)(params.json)
              ? params.json
              : { value: params.json }
            : undefined;
        // Create template using new API with context conditions and resolver
        // For pre-seeded IDs, use the validated one; for temporary IDs, convert to ResourceId
        const templateResourceId = ts_res_1.Validate.isValidResourceId(resourceId)
          ? resourceId // Type guard ensures this is ResourceId
          : ts_res_1.Validate.toResourceId(resourceId).orDefault(resourceId); // Fallback for temporary IDs
        const templateResult = targetType.createTemplate(
          templateResourceId,
          initialJson,
          contextConditions.length > 0 ? contextConditions : undefined,
          processedResources?.resolver
        );
        if (templateResult.isFailure()) {
          return (0, ts_utils_1.fail)(templateResult.message);
        }
        const template = templateResult.value;
        const draft = {
          resourceId,
          resourceType: targetType.key,
          template,
          isValid: !resourceId.startsWith('new-resource-') && ts_res_1.Validate.isValidResourceId(resourceId)
        };
        setNewResourceDraft(draft);
        const diagnostics = [];
        if (params?.id) diagnostics.push(`Pre-seeded with resource ID '${params.id}'`);
        if (params?.resourceTypeName)
          diagnostics.push(`Pre-seeded with resource type '${params.resourceTypeName}'`);
        if (params?.json) diagnostics.push('Pre-seeded with JSON content');
        if (contextConditions.length > 0)
          diagnostics.push(`Stamped with ${contextConditions.length} context conditions`);
        onMessage?.('info', `Started new ${targetType.key} resource: ${resourceId}`);
        return (0, ts_utils_1.succeed)({ draft, diagnostics });
      } catch (error) {
        const errorMessage = `Failed to start new resource: ${
          error instanceof Error ? error.message : String(error)
        }`;
        onMessage?.('error', errorMessage);
        return (0, ts_utils_1.fail)(errorMessage);
      }
    },
    [availableResourceTypes, onMessage, effectiveContext, processedResources, pendingResources]
  );
  const updateNewResourceId = (0, react_1.useCallback)(
    (id) => {
      try {
        if (!newResourceDraft) {
          const error = 'No resource draft in progress. Call startNewResource first.';
          onMessage?.('error', error);
          return (0, ts_utils_1.fail)(`${error}\nUse startNewResource() to begin creating a new resource`);
        }
        // Validate ID format
        if (!ts_res_1.Validate.isValidResourceId(id)) {
          const error = `Invalid resource ID '${id}'. Resource IDs must be dot-separated identifiers and cannot be empty.`;
          onMessage?.('error', error);
          return (0, ts_utils_1.fail)(error);
        }
        // Check if ID already exists
        const diagnostics = [];
        let isValid = true;
        let validationError;
        if (isResourceIdTaken(id, processedResources, pendingResources)) {
          isValid = false;
          validationError = `Resource ID '${id}' already exists. Resource IDs must be unique.`;
          diagnostics.push('ID uniqueness validation failed');
        } else if (id.startsWith('new-resource-')) {
          isValid = false;
          validationError = `Resource ID '${id}' appears to be a temporary ID. Please provide a final resource ID.`;
        } else if (!ts_res_1.Validate.isValidResourceId(id)) {
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
          onMessage?.('warning', validationError);
          return (0, ts_utils_1.fail)(`${validationError}\n${diagnostics.join('\n')}`);
        } else {
          onMessage?.('info', `Updated resource ID to: ${id}`);
          return (0, ts_utils_1.succeed)({ draft: updatedDraft, diagnostics });
        }
      } catch (error) {
        const errorMessage = `Failed to update resource ID: ${
          error instanceof Error ? error.message : String(error)
        }`;
        onMessage?.('error', errorMessage);
        return (0, ts_utils_1.fail)(errorMessage);
      }
    },
    [newResourceDraft, processedResources, pendingResources, onMessage]
  );
  const selectResourceType = (0, react_1.useCallback)(
    (typeName) => {
      try {
        if (!newResourceDraft) {
          const error = 'No resource draft in progress. Call startNewResource first.';
          onMessage?.('error', error);
          return (0, ts_utils_1.fail)(`${error}\nUse startNewResource() to begin creating a new resource`);
        }
        const typeResult = findResourceType(typeName, availableResourceTypes, onMessage);
        if (typeResult.isFailure()) {
          return (0, ts_utils_1.fail)(typeResult.message);
        }
        const type = typeResult.value;
        // Extract existing JSON content and conditions from current template
        const existingCandidate = newResourceDraft.template.candidates?.[0];
        const existingJson = existingCandidate?.json;
        const existingConditions = existingCandidate?.conditions;
        // Create template with new API, preserving existing content and conditions
        // Validate the resource ID or use as-is for temporary IDs
        const templateResourceId = ts_res_1.Validate.isValidResourceId(newResourceDraft.resourceId)
          ? newResourceDraft.resourceId // Type guard ensures this is ResourceId
          : ts_res_1.Validate.toResourceId(newResourceDraft.resourceId).orDefault(
              newResourceDraft.resourceId
            );
        const templateResult = type.createTemplate(
          templateResourceId,
          existingJson,
          existingConditions,
          processedResources?.resolver
        );
        if (templateResult.isFailure()) {
          return (0, ts_utils_1.fail)(templateResult.message);
        }
        const updatedDraft = {
          ...newResourceDraft,
          resourceType: typeName,
          template: templateResult.value
        };
        setNewResourceDraft(updatedDraft);
        onMessage?.('info', `Selected resource type: ${typeName}`);
        return (0, ts_utils_1.succeed)({
          draft: updatedDraft,
          diagnostics: [`Created ${typeName} template for resource ${newResourceDraft.resourceId}`]
        });
      } catch (error) {
        const errorMessage = `Failed to select resource type: ${
          error instanceof Error ? error.message : String(error)
        }`;
        onMessage?.('error', errorMessage);
        return (0, ts_utils_1.fail)(errorMessage);
      }
    },
    [newResourceDraft, availableResourceTypes, onMessage]
  );
  // New public updateNewResourceJson action
  const updateNewResourceJson = (0, react_1.useCallback)(
    (json) => {
      try {
        if (!newResourceDraft) {
          const error = 'No resource draft in progress. Call startNewResource first.';
          onMessage?.('error', error);
          return (0, ts_utils_1.fail)(`${error}\nUse startNewResource() to begin creating a new resource`);
        }
        // Validate JSON content using proper validation
        if (json === undefined || json === null) {
          const error = 'JSON content cannot be null or undefined';
          onMessage?.('error', error);
          return (0, ts_utils_1.fail)(error);
        }
        // Validate that the JSON content is a valid structure
        try {
          // Ensure the JSON can be serialized and is valid
          JSON.stringify(json);
        } catch (jsonError) {
          const error = `Invalid JSON content: ${
            jsonError instanceof Error ? jsonError.message : String(jsonError)
          }`;
          onMessage?.('error', error);
          return (0, ts_utils_1.fail)(error);
        }
        // Update the template with new JSON content
        const updatedTemplate = {
          ...newResourceDraft.template,
          candidates: [
            {
              json: (0, ts_json_base_1.isJsonObject)(json) ? json : { value: json },
              // Preserve existing conditions if any
              conditions: newResourceDraft.template.candidates?.[0]?.conditions,
              isPartial: false,
              mergeMethod: 'replace'
            }
          ]
        };
        const updatedDraft = {
          ...newResourceDraft,
          template: updatedTemplate
        };
        setNewResourceDraft(updatedDraft);
        onMessage?.('info', `Updated JSON content for resource ${newResourceDraft.resourceId}`);
        return (0, ts_utils_1.succeed)({
          draft: updatedDraft,
          diagnostics: ['JSON content updated successfully', 'Resource is ready for saving as pending']
        });
      } catch (error) {
        const errorMessage = `Failed to update resource JSON: ${
          error instanceof Error ? error.message : String(error)
        }`;
        onMessage?.('error', errorMessage);
        return (0, ts_utils_1.fail)(errorMessage);
      }
    },
    [newResourceDraft, onMessage]
  );
  const saveNewResourceAsPending = (0, react_1.useCallback)(() => {
    try {
      // Enhanced validation with specific error messages
      if (!newResourceDraft) {
        const error = 'No resource draft in progress. Call startNewResource first.';
        onMessage?.('error', error);
        return (0, ts_utils_1.fail)(`${error}\nUse startNewResource() to begin creating a new resource`);
      }
      if (!newResourceDraft.isValid) {
        const errors = [];
        if (newResourceDraft.resourceId.startsWith('new-resource-')) {
          errors.push('Resource ID is temporary - please set a final resource ID');
        } else if (!ts_res_1.Validate.isValidResourceId(newResourceDraft.resourceId)) {
          errors.push('Resource ID has invalid format - must be dot-separated identifiers');
        }
        if (!newResourceDraft.resourceType) {
          errors.push('Resource type is not selected');
        }
        if (!newResourceDraft.template.candidates || newResourceDraft.template.candidates.length === 0) {
          errors.push('Resource template has no candidates');
        }
        const error = `Cannot save resource with validation errors: ${errors.join(', ')}`;
        onMessage?.('error', error);
        return (0, ts_utils_1.fail)(`${error}\n${errors.join('\n')}`);
      }
      // Prevent temporary IDs from being persisted (additional safety check)
      if (
        newResourceDraft.resourceId.startsWith('new-resource-') ||
        !ts_res_1.Validate.isValidResourceId(newResourceDraft.resourceId)
      ) {
        const error = newResourceDraft.resourceId.startsWith('new-resource-')
          ? `Cannot save resource with temporary ID '${newResourceDraft.resourceId}'. Please set a final resource ID first.`
          : `Cannot save resource with invalid ID '${newResourceDraft.resourceId}'. Resource IDs must be dot-separated identifiers.`;
        onMessage?.('error', error);
        return (0, ts_utils_1.fail)(
          `${error}\nUse updateNewResourceId() to set a final resource ID before saving`
        );
      }
      // Check resource type exists
      if (!newResourceDraft.resourceType) {
        const error = `Resource type is required`;
        onMessage?.('error', error);
        return (0, ts_utils_1.fail)(error);
      }
      const resourceTypeResult = findResourceType(
        newResourceDraft.resourceType,
        availableResourceTypes,
        onMessage
      );
      if (resourceTypeResult.isFailure()) {
        return (0, ts_utils_1.fail)(resourceTypeResult.message);
      }
      // Check candidates exist
      if (!newResourceDraft.template.candidates || newResourceDraft.template.candidates.length === 0) {
        const error = 'Resource template must have at least one candidate';
        onMessage?.('error', error);
        return (0, ts_utils_1.fail)(
          `${error}\nUse updateNewResourceJson() to add JSON content to the resource`
        );
      }
      let updatedPendingResources;
      setPendingResources((prev) => {
        const newMap = new Map(prev);
        // Stamp conditions from current effective context onto all candidates for the new resource
        const contextConditionsResult = createContextConditions(
          effectiveContext,
          processedResources?.system.qualifiers,
          onMessage
        );
        if (contextConditionsResult.isFailure()) {
          o11y.diag.warn(`Failed to create context conditions: ${contextConditionsResult.message}`);
          return prev; // Return previous state if validation fails
        }
        const contextConditions = contextConditionsResult.value;
        const stampedTemplate = {
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
      return (0, ts_utils_1.succeed)({
        pendingResources: updatedPendingResources,
        diagnostics
      });
    } catch (error) {
      const errorMessage = `Failed to save resource as pending: ${
        error instanceof Error ? error.message : String(error)
      }`;
      onMessage?.('error', errorMessage);
      return (0, ts_utils_1.fail)(errorMessage);
    }
  }, [newResourceDraft, onMessage, effectiveContext, availableResourceTypes]);
  const cancelNewResource = (0, react_1.useCallback)(() => {
    setNewResourceDraft(undefined);
  }, []);
  const removePendingResource = (0, react_1.useCallback)(
    (resourceId) => {
      try {
        // Validate resource ID using proper ts-res validator
        const resourceIdResult = ts_res_1.Validate.toResourceId(resourceId);
        if (resourceIdResult.isFailure()) {
          const error = `Invalid resource ID: ${resourceIdResult.message}`;
          onMessage?.('error', error);
          return (0, ts_utils_1.fail)(error);
        }
        // Check if the pending resource exists
        if (!pendingResources.has(resourceId)) {
          const error = `Pending resource '${resourceId}' not found`;
          onMessage?.('warning', error);
          return (0, ts_utils_1.fail)(error);
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
        onMessage?.('info', `Removed pending resource: ${resourceId}`);
        return (0, ts_utils_1.succeed)(undefined);
      } catch (error) {
        const errorMessage = `Failed to remove pending resource '${resourceId}': ${
          error instanceof Error ? error.message : String(error)
        }`;
        onMessage?.('error', errorMessage);
        return (0, ts_utils_1.fail)(errorMessage);
      }
    },
    [pendingResources, selectedResourceId, onMessage]
  );
  const markResourceForDeletion = (0, react_1.useCallback)(
    (resourceId) => {
      setPendingResourceDeletions((prev) => {
        const newSet = new Set(prev);
        newSet.add(resourceId);
        return newSet;
      });
      onMessage?.('info', `Marked resource ${resourceId} for deletion`);
    },
    [onMessage]
  );
  const applyPendingResources = (0, react_1.useCallback)(async () => {
    const hasAnyChanges =
      editedResourcesInternal.size > 0 ||
      pendingResourceEdits.size > 0 ||
      pendingResources.size > 0 ||
      pendingResourceDeletions.size > 0;
    if (!hasAnyChanges) {
      const error = 'No pending changes to apply';
      onMessage?.('warning', error);
      return (0, ts_utils_1.fail)(error);
    }
    if (!processedResources) {
      const error = 'No resource system available';
      onMessage?.('error', error);
      return (0, ts_utils_1.fail)(error);
    }
    if (!onSystemUpdate) {
      const error = 'No system update handler provided';
      onMessage?.('error', error);
      return (0, ts_utils_1.fail)(error);
    }
    try {
      setIsApplyingEdits(true);
      // Extract current resolution context (filter out undefined values)
      const cleanedContextValues = {};
      Object.entries(effectiveContext).forEach(([key, value]) => {
        if (value !== undefined) {
          cleanedContextValues[key] = value;
        }
      });
      // Ensure we have a resolver instance to extract context
      let resolverForContext = currentResolver;
      if (!resolverForContext) {
        const resolverCreateResult = ts_res_1.Runtime.ResourceResolver.create({
          resourceManager: processedResources.system.resourceManager,
          qualifierTypes: processedResources.system.qualifierTypes,
          contextQualifierProvider: processedResources.system.contextQualifierProvider
        });
        if (resolverCreateResult.isFailure()) {
          const error = `Failed to create resolver: ${resolverCreateResult.message}`;
          onMessage?.('error', error);
          return (0, ts_utils_1.fail)(error);
        }
        resolverForContext = resolverCreateResult.value;
      }
      const currentContext = (0, resolutionEditing_1.extractResolutionContext)(
        resolverForContext,
        cleanedContextValues
      );
      // Convert pending new resources (map → array) and apply any edits to them
      const newResourcesArray = [];
      for (const [resourceId, resource] of pendingResources.entries()) {
        const pendingEdit = pendingResourceEdits.get(resourceId);
        if (pendingEdit) {
          // Apply the edit to the pending resource
          const updatedResource = {
            ...resource,
            candidates: [
              {
                json: (0, ts_json_base_1.isJsonObject)(pendingEdit.editedValue)
                  ? pendingEdit.editedValue
                  : { value: pendingEdit.editedValue },
                conditions: resource.candidates?.[0]?.conditions,
                isPartial: false,
                mergeMethod: 'replace'
              }
            ]
          };
          newResourcesArray.push(updatedResource);
        } else {
          newResourcesArray.push(resource);
        }
      }
      // Rebuild system with both edits and new resources in one pass
      const rebuildResult = await (0, resolutionEditing_1.rebuildSystemWithChanges)(
        processedResources.system,
        {
          editedResources: editedResourcesInternal,
          newResources: newResourcesArray
        },
        currentContext
      );
      if (rebuildResult.isFailure()) {
        const error = `Failed to apply changes: ${rebuildResult.message}`;
        onMessage?.('error', error);
        return (0, ts_utils_1.fail)(error);
      }
      // Capture counts before clearing the state
      const existingResourceEditCount = editedResourcesInternal.size;
      const pendingResourceEditCount = pendingResourceEdits.size;
      const newResourceCount = newResourcesArray.length;
      const deletionCount = pendingResourceDeletions.size;
      const appliedCount =
        existingResourceEditCount + pendingResourceEditCount + newResourceCount + deletionCount;
      onSystemUpdate(rebuildResult.value);
      onMessage?.(
        'success',
        `Applied ${existingResourceEditCount} existing resource edits, ${pendingResourceEditCount} pending resource edits, ${newResourceCount} additions, and ${deletionCount} deletions`
      );
      // Clear pending additions and edits after successful application
      setPendingResources(new Map());
      setPendingResourceEdits(new Map());
      setPendingResourceDeletions(new Set());
      setEditedResourcesInternal(new Map());
      return (0, ts_utils_1.succeed)({
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
      onMessage?.('error', errorMessage);
      return (0, ts_utils_1.fail)(errorMessage);
    } finally {
      setIsApplyingEdits(false);
    }
  }, [
    pendingResources,
    pendingResourceEdits,
    pendingResourceDeletions,
    processedResources,
    onSystemUpdate,
    onMessage,
    effectiveContext,
    currentResolver,
    editedResourcesInternal
  ]);
  const discardPendingResources = (0, react_1.useCallback)(() => {
    if (hasPendingResourceChanges || pendingResourceEdits.size > 0) {
      setPendingResources(new Map());
      setPendingResourceEdits(new Map());
      setPendingResourceDeletions(new Set());
      onMessage?.('info', 'Discarded all pending resource changes and edits');
    }
  }, [hasPendingResourceChanges, pendingResourceEdits, onMessage]);
  const state = {
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
  const actions = (0, react_1.useMemo)(
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
//# sourceMappingURL=useResolutionState.js.map
