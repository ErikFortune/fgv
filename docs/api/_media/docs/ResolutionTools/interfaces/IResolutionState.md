[Home](../../README.md) > [ResolutionTools](../README.md) > IResolutionState

# Interface: IResolutionState

Current state of resource resolution testing and debugging.
Tracks context values, resolution results, and editing state.

## Properties

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[contextValues](./IResolutionState.contextValues.md)

</td><td>



</td><td>

Record&lt;string, string | undefined&gt;

</td><td>

Current context values applied for resolution

</td></tr>
<tr><td>

[pendingContextValues](./IResolutionState.pendingContextValues.md)

</td><td>



</td><td>

Record&lt;string, string | undefined&gt;

</td><td>

Context values being edited but not yet applied

</td></tr>
<tr><td>

[selectedResourceId](./IResolutionState.selectedResourceId.md)

</td><td>



</td><td>

string | null

</td><td>

ID of the currently selected resource for resolution testing

</td></tr>
<tr><td>

[currentResolver](./IResolutionState.currentResolver.md)

</td><td>



</td><td>

ResourceResolver | null

</td><td>

The resolver instance being used for testing

</td></tr>
<tr><td>

[resolutionResult](./IResolutionState.resolutionResult.md)

</td><td>



</td><td>

[IResolutionResult](../../interfaces/IResolutionResult.md)&lt;unknown, [JsonValue](../../type-aliases/JsonValue.md)&gt; | null

</td><td>

Result of the most recent resolution attempt

</td></tr>
<tr><td>

[viewMode](./IResolutionState.viewMode.md)

</td><td>



</td><td>

"raw" | "all" | "composed" | "best"

</td><td>

Current view mode for displaying resolution results

</td></tr>
<tr><td>

[hasPendingChanges](./IResolutionState.hasPendingChanges.md)

</td><td>



</td><td>

boolean

</td><td>

Whether there are pending context changes not yet applied

</td></tr>
<tr><td>

[editedResources](./IResolutionState.editedResources.md)

</td><td>



</td><td>

Map&lt;string, [JsonValue](../../type-aliases/JsonValue.md)&gt;

</td><td>

Map of resource IDs to their edited values

</td></tr>
<tr><td>

[hasUnsavedEdits](./IResolutionState.hasUnsavedEdits.md)

</td><td>



</td><td>

boolean

</td><td>

Whether there are unsaved resource edits

</td></tr>
<tr><td>

[isApplyingEdits](./IResolutionState.isApplyingEdits.md)

</td><td>



</td><td>

boolean

</td><td>

Whether edits are currently being applied to the system

</td></tr>
<tr><td>

[pendingResources](./IResolutionState.pendingResources.md)

</td><td>



</td><td>

Map&lt;string, ILooseResourceDecl&lt;string&gt;&gt;

</td><td>

Resources waiting to be added to the system

</td></tr>
<tr><td>

[pendingResourceDeletions](./IResolutionState.pendingResourceDeletions.md)

</td><td>



</td><td>

Set&lt;string&gt;

</td><td>

IDs of resources marked for deletion

</td></tr>
<tr><td>

[newResourceDraft](./IResolutionState.newResourceDraft.md)

</td><td>



</td><td>

{ resourceId: string; resourceType: string; template: ILooseResourceDecl; isValid: boolean }

</td><td>

Draft of a new resource being created

</td></tr>
<tr><td>

[availableResourceTypes](./IResolutionState.availableResourceTypes.md)

</td><td>



</td><td>

IResourceType&lt;unknown&gt;[]

</td><td>

Available resource types for creation

</td></tr>
<tr><td>

[hasPendingResourceChanges](./IResolutionState.hasPendingResourceChanges.md)

</td><td>



</td><td>

boolean

</td><td>

Whether there are pending resource additions or deletions

</td></tr>
</tbody></table>
