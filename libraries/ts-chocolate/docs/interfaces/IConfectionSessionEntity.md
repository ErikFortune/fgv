[Home](../README.md) > IConfectionSessionEntity

# Interface: IConfectionSessionEntity

Persisted confection editing session with full editing state.

Contains the complete undo/redo history so the session can be
restored to its exact editing state. References child filling
sessions by their persisted session IDs.

**Extends:** [`ISessionEntityBase`](ISessionEntityBase.md)

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

[sessionType](./IConfectionSessionEntity.sessionType.md)

</td><td>

`readonly`

</td><td>

"confection"

</td><td>

Session type discriminator

</td></tr>
<tr><td>

[confectionType](./IConfectionSessionEntity.confectionType.md)

</td><td>

`readonly`

</td><td>

[ConfectionType](../type-aliases/ConfectionType.md)

</td><td>

Confection type discriminator (for type-specific restoration)

</td></tr>
<tr><td>

[sourceVariationId](./IConfectionSessionEntity.sourceVariationId.md)

</td><td>

`readonly`

</td><td>

[ConfectionRecipeVariationId](../type-aliases/ConfectionRecipeVariationId.md)

</td><td>

Source confection variation being edited

</td></tr>
<tr><td>

[history](./IConfectionSessionEntity.history.md)

</td><td>

`readonly`

</td><td>

[ISerializedEditingHistoryEntity](ISerializedEditingHistoryEntity.md)&lt;[AnyProducedConfectionEntity](../type-aliases/AnyProducedConfectionEntity.md)&gt;

</td><td>

Full editing history including undo/redo stacks

</td></tr>
<tr><td>

[childSessionIds](./IConfectionSessionEntity.childSessionIds.md)

</td><td>

`readonly`

</td><td>

Readonly&lt;Record&lt;[SlotId](../type-aliases/SlotId.md), [SessionId](../type-aliases/SessionId.md)&gt;&gt;

</td><td>

Map of slot ID to child filling session ID

</td></tr>
<tr><td>

[baseId](./ISessionEntityBase.baseId.md)

</td><td>

`readonly`

</td><td>

[BaseSessionId](../type-aliases/BaseSessionId.md)

</td><td>

Base identifier within the collection (no collection prefix)

</td></tr>
<tr><td>

[status](./ISessionEntityBase.status.md)

</td><td>

`readonly`

</td><td>

[PersistedSessionStatus](../type-aliases/PersistedSessionStatus.md)

</td><td>

Current lifecycle status

</td></tr>
<tr><td>

[createdAt](./ISessionEntityBase.createdAt.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

ISO 8601 timestamp when session was created

</td></tr>
<tr><td>

[updatedAt](./ISessionEntityBase.updatedAt.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

ISO 8601 timestamp when session was last updated

</td></tr>
<tr><td>

[label](./ISessionEntityBase.label.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

User-provided label for the session

</td></tr>
<tr><td>

[notes](./ISessionEntityBase.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](ICategorizedNote.md)[]

</td><td>

Optional categorized notes

</td></tr>
<tr><td>

[destination](./ISessionEntityBase.destination.md)

</td><td>

`readonly`

</td><td>

[ISessionDestinationEntity](ISessionDestinationEntity.md)

</td><td>

Destination configuration for saving derived entities

</td></tr>
<tr><td>

[group](./ISessionEntityBase.group.md)

</td><td>

`readonly`

</td><td>

[GroupName](../type-aliases/GroupName.md)

</td><td>

Optional group identifier for organizing related sessions

</td></tr>
<tr><td>

[execution](./ISessionEntityBase.execution.md)

</td><td>

`readonly`

</td><td>

[IExecutionState](IExecutionState.md)

</td><td>

Execution state for production tracking (present when status is 'active' or 'committing')

</td></tr>
</tbody></table>
