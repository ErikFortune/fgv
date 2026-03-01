[Home](../../README.md) > [UserLibrary](../README.md) > IMaterializedSessionBase

# Interface: IMaterializedSessionBase

Common metadata interface for all materialized editing sessions.

Follows the library-runtime pattern where materialized classes store a data
entity and expose its properties via typed accessors. The UI layer consumes
this interface (never raw entity interfaces).

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

[baseId](./IMaterializedSessionBase.baseId.md)

</td><td>

`readonly`

</td><td>

[BaseSessionId](../../type-aliases/BaseSessionId.md)

</td><td>

Base identifier within the collection (no collection prefix)

</td></tr>
<tr><td>

[sessionType](./IMaterializedSessionBase.sessionType.md)

</td><td>

`readonly`

</td><td>

[PersistedSessionType](../../type-aliases/PersistedSessionType.md)

</td><td>

Session type discriminator

</td></tr>
<tr><td>

[status](./IMaterializedSessionBase.status.md)

</td><td>

`readonly`

</td><td>

[PersistedSessionStatus](../../type-aliases/PersistedSessionStatus.md)

</td><td>

Current lifecycle status

</td></tr>
<tr><td>

[label](./IMaterializedSessionBase.label.md)

</td><td>

`readonly`

</td><td>

string | undefined

</td><td>

User-provided label for the session

</td></tr>
<tr><td>

[group](./IMaterializedSessionBase.group.md)

</td><td>

`readonly`

</td><td>

[GroupName](../../type-aliases/GroupName.md) | undefined

</td><td>

Optional group identifier for organizing related sessions

</td></tr>
<tr><td>

[createdAt](./IMaterializedSessionBase.createdAt.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

ISO 8601 timestamp when session was created

</td></tr>
<tr><td>

[updatedAt](./IMaterializedSessionBase.updatedAt.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

ISO 8601 timestamp when session was last updated

</td></tr>
<tr><td>

[notes](./IMaterializedSessionBase.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](../../interfaces/ICategorizedNote.md)[] | undefined

</td><td>

Optional categorized notes

</td></tr>
<tr><td>

[sourceVariationId](./IMaterializedSessionBase.sourceVariationId.md)

</td><td>

`readonly`

</td><td>

[FillingRecipeVariationId](../../type-aliases/FillingRecipeVariationId.md) | [ConfectionRecipeVariationId](../../type-aliases/ConfectionRecipeVariationId.md)

</td><td>

Source variation ID for this session

</td></tr>
<tr><td>

[entity](./IMaterializedSessionBase.entity.md)

</td><td>

`readonly`

</td><td>

[AnySessionEntity](../../type-aliases/AnySessionEntity.md)

</td><td>

The underlying persisted entity

</td></tr>
</tbody></table>
