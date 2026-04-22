[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / ICascadeEntryBase

# Interface: ICascadeEntryBase

Base interface for a single entry in the column cascade stack.

This interface contains only the fields needed by the generic cascade
operations ([useCascadeOps](../functions/useCascadeOps.md), [useSquashAt](../functions/useSquashAt.md), [useCascadeDrillDown](../functions/useCascadeDrillDown.md)).
Domain-specific applications should extend this interface with additional
fields (e.g., target weights, source references, session context).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="entity"></a> `entity?` | `readonly` | `unknown` | Optional pre-resolved materialized entity. |
| <a id="entityid"></a> `entityId` | `readonly` | `string` | The ID of the entity (qualified ID, e.g. 'collection.base-id'). |
| <a id="entitytype"></a> `entityType` | `readonly` | `string` | The type of entity displayed in this column (domain-specific string). |
| <a id="haschanges"></a> `hasChanges?` | `readonly` | `boolean` | Whether this cascade entry has unsaved changes (set by the owning tab component). |
| <a id="mode"></a> `mode` | `readonly` | [`CascadeColumnMode`](../type-aliases/CascadeColumnMode.md) | Whether the column is in view, edit, create, or preview mode. |
| <a id="origin"></a> `origin?` | `readonly` | [`CascadeEntryOrigin`](../type-aliases/CascadeEntryOrigin.md) | How this entry was opened. Determines save/cancel behavior. **See** CascadeEntryOrigin |
| <a id="prefillname"></a> `prefillName?` | `readonly` | `string` | Pre-fill name for entity creation (set when on-blur typeahead doesn't match). |
