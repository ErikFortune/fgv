[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ResolutionTools](../README.md) / IResolutionState

# Interface: IResolutionState

Current state of resource resolution testing and debugging.
Tracks context values, resolution results, and editing state.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-availableresourcetypes"></a> `availableResourceTypes` | [`IResourceType`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs)\<`unknown`\>[] | Available resource types for creation |
| <a id="property-contextvalues"></a> `contextValues` | `Record`\<`string`, `string` \| `undefined`\> | Current context values applied for resolution |
| <a id="property-currentresolver"></a> `currentResolver` | [`ResourceResolver`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs) \| `null` | The resolver instance being used for testing |
| <a id="property-editedresources"></a> `editedResources` | `Map`\<`string`, [`JsonValue`](../../../type-aliases/JsonValue.md)\> | Map of resource IDs to their edited values |
| <a id="property-haspendingchanges"></a> `hasPendingChanges` | `boolean` | Whether there are pending context changes not yet applied |
| <a id="property-haspendingresourcechanges"></a> `hasPendingResourceChanges` | `boolean` | Whether there are pending resource additions or deletions |
| <a id="property-hasunsavededits"></a> `hasUnsavedEdits` | `boolean` | Whether there are unsaved resource edits |
| <a id="property-isapplyingedits"></a> `isApplyingEdits` | `boolean` | Whether edits are currently being applied to the system |
| <a id="property-newresourcedraft"></a> `newResourceDraft?` | `object` | Draft of a new resource being created |
| `newResourceDraft.isValid` | `boolean` | - |
| `newResourceDraft.resourceId` | `string` | - |
| `newResourceDraft.resourceType` | `string` | - |
| `newResourceDraft.template` | [`ILooseResourceDecl`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs) | - |
| <a id="property-pendingcontextvalues"></a> `pendingContextValues` | `Record`\<`string`, `string` \| `undefined`\> | Context values being edited but not yet applied |
| <a id="property-pendingresourcedeletions"></a> `pendingResourceDeletions` | `Set`\<`string`\> | IDs of resources marked for deletion |
| <a id="property-pendingresources"></a> `pendingResources` | `Map`\<`string`, [`ILooseResourceDecl`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs)\<`string`\>\> | Resources waiting to be added to the system |
| <a id="property-resolutionresult"></a> `resolutionResult` | [`IResolutionResult`](IResolutionResult.md)\<`unknown`, [`JsonValue`](../../../type-aliases/JsonValue.md)\> \| `null` | Result of the most recent resolution attempt |
| <a id="property-selectedresourceid"></a> `selectedResourceId` | `string` \| `null` | ID of the currently selected resource for resolution testing |
| <a id="property-viewmode"></a> `viewMode` | `"raw"` \| `"all"` \| `"composed"` \| `"best"` | Current view mode for displaying resolution results |
