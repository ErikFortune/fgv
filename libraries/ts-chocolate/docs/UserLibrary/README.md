[Home](../README.md) > UserLibrary

# Namespace: UserLibrary

User library runtime packlet.

Provides runtime materialization of user library data (sessions, journals).

## Namespaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[Session](./Session/README.md)

</td><td>



</td></tr>
</tbody></table>

## Classes

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[UserLibrary](./classes/UserLibrary.md)

</td><td>

Implementation of user library runtime materialization.

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

[IMaterializedSessionBase](./interfaces/IMaterializedSessionBase.md)

</td><td>

Common metadata interface for all materialized editing sessions.

</td></tr>
<tr><td>

[ISessionContext](./interfaces/ISessionContext.md)

</td><td>

Context interface for session creation and management.

</td></tr>
<tr><td>

[ICreateFillingSessionOptions](./interfaces/ICreateFillingSessionOptions.md)

</td><td>

Options for creating a new persisted filling session.

</td></tr>
<tr><td>

[ICreateConfectionSessionOptions](./interfaces/ICreateConfectionSessionOptions.md)

</td><td>

Options for creating a new persisted confection session.

</td></tr>
<tr><td>

[IJournalEntryBase](./interfaces/IJournalEntryBase.md)

</td><td>

Base interface for materialized journal entries with resolved references.

</td></tr>
<tr><td>

[IFillingEditJournalEntry](./interfaces/IFillingEditJournalEntry.md)

</td><td>

Materialized journal entry for filling recipe edits.

</td></tr>
<tr><td>

[IConfectionEditJournalEntry](./interfaces/IConfectionEditJournalEntry.md)

</td><td>

Materialized journal entry for confection edits.

</td></tr>
<tr><td>

[IFillingProductionJournalEntry](./interfaces/IFillingProductionJournalEntry.md)

</td><td>

Materialized journal entry for filling production sessions.

</td></tr>
<tr><td>

[IConfectionProductionJournalEntry](./interfaces/IConfectionProductionJournalEntry.md)

</td><td>

Materialized journal entry for confection production sessions.

</td></tr>
<tr><td>

[IInventoryEntryBase](./interfaces/IInventoryEntryBase.md)

</td><td>

Base interface for materialized inventory entries with resolved references.

</td></tr>
<tr><td>

[IMoldInventoryEntry](./interfaces/IMoldInventoryEntry.md)

</td><td>

Materialized mold inventory entry with resolved mold reference.

</td></tr>
<tr><td>

[IIngredientInventoryEntry](./interfaces/IIngredientInventoryEntry.md)

</td><td>

Materialized ingredient inventory entry with resolved ingredient reference.

</td></tr>
<tr><td>

[IUserLibrary](./interfaces/IUserLibrary.md)

</td><td>

Runtime materialization layer for user library data.

</td></tr>
<tr><td>

[ILocation](./interfaces/ILocation.md)

</td><td>

Materialized location with parsed composite ID.

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

[AnyMaterializedSession](./type-aliases/AnyMaterializedSession.md)

</td><td>

Union type for any materialized editing session.

</td></tr>
<tr><td>

[AnyJournalEntry](./type-aliases/AnyJournalEntry.md)

</td><td>

Union type for any materialized journal entry.

</td></tr>
<tr><td>

[AnyInventoryEntry](./type-aliases/AnyInventoryEntry.md)

</td><td>

Union type for any materialized inventory entry.

</td></tr>
</tbody></table>
