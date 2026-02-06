[Home](../README.md) > ConfectionRecipeVariationBase

# Class: ConfectionRecipeVariationBase

Abstract base class for runtime confection variations.
Provides common properties and resolution logic shared by all confection variation types.

**Implements:** [`IConfectionRecipeVariationBase<TConfection>`](../interfaces/IConfectionRecipeVariationBase.md)

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

[variationSpec](./ConfectionRecipeVariationBase.variationSpec.md)

</td><td>

`readonly`

</td><td>

[ConfectionRecipeVariationSpec](../type-aliases/ConfectionRecipeVariationSpec.md)

</td><td>

Variation specifier for this variation.

</td></tr>
<tr><td>

[createdDate](./ConfectionRecipeVariationBase.createdDate.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Date this variation was created (ISO 8601 format).

</td></tr>
<tr><td>

[confectionId](./ConfectionRecipeVariationBase.confectionId.md)

</td><td>

`readonly`

</td><td>

[ConfectionId](../type-aliases/ConfectionId.md)

</td><td>

The parent confection ID.

</td></tr>
<tr><td>

[confection](./ConfectionRecipeVariationBase.confection.md)

</td><td>

`readonly`

</td><td>

TConfection

</td><td>

The parent confection - resolved.

</td></tr>
<tr><td>

[context](./ConfectionRecipeVariationBase.context.md)

</td><td>

`readonly`

</td><td>

IConfectionContext

</td><td>

The runtime context for navigation and resource resolution.

</td></tr>
<tr><td>

[entity](./ConfectionRecipeVariationBase.entity.md)

</td><td>

`readonly`

</td><td>

TEntity

</td><td>

The underlying confection variation entity.

</td></tr>
<tr><td>

[yield](./ConfectionRecipeVariationBase.yield.md)

</td><td>

`readonly`

</td><td>

[IConfectionYield](../interfaces/IConfectionYield.md)

</td><td>

Yield specification for this variation.

</td></tr>
<tr><td>

[decorations](./ConfectionRecipeVariationBase.decorations.md)

</td><td>

`readonly`

</td><td>

readonly [IConfectionDecoration](../interfaces/IConfectionDecoration.md)[] | undefined

</td><td>

Optional decorations for this variation.

</td></tr>
<tr><td>

[notes](./ConfectionRecipeVariationBase.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](../interfaces/ICategorizedNote.md)[] | undefined

</td><td>

Optional categorized notes about this variation.

</td></tr>
<tr><td>

[fillings](./ConfectionRecipeVariationBase.fillings.md)

</td><td>

`readonly`

</td><td>

readonly [IResolvedFillingSlot](../interfaces/IResolvedFillingSlot.md)[] | undefined

</td><td>

Resolved filling slots for this variation.

</td></tr>
<tr><td>

[procedures](./ConfectionRecipeVariationBase.procedures.md)

</td><td>

`readonly`

</td><td>

[IOptionsWithPreferred](../interfaces/IOptionsWithPreferred.md)&lt;[IResolvedConfectionProcedure](../interfaces/IResolvedConfectionProcedure.md), [ProcedureId](../type-aliases/ProcedureId.md)&gt; | undefined

</td><td>

Resolved procedures for this variation.

</td></tr>
<tr><td>

[effectiveTags](./ConfectionRecipeVariationBase.effectiveTags.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Effective tags for this variation (base confection tags + variation's additional tags).

</td></tr>
<tr><td>

[effectiveUrls](./ConfectionRecipeVariationBase.effectiveUrls.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedUrl](../interfaces/ICategorizedUrl.md)[]

</td><td>

Effective URLs for this variation (base confection URLs + variation's additional URLs).

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

[getFillings()](./ConfectionRecipeVariationBase.getFillings.md)

</td><td>



</td><td>

Gets resolved filling slots for this variation.

</td></tr>
<tr><td>

[getProcedures()](./ConfectionRecipeVariationBase.getProcedures.md)

</td><td>



</td><td>

Gets resolved procedures for this variation.

</td></tr>
<tr><td>

[isMoldedBonBonVariation()](./ConfectionRecipeVariationBase.isMoldedBonBonVariation.md)

</td><td>



</td><td>

Returns true if this is a molded bonbon variation.

</td></tr>
<tr><td>

[isBarTruffleVariation()](./ConfectionRecipeVariationBase.isBarTruffleVariation.md)

</td><td>



</td><td>

Returns true if this is a bar truffle variation.

</td></tr>
<tr><td>

[isRolledTruffleVariation()](./ConfectionRecipeVariationBase.isRolledTruffleVariation.md)

</td><td>



</td><td>

Returns true if this is a rolled truffle variation.

</td></tr>
</tbody></table>
