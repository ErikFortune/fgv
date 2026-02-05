[Home](../../README.md) > [Entities](../README.md) > IBarTruffleVersionEntity

# Interface: IBarTruffleVersionEntity

Version interface for bar truffle confections.
Includes frame and cutting dimensions.

**Extends:** [`IConfectionVersionEntityBase`](../../interfaces/IConfectionVersionEntityBase.md)

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

[frameDimensions](./IBarTruffleVersionEntity.frameDimensions.md)

</td><td>

`readonly`

</td><td>

[IFrameDimensions](../../interfaces/IFrameDimensions.md)

</td><td>

Frame dimensions for ganache slab

</td></tr>
<tr><td>

[singleBonBonDimensions](./IBarTruffleVersionEntity.singleBonBonDimensions.md)

</td><td>

`readonly`

</td><td>

[IBonBonDimensions](../../interfaces/IBonBonDimensions.md)

</td><td>

Single bonbon dimensions for cutting

</td></tr>
<tr><td>

[enrobingChocolate](./IBarTruffleVersionEntity.enrobingChocolate.md)

</td><td>

`readonly`

</td><td>

[IChocolateSpec](../../type-aliases/IChocolateSpec.md)

</td><td>

Optional enrobing chocolate specification

</td></tr>
<tr><td>

[versionSpec](./IConfectionVersionEntityBase.versionSpec.md)

</td><td>

`readonly`

</td><td>

[ConfectionRecipeVariationSpec](../../type-aliases/ConfectionRecipeVariationSpec.md)

</td><td>

Unique identifier for this version

</td></tr>
<tr><td>

[createdDate](./IConfectionVersionEntityBase.createdDate.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Date this version was created (ISO 8601 format)

</td></tr>
<tr><td>

[yield](./IConfectionVersionEntityBase.yield.md)

</td><td>

`readonly`

</td><td>

[IConfectionYield](../../interfaces/IConfectionYield.md)

</td><td>

Yield specification for this version

</td></tr>
<tr><td>

[fillings](./IConfectionVersionEntityBase.fillings.md)

</td><td>

`readonly`

</td><td>

readonly [IFillingSlotEntity](../../interfaces/IFillingSlotEntity.md)[]

</td><td>

Optional filling slots - each slot has independent options with a preferred selection

</td></tr>
<tr><td>

[decorations](./IConfectionVersionEntityBase.decorations.md)

</td><td>

`readonly`

</td><td>

readonly [IConfectionDecoration](../../interfaces/IConfectionDecoration.md)[]

</td><td>

Optional decorations for this version

</td></tr>
<tr><td>

[procedures](./IConfectionVersionEntityBase.procedures.md)

</td><td>

`readonly`

</td><td>

[IOptionsWithPreferred](../../interfaces/IOptionsWithPreferred.md)&lt;[IProcedureRefEntity](../../type-aliases/IProcedureRefEntity.md), [ProcedureId](../../type-aliases/ProcedureId.md)&gt;

</td><td>

Optional procedures with preferred selection

</td></tr>
<tr><td>

[notes](./IConfectionVersionEntityBase.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](../../interfaces/ICategorizedNote.md)[]

</td><td>

Optional categorized notes about this version

</td></tr>
<tr><td>

[additionalTags](./IConfectionVersionEntityBase.additionalTags.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Additional tags (merged with base confection tags)

</td></tr>
<tr><td>

[additionalUrls](./IConfectionVersionEntityBase.additionalUrls.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedUrl](../../interfaces/ICategorizedUrl.md)[]

</td><td>

Additional URLs (merged with base confection URLs)

</td></tr>
</tbody></table>
