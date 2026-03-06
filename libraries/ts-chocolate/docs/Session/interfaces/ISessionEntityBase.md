[Home](../../README.md) > [Session](../README.md) > ISessionEntityBase

# Interface: ISessionEntityBase

Common properties shared by all persisted session types.

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

[baseId](./ISessionEntityBase.baseId.md)

</td><td>

`readonly`

</td><td>

[BaseSessionId](../../type-aliases/BaseSessionId.md)

</td><td>

Base identifier within the collection (no collection prefix)

</td></tr>
<tr><td>

[sessionType](./ISessionEntityBase.sessionType.md)

</td><td>

`readonly`

</td><td>

[PersistedSessionType](../../type-aliases/PersistedSessionType.md)

</td><td>

Session type discriminator

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
