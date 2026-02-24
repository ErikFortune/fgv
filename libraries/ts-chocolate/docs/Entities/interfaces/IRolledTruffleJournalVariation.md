[Home](../../README.md) > [Entities](../README.md) > IRolledTruffleJournalVariation

# Interface: IRolledTruffleJournalVariation

Rolled truffle variation snapshot for journal entries.
Extends the entity interface with a `variationType` discriminator.

**Extends:** [`IRolledTruffleRecipeVariationEntity`](../../interfaces/IRolledTruffleRecipeVariationEntity.md)

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

[variationType](./IRolledTruffleJournalVariation.variationType.md)

</td><td>

`readonly`

</td><td>

"rolled-truffle"

</td><td>



</td></tr>
<tr><td>

[enrobingChocolate](./IRolledTruffleRecipeVariationEntity.enrobingChocolate.md)

</td><td>

`readonly`

</td><td>

[IChocolateSpec](../../type-aliases/IChocolateSpec.md)

</td><td>

Optional enrobing chocolate specification

</td></tr>
<tr><td>

[coatings](./IRolledTruffleRecipeVariationEntity.coatings.md)

</td><td>

`readonly`

</td><td>

[ICoatingsEntity](../../type-aliases/ICoatingsEntity.md)

</td><td>

Optional coatings (cocoa powder, nuts, etc.)

</td></tr>
<tr><td>

[variationSpec](./IRolledTruffleRecipeVariationEntity.variationSpec.md)

</td><td>

`readonly`

</td><td>

[ConfectionRecipeVariationSpec](../../type-aliases/ConfectionRecipeVariationSpec.md)

</td><td>

Unique identifier for this variation

</td></tr>
<tr><td>

[name](./IRolledTruffleRecipeVariationEntity.name.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional human-readable name for this variation

</td></tr>
<tr><td>

[createdDate](./IRolledTruffleRecipeVariationEntity.createdDate.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Date this variation was created (ISO 8601 format)

</td></tr>
<tr><td>

[yield](./IRolledTruffleRecipeVariationEntity.yield.md)

</td><td>

`readonly`

</td><td>

[IConfectionYield](../../interfaces/IConfectionYield.md)

</td><td>

Yield specification for this variation

</td></tr>
<tr><td>

[fillings](./IRolledTruffleRecipeVariationEntity.fillings.md)

</td><td>

`readonly`

</td><td>

readonly [IFillingSlotEntity](../../interfaces/IFillingSlotEntity.md)[]

</td><td>

Optional filling slots - each slot has independent options with a preferred selection

</td></tr>
<tr><td>

[decorations](./IRolledTruffleRecipeVariationEntity.decorations.md)

</td><td>

`readonly`

</td><td>

[IOptionsWithPreferred](../../interfaces/IOptionsWithPreferred.md)&lt;[IDecorationRefEntity](../../interfaces/IDecorationRefEntity.md), [DecorationId](../../type-aliases/DecorationId.md)&gt;

</td><td>

Optional decoration references with preferred selection

</td></tr>
<tr><td>

[procedures](./IRolledTruffleRecipeVariationEntity.procedures.md)

</td><td>

`readonly`

</td><td>

[IOptionsWithPreferred](../../interfaces/IOptionsWithPreferred.md)&lt;[IProcedureRefEntity](../../type-aliases/IProcedureRefEntity.md), [ProcedureId](../../type-aliases/ProcedureId.md)&gt;

</td><td>

Optional procedures with preferred selection

</td></tr>
<tr><td>

[notes](./IRolledTruffleRecipeVariationEntity.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](../../interfaces/ICategorizedNote.md)[]

</td><td>

Optional categorized notes about this variation

</td></tr>
<tr><td>

[additionalTags](./IRolledTruffleRecipeVariationEntity.additionalTags.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Additional tags (merged with base confection tags)

</td></tr>
<tr><td>

[additionalUrls](./IRolledTruffleRecipeVariationEntity.additionalUrls.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedUrl](../../interfaces/ICategorizedUrl.md)[]

</td><td>

Additional URLs (merged with base confection URLs)

</td></tr>
</tbody></table>
