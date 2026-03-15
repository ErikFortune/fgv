[Home](../../../README.md) > [Entities](../../README.md) > [Journal](../README.md) > IBarTruffleJournalVariation

# Interface: IBarTruffleJournalVariation

Bar truffle variation snapshot for journal entries.
Extends the entity interface with a `variationType` discriminator.

**Extends:** [`IBarTruffleRecipeVariationEntity`](../../../interfaces/IBarTruffleRecipeVariationEntity.md)

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

[variationType](./IBarTruffleJournalVariation.variationType.md)

</td><td>

`readonly`

</td><td>

"bar-truffle"

</td><td>



</td></tr>
<tr><td>

[yield](./IBarTruffleRecipeVariationEntity.yield.md)

</td><td>

`readonly`

</td><td>

[IBarTruffleYield](../../../interfaces/IBarTruffleYield.md)

</td><td>

Template yield: count, weight per piece, and piece dimensions

</td></tr>
<tr><td>

[enrobingChocolate](./IBarTruffleRecipeVariationEntity.enrobingChocolate.md)

</td><td>

`readonly`

</td><td>

[IChocolateSpec](../../../type-aliases/IChocolateSpec.md)

</td><td>

Optional enrobing chocolate specification

</td></tr>
<tr><td>

[variationSpec](./IBarTruffleRecipeVariationEntity.variationSpec.md)

</td><td>

`readonly`

</td><td>

[ConfectionRecipeVariationSpec](../../../type-aliases/ConfectionRecipeVariationSpec.md)

</td><td>

Unique identifier for this variation

</td></tr>
<tr><td>

[name](./IBarTruffleRecipeVariationEntity.name.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional human-readable name for this variation

</td></tr>
<tr><td>

[createdDate](./IBarTruffleRecipeVariationEntity.createdDate.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Date this variation was created (ISO 8601 format)

</td></tr>
<tr><td>

[fillings](./IBarTruffleRecipeVariationEntity.fillings.md)

</td><td>

`readonly`

</td><td>

readonly [IFillingSlotEntity](../../../interfaces/IFillingSlotEntity.md)[]

</td><td>

Optional filling slots - each slot has independent options with a preferred selection

</td></tr>
<tr><td>

[decorations](./IBarTruffleRecipeVariationEntity.decorations.md)

</td><td>

`readonly`

</td><td>

[IOptionsWithPreferred](../../../interfaces/IOptionsWithPreferred.md)&lt;[IDecorationRefEntity](../../../interfaces/IDecorationRefEntity.md), [DecorationId](../../../type-aliases/DecorationId.md)&gt;

</td><td>

Optional decoration references with preferred selection

</td></tr>
<tr><td>

[procedures](./IBarTruffleRecipeVariationEntity.procedures.md)

</td><td>

`readonly`

</td><td>

[IOptionsWithPreferred](../../../interfaces/IOptionsWithPreferred.md)&lt;[IProcedureRefEntity](../../../type-aliases/IProcedureRefEntity.md), [ProcedureId](../../../type-aliases/ProcedureId.md)&gt;

</td><td>

Optional procedures with preferred selection

</td></tr>
<tr><td>

[notes](./IBarTruffleRecipeVariationEntity.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](../../../interfaces/ICategorizedNote.md)[]

</td><td>

Optional categorized notes about this variation

</td></tr>
<tr><td>

[additionalTags](./IBarTruffleRecipeVariationEntity.additionalTags.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Additional tags (merged with base confection tags)

</td></tr>
<tr><td>

[additionalUrls](./IBarTruffleRecipeVariationEntity.additionalUrls.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedUrl](../../../interfaces/ICategorizedUrl.md)[]

</td><td>

Additional URLs (merged with base confection URLs)

</td></tr>
</tbody></table>
