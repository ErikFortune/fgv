[Home](../README.md) > IOrchestratorActions

# Interface: IOrchestratorActions

Complete actions interface for the resource orchestrator system.

This interface provides all the methods needed to manage and manipulate the orchestrator state,
including resource import/export, configuration management, filtering, resolution, and UI state.
All methods are designed to work seamlessly with the Result pattern for consistent error handling.

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

[importFileTree](./IOrchestratorActions.importFileTree.md)

</td><td>



</td><td>

(fileTree: FileTree_2) =&gt; Promise&lt;void&gt;

</td><td>



</td></tr>
<tr><td>

[importFileTreeWithConfig](./IOrchestratorActions.importFileTreeWithConfig.md)

</td><td>



</td><td>

(fileTree: FileTree_2, config: ISystemConfiguration) =&gt; Promise&lt;void&gt;

</td><td>



</td></tr>
<tr><td>

[importBundle](./IOrchestratorActions.importBundle.md)

</td><td>



</td><td>

(bundle: IBundle) =&gt; Promise&lt;void&gt;

</td><td>



</td></tr>
<tr><td>

[clearResources](./IOrchestratorActions.clearResources.md)

</td><td>



</td><td>

() =&gt; void

</td><td>



</td></tr>
<tr><td>

[updateConfiguration](./IOrchestratorActions.updateConfiguration.md)

</td><td>



</td><td>

(config: ISystemConfiguration) =&gt; void

</td><td>



</td></tr>
<tr><td>

[applyConfiguration](./IOrchestratorActions.applyConfiguration.md)

</td><td>



</td><td>

(config: ISystemConfiguration) =&gt; void

</td><td>



</td></tr>
<tr><td>

[updateFilterState](./IOrchestratorActions.updateFilterState.md)

</td><td>



</td><td>

(state: Partial&lt;[IFilterState](IFilterState.md)&gt;) =&gt; void

</td><td>



</td></tr>
<tr><td>

[applyFilter](./IOrchestratorActions.applyFilter.md)

</td><td>



</td><td>

() =&gt; Promise&lt;[IFilterResult](IFilterResult.md) | null&gt;

</td><td>



</td></tr>
<tr><td>

[resetFilter](./IOrchestratorActions.resetFilter.md)

</td><td>



</td><td>

() =&gt; void

</td><td>



</td></tr>
<tr><td>

[updateResolutionContext](./IOrchestratorActions.updateResolutionContext.md)

</td><td>



</td><td>

(qualifierName: string, value: string | undefined) =&gt; [Result](../type-aliases/Result.md)&lt;void&gt;

</td><td>



</td></tr>
<tr><td>

[applyResolutionContext](./IOrchestratorActions.applyResolutionContext.md)

</td><td>



</td><td>

(hostManagedValues?: Record&lt;string, string | undefined&gt;) =&gt; [Result](../type-aliases/Result.md)&lt;void&gt;

</td><td>



</td></tr>
<tr><td>

[selectResourceForResolution](./IOrchestratorActions.selectResourceForResolution.md)

</td><td>



</td><td>

(resourceId: string) =&gt; [Result](../type-aliases/Result.md)&lt;void&gt;

</td><td>



</td></tr>
<tr><td>

[setResolutionViewMode](./IOrchestratorActions.setResolutionViewMode.md)

</td><td>



</td><td>

(mode: "raw" | "all" | "composed" | "best") =&gt; void

</td><td>



</td></tr>
<tr><td>

[resetResolutionCache](./IOrchestratorActions.resetResolutionCache.md)

</td><td>



</td><td>

() =&gt; [Result](../type-aliases/Result.md)&lt;void&gt;

</td><td>



</td></tr>
<tr><td>

[saveResourceEdit](./IOrchestratorActions.saveResourceEdit.md)

</td><td>



</td><td>

(resourceId: string, editedValue: [JsonValue](../type-aliases/JsonValue.md), originalValue?: [JsonValue](../type-aliases/JsonValue.md)) =&gt; [Result](../type-aliases/Result.md)&lt;void&gt;

</td><td>



</td></tr>
<tr><td>

[getEditedValue](./IOrchestratorActions.getEditedValue.md)

</td><td>



</td><td>

(resourceId: string) =&gt; [JsonValue](../type-aliases/JsonValue.md) | undefined

</td><td>



</td></tr>
<tr><td>

[hasResourceEdit](./IOrchestratorActions.hasResourceEdit.md)

</td><td>



</td><td>

(resourceId: string) =&gt; boolean

</td><td>



</td></tr>
<tr><td>

[clearResourceEdits](./IOrchestratorActions.clearResourceEdits.md)

</td><td>



</td><td>

() =&gt; [Result](../type-aliases/Result.md)&lt;{ clearedCount: number }&gt;

</td><td>



</td></tr>
<tr><td>

[discardResourceEdits](./IOrchestratorActions.discardResourceEdits.md)

</td><td>



</td><td>

() =&gt; [Result](../type-aliases/Result.md)&lt;{ discardedCount: number }&gt;

</td><td>



</td></tr>
<tr><td>

[createPendingResource](./IOrchestratorActions.createPendingResource.md)

</td><td>



</td><td>

(params: [ICreatePendingResourceParams](ICreatePendingResourceParams.md)) =&gt; [Result](../type-aliases/Result.md)&lt;void&gt;

</td><td>



</td></tr>
<tr><td>

[startNewResource](./IOrchestratorActions.startNewResource.md)

</td><td>



</td><td>

(params?: IStartNewResourceParams&lt;unknown, [JsonValue](../type-aliases/JsonValue.md)&gt;) =&gt; [Result](../type-aliases/Result.md)&lt;{ draft: { resourceId: string; resourceType: string; template: ILooseResourceDecl; isValid: boolean } | undefined; diagnostics: string[] }&gt;

</td><td>



</td></tr>
<tr><td>

[updateNewResourceId](./IOrchestratorActions.updateNewResourceId.md)

</td><td>



</td><td>

(id: string) =&gt; [Result](../type-aliases/Result.md)&lt;{ draft: { resourceId: string; resourceType: string; template: ILooseResourceDecl; isValid: boolean } | undefined; diagnostics: string[] }&gt;

</td><td>



</td></tr>
<tr><td>

[selectResourceType](./IOrchestratorActions.selectResourceType.md)

</td><td>



</td><td>

(type: string) =&gt; [Result](../type-aliases/Result.md)&lt;{ draft: { resourceId: string; resourceType: string; template: ILooseResourceDecl; isValid: boolean } | undefined; diagnostics: string[] }&gt;

</td><td>



</td></tr>
<tr><td>

[updateNewResourceJson](./IOrchestratorActions.updateNewResourceJson.md)

</td><td>



</td><td>

(json: [JsonValue](../type-aliases/JsonValue.md)) =&gt; [Result](../type-aliases/Result.md)&lt;{ draft: { resourceId: string; resourceType: string; template: ILooseResourceDecl; isValid: boolean } | undefined; diagnostics: string[] }&gt;

</td><td>



</td></tr>
<tr><td>

[saveNewResourceAsPending](./IOrchestratorActions.saveNewResourceAsPending.md)

</td><td>



</td><td>

() =&gt; [Result](../type-aliases/Result.md)&lt;{ pendingResources: Map&lt;string, ILooseResourceDecl&gt;; diagnostics: string[] }&gt;

</td><td>



</td></tr>
<tr><td>

[cancelNewResource](./IOrchestratorActions.cancelNewResource.md)

</td><td>



</td><td>

() =&gt; void

</td><td>



</td></tr>
<tr><td>

[removePendingResource](./IOrchestratorActions.removePendingResource.md)

</td><td>



</td><td>

(resourceId: string) =&gt; [Result](../type-aliases/Result.md)&lt;void&gt;

</td><td>



</td></tr>
<tr><td>

[markResourceForDeletion](./IOrchestratorActions.markResourceForDeletion.md)

</td><td>



</td><td>

(resourceId: string) =&gt; void

</td><td>



</td></tr>
<tr><td>

[applyPendingResources](./IOrchestratorActions.applyPendingResources.md)

</td><td>



</td><td>

() =&gt; Promise&lt;[Result](../type-aliases/Result.md)&lt;{ appliedCount: number; existingResourceEditCount: number; pendingResourceEditCount: number; newResourceCount: number; deletionCount: number }&gt;&gt;

</td><td>



</td></tr>
<tr><td>

[discardPendingResources](./IOrchestratorActions.discardPendingResources.md)

</td><td>



</td><td>

() =&gt; void

</td><td>



</td></tr>
<tr><td>

[exportBundle](./IOrchestratorActions.exportBundle.md)

</td><td>



</td><td>

() =&gt; void

</td><td>



</td></tr>
<tr><td>

[exportSource](./IOrchestratorActions.exportSource.md)

</td><td>



</td><td>

() =&gt; void

</td><td>



</td></tr>
<tr><td>

[exportCompiled](./IOrchestratorActions.exportCompiled.md)

</td><td>



</td><td>

() =&gt; void

</td><td>



</td></tr>
<tr><td>

[selectResource](./IOrchestratorActions.selectResource.md)

</td><td>



</td><td>

(resourceId: string | null) =&gt; void

</td><td>



</td></tr>
<tr><td>

[addMessage](./IOrchestratorActions.addMessage.md)

</td><td>



</td><td>

(type: "error" | "success" | "info" | "warning", message: string) =&gt; void

</td><td>



</td></tr>
<tr><td>

[clearMessages](./IOrchestratorActions.clearMessages.md)

</td><td>



</td><td>

() =&gt; void

</td><td>



</td></tr>
<tr><td>

[o11y](./IOrchestratorActions.o11y.md)

</td><td>



</td><td>

[IObservabilityContext](IObservabilityContext.md)

</td><td>



</td></tr>
<tr><td>

[resolveResource](./IOrchestratorActions.resolveResource.md)

</td><td>



</td><td>

(resourceId: string, context?: Record&lt;string, string&gt;) =&gt; [Result](../type-aliases/Result.md)&lt;[JsonValue](../type-aliases/JsonValue.md)&gt;

</td><td>



</td></tr>
</tbody></table>
