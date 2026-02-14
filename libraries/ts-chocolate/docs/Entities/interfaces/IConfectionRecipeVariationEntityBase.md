[Home](../../README.md) > [Entities](../README.md) > IConfectionRecipeVariationEntityBase

# Interface: IConfectionRecipeVariationEntityBase

Base variation interface - shared by all confection variation types.
Contains the configuration details that can change between variations.

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

[variationSpec](./IConfectionRecipeVariationEntityBase.variationSpec.md)

</td><td>

`readonly`

</td><td>

[ConfectionRecipeVariationSpec](../../type-aliases/ConfectionRecipeVariationSpec.md)

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

[yield](./IConfectionRecipeVariationEntityBase.yield.md)

</td><td>

`readonly`

</td><td>

[IConfectionYield](../../interfaces/IConfectionYield.md)

</td><td>

Yield specification for this variation

</td></tr>
<tr><td>

[fillings](./IConfectionRecipeVariationEntityBase.fillings.md)

</td><td>

`readonly`

</td><td>

readonly [IFillingSlotEntity](../../interfaces/IFillingSlotEntity.md)[]

</td><td>

Optional filling slots - each slot has independent options with a preferred selection

</td></tr>
<tr><td>

[decorations](./IConfectionRecipeVariationEntityBase.decorations.md)

</td><td>

`readonly`

</td><td>

[IOptionsWithPreferred](../../interfaces/IOptionsWithPreferred.md)&lt;[IDecorationRefEntity](../../interfaces/IDecorationRefEntity.md), [DecorationId](../../type-aliases/DecorationId.md)&gt;

</td><td>

Optional decoration references with preferred selection

</td></tr>
<tr><td>

[procedures](./IConfectionRecipeVariationEntityBase.procedures.md)

</td><td>

`readonly`

</td><td>

[IOptionsWithPreferred](../../interfaces/IOptionsWithPreferred.md)&lt;[IProcedureRefEntity](../../type-aliases/IProcedureRefEntity.md), [ProcedureId](../../type-aliases/ProcedureId.md)&gt;

</td><td>

Optional procedures with preferred selection

</td></tr>
<tr><td>

[notes](./IConfectionRecipeVariationEntityBase.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](../../interfaces/ICategorizedNote.md)[]

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

readonly [ICategorizedUrl](../../interfaces/ICategorizedUrl.md)[]

</td><td>

Additional URLs (merged with base confection URLs)

</td></tr>
</tbody></table>
