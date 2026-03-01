[Home](../../README.md) > [Entities](../README.md) > Session

# Namespace: Session

## Namespaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[Converters](./Converters/README.md)

</td><td>

Converters for session types

</td></tr>
</tbody></table>

## Interfaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[ISessionDestinationEntity](./interfaces/ISessionDestinationEntity.md)

</td><td>

Destination collection configuration for persisting derived entities.

</td></tr>
<tr><td>

[ISerializedEditingHistoryEntity](./interfaces/ISerializedEditingHistoryEntity.md)

</td><td>

Serialized undo/redo history for any editable entity.

</td></tr>
<tr><td>

[ISessionEntityBase](./interfaces/ISessionEntityBase.md)

</td><td>

Common properties shared by all persisted session types.

</td></tr>
</tbody></table>

## Type Aliases

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[PersistedSessionSchemaVersion](./type-aliases/PersistedSessionSchemaVersion.md)

</td><td>

Schema version discriminator type.

</td></tr>
<tr><td>

[ISessionFileTreeSource](./type-aliases/ISessionFileTreeSource.md)

</td><td>

File tree source for session data.

</td></tr>
<tr><td>

[SessionsMergeSource](./type-aliases/SessionsMergeSource.md)

</td><td>

Specifies a sessions library to merge into a new library.

</td></tr>
<tr><td>

[ISessionLibraryParams](./type-aliases/ISessionLibraryParams.md)

</td><td>

Parameters for creating a SessionLibrary instance synchronously.

</td></tr>
<tr><td>

[ISessionLibraryAsyncParams](./type-aliases/ISessionLibraryAsyncParams.md)

</td><td>

Parameters for creating a SessionLibrary instance asynchronously with encryption support.

</td></tr>
<tr><td>

[SessionCollectionEntry](./type-aliases/SessionCollectionEntry.md)

</td><td>

A single entry in a session collection.

</td></tr>
<tr><td>

[SessionCollectionEntryInit](./type-aliases/SessionCollectionEntryInit.md)

</td><td>

Initialization type for a SessionLibrary collection entry.

</td></tr>
<tr><td>

[SessionCollectionValidator](./type-aliases/SessionCollectionValidator.md)

</td><td>

Validator type for SessionLibrary collections.

</td></tr>
<tr><td>

[SessionCollection](./type-aliases/SessionCollection.md)

</td><td>

Type for the collections in a SessionLibrary.

</td></tr>
</tbody></table>

## Functions

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[isFillingSessionEntity](./functions/isFillingSessionEntity.md)

</td><td>

Type guard for Entities.Session.IFillingSessionEntity | IFillingSessionEntity.

</td></tr>
<tr><td>

[isConfectionSessionEntity](./functions/isConfectionSessionEntity.md)

</td><td>

Type guard for Entities.Session.IConfectionSessionEntity | IConfectionSessionEntity.

</td></tr>
</tbody></table>

## Variables

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[PERSISTED_SESSION_SCHEMA_VERSION](./variables/PERSISTED_SESSION_SCHEMA_VERSION.md)

</td><td>

Current schema version for persisted sessions.

</td></tr>
<tr><td>

[allPersistedSessionTypes](./variables/allPersistedSessionTypes.md)

</td><td>

All possible persisted session types.

</td></tr>
<tr><td>

[allPersistedSessionStatuses](./variables/allPersistedSessionStatuses.md)

</td><td>

All possible persisted session statuses.

</td></tr>
</tbody></table>
