[Home](../README.md) > IFillingEditJournalEntryEntity

# Interface: IFillingEditJournalEntryEntity

Journal entry for filling recipe edits.

**Extends:** [`IJournalEntryEntityBase<IFillingRecipeVersionEntity, FillingVersionId>`](IJournalEntryEntityBase.md)

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

[type](./IFillingEditJournalEntryEntity.type.md)

</td><td>

`readonly`

</td><td>

"filling-edit"

</td><td>

Entry type discriminator

</td></tr>
<tr><td>

[baseId](./IJournalEntryEntityBase.baseId.md)

</td><td>

`readonly`

</td><td>

[BaseJournalId](../type-aliases/BaseJournalId.md)

</td><td>

Base identifier within collection (no collection prefix)

</td></tr>
<tr><td>

[timestamp](./IJournalEntryEntityBase.timestamp.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Timestamp when this entry was created (ISO 8601 format)

</td></tr>
<tr><td>

[versionId](./IJournalEntryEntityBase.versionId.md)

</td><td>

`readonly`

</td><td>

[FillingVersionId](../type-aliases/FillingVersionId.md)

</td><td>

Source version ID for indexing and lookup

</td></tr>
<tr><td>

[recipe](./IJournalEntryEntityBase.recipe.md)

</td><td>

`readonly`

</td><td>

[IFillingRecipeVersionEntity](IFillingRecipeVersionEntity.md)

</td><td>

Full source recipe/confection at the time of the entry

</td></tr>
<tr><td>

[updated](./IJournalEntryEntityBase.updated.md)

</td><td>

`readonly`

</td><td>

[IFillingRecipeVersionEntity](IFillingRecipeVersionEntity.md)

</td><td>

Full updated version if modifications were made

</td></tr>
<tr><td>

[updatedId](./IJournalEntryEntityBase.updatedId.md)

</td><td>

`readonly`

</td><td>

[FillingVersionId](../type-aliases/FillingVersionId.md)

</td><td>

ID of the updated version if it was saved

</td></tr>
<tr><td>

[notes](./IJournalEntryEntityBase.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](ICategorizedNote.md)[]

</td><td>

Optional categorized notes about this entry

</td></tr>
</tbody></table>
