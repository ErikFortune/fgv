[Home](../../README.md) > [UserRuntime](../README.md) > IConfectionProductionJournalEntry

# Interface: IConfectionProductionJournalEntry

Materialized journal entry for confection production sessions.

**Extends:** [`IJournalEntryBase<IConfectionBase, IConfectionRecipeVariationBase, ConfectionRecipeVariationId, IConfectionProductionJournalEntryEntity>`](../../interfaces/IJournalEntryBase.md)

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

[id](./IJournalEntryBase.id.md)

</td><td>

`readonly`

</td><td>

[JournalId](../../type-aliases/JournalId.md)

</td><td>

Composite journal entry ID (collectionId.baseId)

</td></tr>
<tr><td>

[baseId](./IJournalEntryBase.baseId.md)

</td><td>

`readonly`

</td><td>

[BaseJournalId](../../type-aliases/BaseJournalId.md)

</td><td>

Base identifier within collection (no collection prefix)

</td></tr>
<tr><td>

[timestamp](./IJournalEntryBase.timestamp.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Timestamp when this entry was created (ISO 8601 format)

</td></tr>
<tr><td>

[versionId](./IJournalEntryBase.versionId.md)

</td><td>

`readonly`

</td><td>

[ConfectionRecipeVariationId](../../type-aliases/ConfectionRecipeVariationId.md)

</td><td>

Source version ID for indexing and lookup

</td></tr>
<tr><td>

[recipe](./IJournalEntryBase.recipe.md)

</td><td>

`readonly`

</td><td>

[IConfectionBase](../../interfaces/IConfectionBase.md)

</td><td>

Resolved source recipe/confection

</td></tr>
<tr><td>

[version](./IJournalEntryBase.version.md)

</td><td>

`readonly`

</td><td>

[IConfectionRecipeVariationBase](../../interfaces/IConfectionRecipeVariationBase.md)

</td><td>

Resolved source version

</td></tr>
<tr><td>

[updated](./IJournalEntryBase.updated.md)

</td><td>

`readonly`

</td><td>

[IConfectionRecipeVariationBase](../../interfaces/IConfectionRecipeVariationBase.md)&lt;[IConfectionBase](../../interfaces/IConfectionBase.md)&lt;[AnyConfectionRecipeVariation](../../type-aliases/AnyConfectionRecipeVariation.md), [AnyConfectionRecipeEntity](../../type-aliases/AnyConfectionRecipeEntity.md)&gt;, [AnyConfectionRecipeVariationEntity](../../type-aliases/AnyConfectionRecipeVariationEntity.md)&gt;

</td><td>

Resolved updated version if modifications were made

</td></tr>
<tr><td>

[updatedId](./IJournalEntryBase.updatedId.md)

</td><td>

`readonly`

</td><td>

[ConfectionRecipeVariationId](../../type-aliases/ConfectionRecipeVariationId.md)

</td><td>

ID of the updated version if it was saved

</td></tr>
<tr><td>

[notes](./IJournalEntryBase.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](../../interfaces/ICategorizedNote.md)[]

</td><td>

Optional categorized notes about this entry

</td></tr>
<tr><td>

[entity](./IJournalEntryBase.entity.md)

</td><td>

`readonly`

</td><td>

[IConfectionProductionJournalEntryEntity](../../interfaces/IConfectionProductionJournalEntryEntity.md)

</td><td>

The underlying entity

</td></tr>
</tbody></table>
