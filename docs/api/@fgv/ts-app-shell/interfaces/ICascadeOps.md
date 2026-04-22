[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / ICascadeOps

# Interface: ICascadeOps\<TEntry\>

Semantic cascade operations.

These operations encode the cascade navigation rules:
1. Views stack on views
2. Editor replaces its view and trims views above (but not below)
3. Editors never squash editors — blocked if editors exist above target
4. Editors can stack on editors (child above parent is fine)
5. Save/cancel on nested panels pops; on primary panels returns to view
6. Preview behaves like view for all stacking/trimming rules
7. Save/cancel blocked when child editors exist above

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `TEntry` *extends* [`ICascadeEntryBase`](ICascadeEntryBase.md) | [`ICascadeEntryBase`](ICascadeEntryBase.md) | The cascade entry type, defaults to [ICascadeEntryBase](ICascadeEntryBase.md). |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="cansaveorcancel"></a> `canSaveOrCancel` | `readonly` | (`depth`) => `boolean` | Whether save/cancel is allowed at `depth` (false if child editors exist above). |
| <a id="clear"></a> `clear` | `readonly` | () => `void` | Clear the entire cascade stack. |
| <a id="clearbyid"></a> `clearById` | `readonly` | (`entityId`) => `void` | Clear the cascade if any entry has the given entity ID. |
| <a id="clearif"></a> `clearIf` | `readonly` | (`predicate`) => `void` | Clear the cascade if any entry matches the predicate. |
| <a id="drilldown"></a> `drillDown` | `readonly` | (`fromDepth`, `entry`) => [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ICascadeFind`](ICascadeFind.md)\<`TEntry`\>\> | Push a view entry after `fromDepth`, trimming anything beyond. Toggle: if the same entity is already at `fromDepth + 1`, collapse instead. |
| <a id="editorsabove"></a> `editorsAbove` | `readonly` | (`depth`) => readonly [`ICascadeFind`](ICascadeFind.md)\<`TEntry`\>[] | Return editors/creates above a given depth. |
| <a id="find"></a> `find` | `readonly` | (`predicate`) => [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ICascadeFind`](ICascadeFind.md)\<`TEntry`\>\> | Find the first entry matching a predicate. |
| <a id="hasunsavededitors"></a> `hasUnsavedEditors` | `readonly` | () => `boolean` | Whether any editors/creates exist anywhere in the stack. |
| <a id="openeditor"></a> `openEditor` | `readonly` | (`depth`) => [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ICascadeFind`](ICascadeFind.md)\<`TEntry`\>\> | Switch panel at `depth` to edit mode. Trims view/preview panels above `depth`. Blocked if editors/creates exist above. |
| <a id="opennested"></a> `openNested` | `readonly` | (`fromDepth`, `entry`) => [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ICascadeFind`](ICascadeFind.md)\<`TEntry`\>\> | Push a nested panel (create or edit) on top of the current stack. Used for typeahead-on-blur creation and sub-entity editing. |
| <a id="pop"></a> `pop` | `readonly` | () => [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ICascadeFind`](ICascadeFind.md)\<`TEntry`\>\> | Pop the topmost entry (for nested save/cancel). Always safe. |
| <a id="poptoview"></a> `popToView` | `readonly` | (`depth`, `refreshedEntity?`) => [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ICascadeFind`](ICascadeFind.md)\<`TEntry`\>\> | Transition entry at `depth` from edit/create to view mode. Used for primary entity save/cancel. |
| <a id="select"></a> `select` | `readonly` | (`entry`) => [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ICascadeFind`](ICascadeFind.md)\<`TEntry`\>\> | Replace entire stack with a single view entry (from list selection). |
| <a id="stack"></a> `stack` | `readonly` | readonly `TEntry`[] | The current cascade stack (for rendering). |
| <a id="trimto"></a> `trimTo` | `readonly` | (`depth`) => [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ICascadeFind`](ICascadeFind.md)\<`TEntry`\>\> | Trim the stack to keep only entries below `depth` (exclusive). Removes the entry at `depth` and everything above it. |
