[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-res-ui-components](../README.md) / IResolutionActions

# Interface: IResolutionActions

Actions available for managing resource resolution testing and editing.
Provides methods for context management, resource selection, and value editing.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-applycontext"></a> `applyContext` | (`hostManagedValues?`) => [`Result`](../type-aliases/Result.md)\<`void`\> | Apply pending context changes to the resolver (with optional host-managed values) |
| <a id="property-applypendingresources"></a> `applyPendingResources` | () => `Promise`\<[`Result`](../type-aliases/Result.md)\<\{ `appliedCount`: `number`; `deletionCount`: `number`; `existingResourceEditCount`: `number`; `newResourceCount`: `number`; `pendingResourceEditCount`: `number`; \}\>\> | Apply all pending resource additions and deletions |
| <a id="property-cancelnewresource"></a> `cancelNewResource` | () => `void` | Cancel the new resource creation |
| <a id="property-clearedits"></a> `clearEdits` | () => [`Result`](../type-aliases/Result.md)\<\{ `clearedCount`: `number`; \}\> | Clear all pending edits |
| <a id="property-creatependingresource"></a> `createPendingResource` | (`params`) => [`Result`](../type-aliases/Result.md)\<`void`\> | Create a pending resource atomically with validation |
| <a id="property-discardedits"></a> `discardEdits` | () => [`Result`](../type-aliases/Result.md)\<\{ `discardedCount`: `number`; \}\> | Discard all pending edits |
| <a id="property-discardpendingresources"></a> `discardPendingResources` | () => `void` | Discard all pending resource changes |
| <a id="property-geteditedvalue"></a> `getEditedValue` | (`resourceId`) => [`JsonValue`](../type-aliases/JsonValue.md) \| `undefined` | Get the edited value for a resource, if any |
| <a id="property-hasedit"></a> `hasEdit` | (`resourceId`) => `boolean` | Check if a resource has been edited |
| <a id="property-markresourcefordeletion"></a> `markResourceForDeletion` | (`resourceId`) => `void` | Mark an existing resource for deletion |
| <a id="property-removependingresource"></a> `removePendingResource` | (`resourceId`) => [`Result`](../type-aliases/Result.md)\<`void`\> | Remove a pending resource |
| <a id="property-resetcache"></a> `resetCache` | () => [`Result`](../type-aliases/Result.md)\<`void`\> | Clear the resolution cache to force fresh resolution |
| <a id="property-saveedit"></a> `saveEdit` | (`resourceId`, `editedValue`, `originalValue?`) => [`Result`](../type-aliases/Result.md)\<`void`\> | Save an edit to a resource value |
| <a id="property-savenewresourceaspending"></a> `saveNewResourceAsPending` | () => [`Result`](../type-aliases/Result.md)\<\{ `diagnostics`: `string`[]; `pendingResources`: `Map`\<`string`, [`ILooseResourceDecl`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs)\<`string`\>\>; \}\> | Add the new resource to pending resources (not applied yet) |
| <a id="property-selectresource"></a> `selectResource` | (`resourceId`) => [`Result`](../type-aliases/Result.md)\<`void`\> | Select a resource for detailed resolution testing |
| <a id="property-selectresourcetype"></a> `selectResourceType` | (`type`) => [`Result`](../type-aliases/Result.md)\<\{ `diagnostics`: `string`[]; `draft`: \{ `isValid`: `boolean`; `resourceId`: `string`; `resourceType`: `string`; `template`: [`ILooseResourceDecl`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs); \} \| `undefined`; \}\> | Select a resource type for the new resource |
| <a id="property-setviewmode"></a> `setViewMode` | (`mode`) => `void` | Change how resolution results are displayed |
| <a id="property-startnewresource"></a> `startNewResource` | (`params?`) => [`Result`](../type-aliases/Result.md)\<\{ `diagnostics`: `string`[]; `draft`: \{ `isValid`: `boolean`; `resourceId`: `string`; `resourceType`: `string`; `template`: [`ILooseResourceDecl`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs); \} \| `undefined`; \}\> | Start creating a new resource (enhanced with optional pre-seeding) |
| <a id="property-updatecontextvalue"></a> `updateContextValue` | (`qualifierName`, `value`) => [`Result`](../type-aliases/Result.md)\<`void`\> | Update a context value for resolution testing |
| <a id="property-updatenewresourceid"></a> `updateNewResourceId` | (`id`) => [`Result`](../type-aliases/Result.md)\<\{ `diagnostics`: `string`[]; `draft`: \{ `isValid`: `boolean`; `resourceId`: `string`; `resourceType`: `string`; `template`: [`ILooseResourceDecl`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs); \} \| `undefined`; \}\> | Update the resource ID for the new resource being created |
| <a id="property-updatenewresourcejson"></a> `updateNewResourceJson` | (`json`) => [`Result`](../type-aliases/Result.md)\<\{ `diagnostics`: `string`[]; `draft`: \{ `isValid`: `boolean`; `resourceId`: `string`; `resourceType`: `string`; `template`: [`ILooseResourceDecl`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs); \} \| `undefined`; \}\> | Update the JSON content for the new resource being created |
