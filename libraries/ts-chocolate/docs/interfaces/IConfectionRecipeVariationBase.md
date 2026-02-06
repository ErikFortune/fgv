[Home](../README.md) > IConfectionRecipeVariationBase

# Interface: IConfectionRecipeVariationBase

A resolved runtime view of a confection variation with resolved references.

This interface provides runtime-layer access to variation data with:
- Parent confection reference (ID and resolved object)
- Resolved filling slots and procedures
- Effective tags/urls (merged from base confection + variation)
- Access to underlying recipe variation entity data

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

[variationSpec](./IConfectionRecipeVariationBase.variationSpec.md)

</td><td>

`readonly`

</td><td>

[ConfectionRecipeVariationSpec](../type-aliases/ConfectionRecipeVariationSpec.md)

</td><td>

Variation specifier for this variation.

</td></tr>
<tr><td>

[createdDate](./IConfectionRecipeVariationBase.createdDate.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Date this variation was created (ISO 8601 format).

</td></tr>
<tr><td>

[confectionId](./IConfectionRecipeVariationBase.confectionId.md)

</td><td>

`readonly`

</td><td>

[ConfectionId](../type-aliases/ConfectionId.md)

</td><td>

The parent confection ID.

</td></tr>
<tr><td>

[confection](./IConfectionRecipeVariationBase.confection.md)

</td><td>

`readonly`

</td><td>

TConfection

</td><td>

The parent confection - resolved.

</td></tr>
<tr><td>

[yield](./IConfectionRecipeVariationBase.yield.md)

</td><td>

`readonly`

</td><td>

[IConfectionYield](IConfectionYield.md)

</td><td>

Yield specification for this variation.

</td></tr>
<tr><td>

[decorations](./IConfectionRecipeVariationBase.decorations.md)

</td><td>

`readonly`

</td><td>

readonly [IConfectionDecoration](IConfectionDecoration.md)[]

</td><td>

Optional decorations for this variation.

</td></tr>
<tr><td>

[notes](./IConfectionRecipeVariationBase.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](ICategorizedNote.md)[]

</td><td>

Optional notes about this variation.

</td></tr>
<tr><td>

[fillings](./IConfectionRecipeVariationBase.fillings.md)

</td><td>

`readonly`

</td><td>

readonly [IResolvedFillingSlot](IResolvedFillingSlot.md)[]

</td><td>

Resolved filling slots for this variation.

</td></tr>
<tr><td>

[procedures](./IConfectionRecipeVariationBase.procedures.md)

</td><td>

`readonly`

</td><td>

[IOptionsWithPreferred](IOptionsWithPreferred.md)&lt;[IResolvedConfectionProcedure](IResolvedConfectionProcedure.md), [ProcedureId](../type-aliases/ProcedureId.md)&gt;

</td><td>

Resolved procedures for this variation.

</td></tr>
<tr><td>

[effectiveTags](./IConfectionRecipeVariationBase.effectiveTags.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Effective tags for this variation (base confection tags + variation's additional tags).

</td></tr>
<tr><td>

[effectiveUrls](./IConfectionRecipeVariationBase.effectiveUrls.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedUrl](ICategorizedUrl.md)[]

</td><td>

Effective URLs for this variation (base confection URLs + variation's additional URLs).

</td></tr>
<tr><td>

[entity](./IConfectionRecipeVariationBase.entity.md)

</td><td>

`readonly`

</td><td>

TEntity

</td><td>

Gets the underlying recipe variation entity data.

</td></tr>
</tbody></table>

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[isMoldedBonBonVariation()](./IConfectionRecipeVariationBase.isMoldedBonBonVariation.md)

</td><td>



</td><td>

Returns true if this is a molded bonbon variation.

</td></tr>
<tr><td>

[isBarTruffleVariation()](./IConfectionRecipeVariationBase.isBarTruffleVariation.md)

</td><td>



</td><td>

Returns true if this is a bar truffle variation.

</td></tr>
<tr><td>

[isRolledTruffleVariation()](./IConfectionRecipeVariationBase.isRolledTruffleVariation.md)

</td><td>



</td><td>

Returns true if this is a rolled truffle variation.

</td></tr>
</tbody></table>
