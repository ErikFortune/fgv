[Home](../../README.md) > [Entities](../README.md) > IFillingSessionEntity

# Interface: IFillingSessionEntity

Persisted filling editing session with full editing state.

Contains the complete undo/redo history so the session can be
restored to its exact editing state.

**Extends:** [`ISessionEntityBase`](../../interfaces/ISessionEntityBase.md)

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

[sessionType](./IFillingSessionEntity.sessionType.md)

</td><td>

`readonly`

</td><td>

"filling"

</td><td>

Session type discriminator

</td></tr>
<tr><td>

[sourceVariationId](./IFillingSessionEntity.sourceVariationId.md)

</td><td>

`readonly`

</td><td>

[FillingRecipeVariationId](../../type-aliases/FillingRecipeVariationId.md)

</td><td>

Source filling variation being edited

</td></tr>
<tr><td>

[history](./IFillingSessionEntity.history.md)

</td><td>

`readonly`

</td><td>

[ISerializedEditingHistoryEntity](../../interfaces/ISerializedEditingHistoryEntity.md)&lt;[IProducedFillingEntity](../../interfaces/IProducedFillingEntity.md)&gt;

</td><td>

Full editing history including undo/redo stacks

</td></tr>
<tr><td>

[baseId](./ISessionEntityBase.baseId.md)

</td><td>

`readonly`

</td><td>

[BaseSessionId](../../type-aliases/BaseSessionId.md)

</td><td>

Base identifier within the collection (no collection prefix)

</td></tr>
<tr><td>

[status](./ISessionEntityBase.status.md)

</td><td>

`readonly`

</td><td>

[PersistedSessionStatus](../../type-aliases/PersistedSessionStatus.md)

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

readonly [ICategorizedNote](../../interfaces/ICategorizedNote.md)[]

</td><td>

Optional categorized notes

</td></tr>
<tr><td>

[destination](./ISessionEntityBase.destination.md)

</td><td>

`readonly`

</td><td>

[ISessionDestinationEntity](../../interfaces/ISessionDestinationEntity.md)

</td><td>

Destination configuration for saving derived entities

</td></tr>
<tr><td>

[group](./ISessionEntityBase.group.md)

</td><td>

`readonly`

</td><td>

[GroupName](../../type-aliases/GroupName.md)

</td><td>

Optional group identifier for organizing related sessions

</td></tr>
<tr><td>

[execution](./ISessionEntityBase.execution.md)

</td><td>

`readonly`

</td><td>

[IExecutionState](../../interfaces/IExecutionState.md)

</td><td>

Execution state for production tracking (present when status is 'active' or 'committing')

</td></tr>
</tbody></table>
