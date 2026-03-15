[Home](../README.md) > IRolledTruffleRecipeVariationEntity

# Interface: IRolledTruffleRecipeVariationEntity

Variation interface for rolled truffle confections.
Includes enrobing and coating specifications.

**Extends:** [`IConfectionRecipeVariationEntityBase`](IConfectionRecipeVariationEntityBase.md)

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

[yield](./IRolledTruffleRecipeVariationEntity.yield.md)

</td><td>

`readonly`

</td><td>

[IYieldInPieces](IYieldInPieces.md)

</td><td>

Template yield: count and weight per piece

</td></tr>
<tr><td>

[enrobingChocolate](./IRolledTruffleRecipeVariationEntity.enrobingChocolate.md)

</td><td>

`readonly`

</td><td>

[IChocolateSpec](../type-aliases/IChocolateSpec.md)

</td><td>

Optional enrobing chocolate specification

</td></tr>
<tr><td>

[coatings](./IRolledTruffleRecipeVariationEntity.coatings.md)

</td><td>

`readonly`

</td><td>

[ICoatingsEntity](../type-aliases/ICoatingsEntity.md)

</td><td>

Optional coatings (cocoa powder, nuts, etc.)

</td></tr>
<tr><td>

[variationSpec](./IConfectionRecipeVariationEntityBase.variationSpec.md)

</td><td>

`readonly`

</td><td>

[ConfectionRecipeVariationSpec](../type-aliases/ConfectionRecipeVariationSpec.md)

</td><td>

Unique identifier for this variation

</td></tr>
<tr><td>

[name](./IConfectionRecipeVariationEntityBase.name.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional human-readable name for this variation

</td></tr>
<tr><td>

[createdDate](./IConfectionRecipeVariationEntityBase.createdDate.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Date this variation was created (ISO 8601 format)

</td></tr>
<tr><td>

[fillings](./IConfectionRecipeVariationEntityBase.fillings.md)

</td><td>

`readonly`

</td><td>

readonly [IFillingSlotEntity](IFillingSlotEntity.md)[]

</td><td>

Optional filling slots - each slot has independent options with a preferred selection

</td></tr>
<tr><td>

[decorations](./IConfectionRecipeVariationEntityBase.decorations.md)

</td><td>

`readonly`

</td><td>

[IOptionsWithPreferred](IOptionsWithPreferred.md)&lt;[IDecorationRefEntity](IDecorationRefEntity.md), [DecorationId](../type-aliases/DecorationId.md)&gt;

</td><td>

Optional decoration references with preferred selection

</td></tr>
<tr><td>

[procedures](./IConfectionRecipeVariationEntityBase.procedures.md)

</td><td>

`readonly`

</td><td>

[IOptionsWithPreferred](IOptionsWithPreferred.md)&lt;[IProcedureRefEntity](../type-aliases/IProcedureRefEntity.md), [ProcedureId](../type-aliases/ProcedureId.md)&gt;

</td><td>

Optional procedures with preferred selection

</td></tr>
<tr><td>

[notes](./IConfectionRecipeVariationEntityBase.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](ICategorizedNote.md)[]

</td><td>

Optional categorized notes about this variation

</td></tr>
<tr><td>

[additionalTags](./IConfectionRecipeVariationEntityBase.additionalTags.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Additional tags (merged with base confection tags)

</td></tr>
<tr><td>

[additionalUrls](./IConfectionRecipeVariationEntityBase.additionalUrls.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedUrl](ICategorizedUrl.md)[]

</td><td>

Additional URLs (merged with base confection URLs)

</td></tr>
</tbody></table>
