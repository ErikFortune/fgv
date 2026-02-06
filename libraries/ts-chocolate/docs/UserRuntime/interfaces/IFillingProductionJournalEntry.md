[Home](../../README.md) > [UserRuntime](../README.md) > IFillingProductionJournalEntry

# Interface: IFillingProductionJournalEntry

Materialized journal entry for filling production sessions.

**Extends:** [`IJournalEntryBase<IFillingRecipe, IFillingRecipeVariation, FillingRecipeVariationId, IFillingProductionJournalEntryEntity>`](../../interfaces/IJournalEntryBase.md)

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

[variationId](./IJournalEntryBase.variationId.md)

</td><td>

`readonly`

</td><td>

[FillingRecipeVariationId](../../type-aliases/FillingRecipeVariationId.md)

</td><td>

Source variation ID for indexing and lookup

</td></tr>
<tr><td>

[recipe](./IJournalEntryBase.recipe.md)

</td><td>

`readonly`

</td><td>

[IFillingRecipe](../../interfaces/IFillingRecipe.md)

</td><td>

Resolved source recipe/confection

</td></tr>
<tr><td>

[variation](./IJournalEntryBase.variation.md)

</td><td>

`readonly`

</td><td>

[IFillingRecipeVariation](../../interfaces/IFillingRecipeVariation.md)

</td><td>

Resolved source variation

</td></tr>
<tr><td>

[updated](./IJournalEntryBase.updated.md)

</td><td>

`readonly`

</td><td>

[IFillingRecipeVariation](../../interfaces/IFillingRecipeVariation.md)

</td><td>

Resolved updated variation if modifications were made

</td></tr>
<tr><td>

[updatedId](./IJournalEntryBase.updatedId.md)

</td><td>

`readonly`

</td><td>

[FillingRecipeVariationId](../../type-aliases/FillingRecipeVariationId.md)

</td><td>

ID of the updated variation if it was saved

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

[IFillingProductionJournalEntryEntity](../../interfaces/IFillingProductionJournalEntryEntity.md)

</td><td>

The underlying entity

</td></tr>
</tbody></table>
