[Home](../../README.md) > [LibraryRuntime](../README.md) > IBarTruffleRecipeVariation

# Interface: IBarTruffleRecipeVariation

Runtime confection variation narrowed to bar truffle type.

**Extends:** [`IConfectionRecipeVariationBase<IBarTruffleRecipe, IBarTruffleRecipeVariationEntity>`](../../interfaces/IConfectionRecipeVariationBase.md)

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

[yield](./IBarTruffleRecipeVariation.yield.md)

</td><td>

`readonly`

</td><td>

[IBarTruffleYield](../../interfaces/IBarTruffleYield.md)

</td><td>

Narrowed yield: numPieces, weightPerPiece, and piece dimensions stored as template defaults

</td></tr>
<tr><td>

[frameDimensions](./IBarTruffleRecipeVariation.frameDimensions.md)

</td><td>

`readonly`

</td><td>

[IPieceDimensions](../../interfaces/IPieceDimensions.md)

</td><td>

Derived frame dimensions for ganache slab (computed from yield.numPieces + yield.dimensions)

</td></tr>
<tr><td>

[enrobingChocolate](./IBarTruffleRecipeVariation.enrobingChocolate.md)

</td><td>

`readonly`

</td><td>

[IResolvedChocolateSpec](../../interfaces/IResolvedChocolateSpec.md)

</td><td>

Resolved enrobing chocolate specification (optional)

</td></tr>
<tr><td>

[preferredProcedure](./IBarTruffleRecipeVariation.preferredProcedure.md)

</td><td>

`readonly`

</td><td>

[IResolvedConfectionProcedure](../../interfaces/IResolvedConfectionProcedure.md) | undefined

</td><td>

Gets the preferred procedure, falling back to first available

</td></tr>
<tr><td>

[variationSpec](./IConfectionRecipeVariationBase.variationSpec.md)

</td><td>

`readonly`

</td><td>

[ConfectionRecipeVariationSpec](../../type-aliases/ConfectionRecipeVariationSpec.md)

</td><td>

Variation specifier for this variation.

</td></tr>
<tr><td>

[name](./IConfectionRecipeVariationBase.name.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional human-readable name for this variation.

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

[ConfectionId](../../type-aliases/ConfectionId.md)

</td><td>

The parent confection ID.

</td></tr>
<tr><td>

[confection](./IConfectionRecipeVariationBase.confection.md)

</td><td>

`readonly`

</td><td>

[IBarTruffleRecipe](../../interfaces/IBarTruffleRecipe.md)

</td><td>

The parent confection - resolved.

</td></tr>
<tr><td>

[decorations](./IConfectionRecipeVariationBase.decorations.md)

</td><td>

`readonly`

</td><td>

[IOptionsWithPreferred](../../interfaces/IOptionsWithPreferred.md)&lt;[IResolvedConfectionDecorationRef](../../interfaces/IResolvedConfectionDecorationRef.md), [DecorationId](../../type-aliases/DecorationId.md)&gt;

</td><td>

Resolved decorations for this variation.

</td></tr>
<tr><td>

[notes](./IConfectionRecipeVariationBase.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](../../interfaces/ICategorizedNote.md)[]

</td><td>

Optional notes about this variation.

</td></tr>
<tr><td>

[fillings](./IConfectionRecipeVariationBase.fillings.md)

</td><td>

`readonly`

</td><td>

readonly [IResolvedFillingSlot](../../interfaces/IResolvedFillingSlot.md)[]

</td><td>

Resolved filling slots for this variation.

</td></tr>
<tr><td>

[procedures](./IConfectionRecipeVariationBase.procedures.md)

</td><td>

`readonly`

</td><td>

[IOptionsWithPreferred](../../interfaces/IOptionsWithPreferred.md)&lt;[IResolvedConfectionProcedure](../../interfaces/IResolvedConfectionProcedure.md), [ProcedureId](../../type-aliases/ProcedureId.md)&gt;

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

readonly [ICategorizedUrl](../../interfaces/ICategorizedUrl.md)[]

</td><td>

Effective URLs for this variation (base confection URLs + variation's additional URLs).

</td></tr>
<tr><td>

[entity](./IConfectionRecipeVariationBase.entity.md)

</td><td>

`readonly`

</td><td>

[IBarTruffleRecipeVariationEntity](../../interfaces/IBarTruffleRecipeVariationEntity.md)

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
