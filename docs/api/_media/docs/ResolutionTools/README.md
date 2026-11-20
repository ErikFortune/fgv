[Home](../README.md) > ResolutionTools

# Namespace: ResolutionTools

## Interfaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[IResolutionOptions](./interfaces/IResolutionOptions.md)

</td><td>

Configuration options for resource resolution operations.

</td></tr>
<tr><td>

[IResolutionState](./interfaces/IResolutionState.md)

</td><td>

Current state of resource resolution testing and debugging.

</td></tr>
<tr><td>

[IResolutionViewProps](./interfaces/IResolutionViewProps.md)

</td><td>

Props for the ResolutionView component.

</td></tr>
<tr><td>

[IResolutionResult](./interfaces/IResolutionResult.md)

</td><td>

Result of attempting to resolve a specific resource with a given context.

</td></tr>
<tr><td>

[ICandidateInfo](./interfaces/ICandidateInfo.md)

</td><td>

Detailed information about how a resource candidate was evaluated during resolution.

</td></tr>
<tr><td>

[IConditionEvaluationResult](./interfaces/IConditionEvaluationResult.md)

</td><td>

Result of evaluating a single condition during resource resolution.

</td></tr>
<tr><td>

[IEditedResourceInfo](./interfaces/IEditedResourceInfo.md)

</td><td>

Information about a resource being edited in the resolution view.

</td></tr>
<tr><td>

[IResolutionContextOptions](./interfaces/IResolutionContextOptions.md)

</td><td>

Configuration options for the resolution context controls in ResolutionView.

</td></tr>
<tr><td>

[IQualifierControlOptions](./interfaces/IQualifierControlOptions.md)

</td><td>

Options for controlling individual qualifier context controls.

</td></tr>
<tr><td>

[ICreatePendingResourceParams](./interfaces/ICreatePendingResourceParams.md)

</td><td>

Parameters for creating a pending resource atomically.

</td></tr>
<tr><td>

[IEditableJsonViewProps](./interfaces/IEditableJsonViewProps.md)

</td><td>

Props for the EditableJsonView component.

</td></tr>
<tr><td>

[IResolutionContextOptionsControlProps](./interfaces/IResolutionContextOptionsControlProps.md)

</td><td>

Props for the ResolutionContextOptionsControl component.

</td></tr>
</tbody></table>

## Functions

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[useResolutionState](./functions/useResolutionState.md)

</td><td>

Hook for managing resource resolution state and editing operations.

</td></tr>
<tr><td>

[createResolverWithContext](./functions/createResolverWithContext.md)

</td><td>

Create a resolver with context for resource resolution.

</td></tr>
<tr><td>

[evaluateConditionsForCandidate](./functions/evaluateConditionsForCandidate.md)

</td><td>

Evaluate conditions for a specific candidate and return detailed evaluation results.

</td></tr>
<tr><td>

[resolveResourceDetailed](./functions/resolveResourceDetailed.md)

</td><td>

Resolve a resource and create detailed resolution result with comprehensive analysis.

</td></tr>
<tr><td>

[getAvailableQualifiers](./functions/getAvailableQualifiers.md)

</td><td>

Get available qualifiers from processed resources.

</td></tr>
<tr><td>

[hasPendingContextChanges](./functions/hasPendingContextChanges.md)

</td><td>

Check if context has any pending changes by comparing current and pending values.

</td></tr>
<tr><td>

[getPendingAdditionsByType](./functions/getPendingAdditionsByType.md)

</td><td>

Gets pending resources filtered by resource type.

</td></tr>
<tr><td>

[isPendingAddition](./functions/isPendingAddition.md)

</td><td>

Checks if a resource ID corresponds to a pending addition.

</td></tr>
<tr><td>

[deriveLeafId](./functions/deriveLeafId.md)

</td><td>

Derives a leaf ID from a full resource ID.

</td></tr>
<tr><td>

[deriveFullId](./functions/deriveFullId.md)

</td><td>

Constructs a full resource ID from a root path and leaf ID.

</td></tr>
<tr><td>

[getPendingResourceTypes](./functions/getPendingResourceTypes.md)

</td><td>

Gets all unique resource types from pending resources.

</td></tr>
<tr><td>

[getPendingResourceStats](./functions/getPendingResourceStats.md)

</td><td>

Gets statistics about pending resources.

</td></tr>
<tr><td>

[validatePendingResourceKeys](./functions/validatePendingResourceKeys.md)

</td><td>

Validates that all keys in a pending resources map are properly formatted as full resource IDs.

</td></tr>
</tbody></table>

## Variables

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[EditableJsonView](./variables/EditableJsonView.md)

</td><td>

Interactive JSON editor for modifying resource values during resolution testing.

</td></tr>
<tr><td>

[UnifiedChangeControls](./variables/UnifiedChangeControls.md)

</td><td>

Unified change controls for ResolutionView.

</td></tr>
<tr><td>

[QualifierContextControl](./variables/QualifierContextControl.md)

</td><td>

A control component for managing individual qualifier context values.

</td></tr>
<tr><td>

[ResolutionContextOptionsControl](./variables/ResolutionContextOptionsControl.md)

</td><td>

Reusable control for configuring ResolutionView context options.

</td></tr>
</tbody></table>
