[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / ICollectionRowItem

# Interface: ICollectionRowItem

Describes a single collection for rendering in the sidebar.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-badge"></a> `badge?` | `readonly` | [`ICollectionBadge`](ICollectionBadge.md) | Optional badge rendered alongside the collection name |
| <a id="property-hasconflict"></a> `hasConflict?` | `readonly` | `boolean` | Whether this loaded collection has an orphaned encrypted shadow with the same ID in another storage root. When true, a repair action should be offered. |
| <a id="property-id"></a> `id` | `readonly` | `string` | Collection identifier |
| <a id="property-isdefault"></a> `isDefault` | `readonly` | `boolean` | Whether this collection is the default target for new entities |
| <a id="property-isdeletable"></a> `isDeletable?` | `readonly` | `boolean` | When true, the collection can be deleted even though it is not mutable. Use for user-imported read-only content (e.g., Trading Post collections) that the user should be able to remove but not edit. |
| <a id="property-ishidden"></a> `isHidden?` | `readonly` | `boolean` | Whether this collection is explicitly hidden by the user |
| <a id="property-ismutable"></a> `isMutable` | `readonly` | `boolean` | Whether this collection can be modified |
| <a id="property-isprotected"></a> `isProtected` | `readonly` | `boolean` | Whether this collection is encrypted/protected |
| <a id="property-isunlocked"></a> `isUnlocked` | `readonly` | `boolean` | Whether the protected collection has been unlocked |
| <a id="property-isvisible"></a> `isVisible` | `readonly` | `boolean` | Whether this collection is currently visible |
| <a id="property-itemcount"></a> `itemCount` | `readonly` | `number` | Number of items in this collection |
| <a id="property-name"></a> `name` | `readonly` | `string` \| `undefined` | Display name (falls back to id if undefined) |
| <a id="property-readonlylabel"></a> `readOnlyLabel?` | `readonly` | `string` | Label shown for immutable collections. Defaults to `"(built-in)"` when omitted. Set to e.g. `"(trading post)"` for imported read-only content. |
| <a id="property-sourcename"></a> `sourceName?` | `readonly` | `string` | The name of the storage source this collection was loaded from |
