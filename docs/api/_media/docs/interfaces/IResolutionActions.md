[Home](../README.md) > IResolutionActions

# Interface: IResolutionActions

Actions available for managing resource resolution testing and editing.
Provides methods for context management, resource selection, and value editing.

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

[updateContextValue](./IResolutionActions.updateContextValue.md)

</td><td>



</td><td>

(qualifierName: string, value: string | undefined) =&gt; [Result](../type-aliases/Result.md)&lt;void&gt;

</td><td>

Update a context value for resolution testing

</td></tr>
<tr><td>

[applyContext](./IResolutionActions.applyContext.md)

</td><td>



</td><td>

(hostManagedValues?: Record&lt;string, string | undefined&gt;) =&gt; [Result](../type-aliases/Result.md)&lt;void&gt;

</td><td>

Apply pending context changes to the resolver (with optional host-managed values)

</td></tr>
<tr><td>

[selectResource](./IResolutionActions.selectResource.md)

</td><td>



</td><td>

(resourceId: string) =&gt; [Result](../type-aliases/Result.md)&lt;void&gt;

</td><td>

Select a resource for detailed resolution testing

</td></tr>
<tr><td>

[setViewMode](./IResolutionActions.setViewMode.md)

</td><td>



</td><td>

(mode: "raw" | "all" | "composed" | "best") =&gt; void

</td><td>

Change how resolution results are displayed

</td></tr>
<tr><td>

[resetCache](./IResolutionActions.resetCache.md)

</td><td>



</td><td>

() =&gt; [Result](../type-aliases/Result.md)&lt;void&gt;

</td><td>

Clear the resolution cache to force fresh resolution

</td></tr>
<tr><td>

[saveEdit](./IResolutionActions.saveEdit.md)

</td><td>



</td><td>

(resourceId: string, editedValue: [JsonValue](../type-aliases/JsonValue.md), originalValue?: [JsonValue](../type-aliases/JsonValue.md)) =&gt; [Result](../type-aliases/Result.md)&lt;void&gt;

</td><td>

Save an edit to a resource value

</td></tr>
<tr><td>

[getEditedValue](./IResolutionActions.getEditedValue.md)

</td><td>



</td><td>

(resourceId: string) =&gt; [JsonValue](../type-aliases/JsonValue.md) | undefined

</td><td>

Get the edited value for a resource, if any

</td></tr>
<tr><td>

[hasEdit](./IResolutionActions.hasEdit.md)

</td><td>



</td><td>

(resourceId: string) =&gt; boolean

</td><td>

Check if a resource has been edited

</td></tr>
<tr><td>

[clearEdits](./IResolutionActions.clearEdits.md)

</td><td>



</td><td>

() =&gt; [Result](../type-aliases/Result.md)&lt;{ clearedCount: number }&gt;

</td><td>

Clear all pending edits

</td></tr>
<tr><td>

[discardEdits](./IResolutionActions.discardEdits.md)

</td><td>



</td><td>

() =&gt; [Result](../type-aliases/Result.md)&lt;{ discardedCount: number }&gt;

</td><td>

Discard all pending edits

</td></tr>
<tr><td>

[createPendingResource](./IResolutionActions.createPendingResource.md)

</td><td>



</td><td>

(params: [ICreatePendingResourceParams](ICreatePendingResourceParams.md)) =&gt; [Result](../type-aliases/Result.md)&lt;void&gt;

</td><td>

Create a pending resource atomically with validation

</td></tr>
<tr><td>

[startNewResource](./IResolutionActions.startNewResource.md)

</td><td>



</td><td>

(params?: IStartNewResourceParams&lt;unknown, [JsonValue](../type-aliases/JsonValue.md)&gt;) =&gt; [Result](../type-aliases/Result.md)&lt;{ draft: { resourceId: string; resourceType: string; template: ILooseResourceDecl; isValid: boolean } | undefined; diagnostics: string[] }&gt;

</td><td>

Start creating a new resource (enhanced with optional pre-seeding)

</td></tr>
<tr><td>

[updateNewResourceId](./IResolutionActions.updateNewResourceId.md)

</td><td>



</td><td>

(id: string) =&gt; [Result](../type-aliases/Result.md)&lt;{ draft: { resourceId: string; resourceType: string; template: ILooseResourceDecl; isValid: boolean } | undefined; diagnostics: string[] }&gt;

</td><td>

Update the resource ID for the new resource being created

</td></tr>
<tr><td>

[selectResourceType](./IResolutionActions.selectResourceType.md)

</td><td>



</td><td>

(type: string) =&gt; [Result](../type-aliases/Result.md)&lt;{ draft: { resourceId: string; resourceType: string; template: ILooseResourceDecl; isValid: boolean } | undefined; diagnostics: string[] }&gt;

</td><td>

Select a resource type for the new resource

</td></tr>
<tr><td>

[updateNewResourceJson](./IResolutionActions.updateNewResourceJson.md)

</td><td>



</td><td>

(json: [JsonValue](../type-aliases/JsonValue.md)) =&gt; [Result](../type-aliases/Result.md)&lt;{ draft: { resourceId: string; resourceType: string; template: ILooseResourceDecl; isValid: boolean } | undefined; diagnostics: string[] }&gt;

</td><td>

Update the JSON content for the new resource being created

</td></tr>
<tr><td>

[saveNewResourceAsPending](./IResolutionActions.saveNewResourceAsPending.md)

</td><td>



</td><td>

() =&gt; [Result](../type-aliases/Result.md)&lt;{ pendingResources: Map&lt;string, ILooseResourceDecl&gt;; diagnostics: string[] }&gt;

</td><td>

Add the new resource to pending resources (not applied yet)

</td></tr>
<tr><td>

[cancelNewResource](./IResolutionActions.cancelNewResource.md)

</td><td>



</td><td>

() =&gt; void

</td><td>

Cancel the new resource creation

</td></tr>
<tr><td>

[removePendingResource](./IResolutionActions.removePendingResource.md)

</td><td>



</td><td>

(resourceId: string) =&gt; [Result](../type-aliases/Result.md)&lt;void&gt;

</td><td>

Remove a pending resource

</td></tr>
<tr><td>

[markResourceForDeletion](./IResolutionActions.markResourceForDeletion.md)

</td><td>



</td><td>

(resourceId: string) =&gt; void

</td><td>

Mark an existing resource for deletion

</td></tr>
<tr><td>

[applyPendingResources](./IResolutionActions.applyPendingResources.md)

</td><td>



</td><td>

() =&gt; Promise&lt;[Result](../type-aliases/Result.md)&lt;{ appliedCount: number; existingResourceEditCount: number; pendingResourceEditCount: number; newResourceCount: number; deletionCount: number }&gt;&gt;

</td><td>

Apply all pending resource additions and deletions

</td></tr>
<tr><td>

[discardPendingResources](./IResolutionActions.discardPendingResources.md)

</td><td>



</td><td>

() =&gt; void

</td><td>

Discard all pending resource changes

</td></tr>
</tbody></table>
