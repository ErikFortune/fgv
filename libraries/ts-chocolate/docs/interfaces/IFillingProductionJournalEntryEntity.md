[Home](../README.md) > IFillingProductionJournalEntryEntity

# Interface: IFillingProductionJournalEntryEntity

Journal entry for filling production sessions.

**Extends:** [`IJournalEntryEntityBase<IFillingRecipeVariationEntity, FillingRecipeVariationId>`](IJournalEntryEntityBase.md)

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

[type](./IFillingProductionJournalEntryEntity.type.md)

</td><td>

`readonly`

</td><td>

"filling-production"

</td><td>

Entry type discriminator

</td></tr>
<tr><td>

[yield](./IFillingProductionJournalEntryEntity.yield.md)

</td><td>

`readonly`

</td><td>

[Measurement](../type-aliases/Measurement.md)

</td><td>

Total yield weight of this production run

</td></tr>
<tr><td>

[produced](./IFillingProductionJournalEntryEntity.produced.md)

</td><td>

`readonly`

</td><td>

[IProducedFillingEntity](IProducedFillingEntity.md)

</td><td>

Produced filling with resolved concrete choices

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

[variationId](./IJournalEntryEntityBase.variationId.md)

</td><td>

`readonly`

</td><td>

[FillingRecipeVariationId](../type-aliases/FillingRecipeVariationId.md)

</td><td>

Source variation ID for indexing and lookup

</td></tr>
<tr><td>

[recipe](./IJournalEntryEntityBase.recipe.md)

</td><td>

`readonly`

</td><td>

[IFillingRecipeVariationEntity](IFillingRecipeVariationEntity.md)

</td><td>

Full source recipe/confection at the time of the entry

</td></tr>
<tr><td>

[updated](./IJournalEntryEntityBase.updated.md)

</td><td>

`readonly`

</td><td>

[IFillingRecipeVariationEntity](IFillingRecipeVariationEntity.md)

</td><td>

Full updated variation if modifications were made

</td></tr>
<tr><td>

[updatedId](./IJournalEntryEntityBase.updatedId.md)

</td><td>

`readonly`

</td><td>

[FillingRecipeVariationId](../type-aliases/FillingRecipeVariationId.md)

</td><td>

ID of the updated variation if it was saved

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
