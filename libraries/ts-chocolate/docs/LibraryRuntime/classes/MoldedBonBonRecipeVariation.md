[Home](../../README.md) > [LibraryRuntime](../README.md) > MoldedBonBonRecipeVariation

# Class: MoldedBonBonRecipeVariation

A resolved view of a molded bonbon variation with all references resolved.

**Extends:** [`ConfectionRecipeVariationBase<IMoldedBonBonRecipe, IMoldedBonBonRecipeVariationEntity>`](../../classes/ConfectionRecipeVariationBase.md)

**Implements:** [`IMoldedBonBonRecipeVariation`](../../interfaces/IMoldedBonBonRecipeVariation.md)

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

[molds](./MoldedBonBonRecipeVariation.molds.md)

</td><td>

`readonly`

</td><td>

[IOptionsWithPreferred](../../interfaces/IOptionsWithPreferred.md)&lt;[IResolvedConfectionMoldRef](../../interfaces/IResolvedConfectionMoldRef.md), [MoldId](../../type-aliases/MoldId.md)&gt;

</td><td>

Resolved molds with preferred selection (lazy-loaded).

</td></tr>
<tr><td>

[shellChocolate](./MoldedBonBonRecipeVariation.shellChocolate.md)

</td><td>

`readonly`

</td><td>

[IResolvedChocolateSpec](../../interfaces/IResolvedChocolateSpec.md)

</td><td>

Resolved shell chocolate specification (lazy-loaded).

</td></tr>
<tr><td>

[additionalChocolates](./MoldedBonBonRecipeVariation.additionalChocolates.md)

</td><td>

`readonly`

</td><td>

readonly [IResolvedAdditionalChocolate](../../interfaces/IResolvedAdditionalChocolate.md)[] | undefined

</td><td>

Resolved additional chocolates (lazy-loaded).

</td></tr>
<tr><td>

[preferredMold](./MoldedBonBonRecipeVariation.preferredMold.md)

</td><td>

`readonly`

</td><td>

[IResolvedConfectionMoldRef](../../interfaces/IResolvedConfectionMoldRef.md) | undefined

</td><td>

Gets the preferred mold, falling back to first available.

</td></tr>
<tr><td>

[preferredProcedure](./MoldedBonBonRecipeVariation.preferredProcedure.md)

</td><td>

`readonly`

</td><td>

[IResolvedConfectionProcedure](../../interfaces/IResolvedConfectionProcedure.md) | undefined

</td><td>

Gets the preferred procedure, falling back to first available.

</td></tr>
<tr><td>

[entity](./MoldedBonBonRecipeVariation.entity.md)

</td><td>

`readonly`

</td><td>

[IMoldedBonBonRecipeVariationEntity](../../interfaces/IMoldedBonBonRecipeVariationEntity.md)

</td><td>

Gets the underlying molded bonbon variation entity data.

</td></tr>
<tr><td>

[variationSpec](./ConfectionRecipeVariationBase.variationSpec.md)

</td><td>

`readonly`

</td><td>

[ConfectionRecipeVariationSpec](../../type-aliases/ConfectionRecipeVariationSpec.md)

</td><td>

Variation specifier for this variation.

</td></tr>
<tr><td>

[name](./ConfectionRecipeVariationBase.name.md)

</td><td>

`readonly`

</td><td>

string | undefined

</td><td>

Optional human-readable name for this variation.

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

[ConfectionId](../../type-aliases/ConfectionId.md)

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

[yield](./ConfectionRecipeVariationBase.yield.md)

</td><td>

`readonly`

</td><td>

[IConfectionYield](../../interfaces/IConfectionYield.md)

</td><td>

Yield specification for this variation.

</td></tr>
<tr><td>

[decorations](./ConfectionRecipeVariationBase.decorations.md)

</td><td>

`readonly`

</td><td>

[IOptionsWithPreferred](../../interfaces/IOptionsWithPreferred.md)&lt;[IResolvedConfectionDecorationRef](../../interfaces/IResolvedConfectionDecorationRef.md), [DecorationId](../../type-aliases/DecorationId.md)&gt; | undefined

</td><td>

Resolved decorations for this variation.

</td></tr>
<tr><td>

[notes](./ConfectionRecipeVariationBase.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](../../interfaces/ICategorizedNote.md)[] | undefined

</td><td>

Optional categorized notes about this variation.

</td></tr>
<tr><td>

[fillings](./ConfectionRecipeVariationBase.fillings.md)

</td><td>

`readonly`

</td><td>

readonly [IResolvedFillingSlot](../../interfaces/IResolvedFillingSlot.md)[] | undefined

</td><td>

Resolved filling slots for this variation.

</td></tr>
<tr><td>

[procedures](./ConfectionRecipeVariationBase.procedures.md)

</td><td>

`readonly`

</td><td>

[IOptionsWithPreferred](../../interfaces/IOptionsWithPreferred.md)&lt;[IResolvedConfectionProcedure](../../interfaces/IResolvedConfectionProcedure.md), [ProcedureId](../../type-aliases/ProcedureId.md)&gt; | undefined

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

readonly [ICategorizedUrl](../../interfaces/ICategorizedUrl.md)[]

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

[create(context, confectionId, variation)](./MoldedBonBonRecipeVariation.create.md)

</td><td>

`static`

</td><td>

Factory method for creating a MoldedBonBonRecipeVariation.

</td></tr>
<tr><td>

[getMolds()](./MoldedBonBonRecipeVariation.getMolds.md)

</td><td>



</td><td>

Gets resolved molds with preferred selection (lazy-loaded).

</td></tr>
<tr><td>

[getShellChocolate()](./MoldedBonBonRecipeVariation.getShellChocolate.md)

</td><td>



</td><td>

Gets resolved shell chocolate specification (lazy-loaded).

</td></tr>
<tr><td>

[getAdditionalChocolates()](./MoldedBonBonRecipeVariation.getAdditionalChocolates.md)

</td><td>



</td><td>

Gets resolved additional chocolates (lazy-loaded).

</td></tr>
<tr><td>

[getDecorations()](./ConfectionRecipeVariationBase.getDecorations.md)

</td><td>



</td><td>

Gets resolved decorations for this variation.

</td></tr>
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
