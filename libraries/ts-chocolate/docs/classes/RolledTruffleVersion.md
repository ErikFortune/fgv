[Home](../README.md) > RolledTruffleVersion

# Class: RolledTruffleVersion

A view of a rolled truffle recipe variation with all references resolved.

**Extends:** [`ConfectionVersionBase<IRolledTruffleRecipe, IRolledTruffleRecipeVariationEntity>`](ConfectionVersionBase.md)

**Implements:** [`IRolledTruffleRecipeVariation`](../interfaces/IRolledTruffleRecipeVariation.md)

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

[enrobingChocolate](./RolledTruffleVersion.enrobingChocolate.md)

</td><td>

`readonly`

</td><td>

[IResolvedChocolateSpec](../interfaces/IResolvedChocolateSpec.md) | undefined

</td><td>

Resolved enrobing chocolate specification (lazy-loaded).

</td></tr>
<tr><td>

[coatings](./RolledTruffleVersion.coatings.md)

</td><td>

`readonly`

</td><td>

[IResolvedCoatings](../interfaces/IResolvedCoatings.md) | undefined

</td><td>

Resolved coatings specification (lazy-loaded).

</td></tr>
<tr><td>

[preferredProcedure](./RolledTruffleVersion.preferredProcedure.md)

</td><td>

`readonly`

</td><td>

[IResolvedConfectionProcedure](../interfaces/IResolvedConfectionProcedure.md) | undefined

</td><td>

Gets the preferred procedure, falling back to first available.

</td></tr>
<tr><td>

[entity](./RolledTruffleVersion.entity.md)

</td><td>

`readonly`

</td><td>

[IRolledTruffleRecipeVariationEntity](../interfaces/IRolledTruffleRecipeVariationEntity.md)

</td><td>

Gets the underlying rolled truffle variation entity data.

</td></tr>
<tr><td>

[variationSpec](./ConfectionVersionBase.variationSpec.md)

</td><td>

`readonly`

</td><td>

[ConfectionRecipeVariationSpec](../type-aliases/ConfectionRecipeVariationSpec.md)

</td><td>

Variation specifier for this variation.

</td></tr>
<tr><td>

[createdDate](./ConfectionVersionBase.createdDate.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Date this variation was created (ISO 8601 format).

</td></tr>
<tr><td>

[confectionId](./ConfectionVersionBase.confectionId.md)

</td><td>

`readonly`

</td><td>

[ConfectionId](../type-aliases/ConfectionId.md)

</td><td>

The parent confection ID.

</td></tr>
<tr><td>

[confection](./ConfectionVersionBase.confection.md)

</td><td>

`readonly`

</td><td>

TConfection

</td><td>

The parent confection - resolved.

</td></tr>
<tr><td>

[context](./ConfectionVersionBase.context.md)

</td><td>

`readonly`

</td><td>

IConfectionContext

</td><td>

The runtime context for navigation and resource resolution.

</td></tr>
<tr><td>

[yield](./ConfectionVersionBase.yield.md)

</td><td>

`readonly`

</td><td>

[IConfectionYield](../interfaces/IConfectionYield.md)

</td><td>

Yield specification for this variation.

</td></tr>
<tr><td>

[decorations](./ConfectionVersionBase.decorations.md)

</td><td>

`readonly`

</td><td>

readonly [IConfectionDecoration](../interfaces/IConfectionDecoration.md)[] | undefined

</td><td>

Optional decorations for this variation.

</td></tr>
<tr><td>

[notes](./ConfectionVersionBase.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](../interfaces/ICategorizedNote.md)[] | undefined

</td><td>

Optional categorized notes about this variation.

</td></tr>
<tr><td>

[fillings](./ConfectionVersionBase.fillings.md)

</td><td>

`readonly`

</td><td>

readonly [IResolvedFillingSlot](../interfaces/IResolvedFillingSlot.md)[] | undefined

</td><td>

Resolved filling slots for this variation.

</td></tr>
<tr><td>

[procedures](./ConfectionVersionBase.procedures.md)

</td><td>

`readonly`

</td><td>

[IOptionsWithPreferred](../interfaces/IOptionsWithPreferred.md)&lt;[IResolvedConfectionProcedure](../interfaces/IResolvedConfectionProcedure.md), [ProcedureId](../type-aliases/ProcedureId.md)&gt; | undefined

</td><td>

Resolved procedures for this variation.

</td></tr>
<tr><td>

[effectiveTags](./ConfectionVersionBase.effectiveTags.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Effective tags for this variation (base confection tags + variation's additional tags).

</td></tr>
<tr><td>

[effectiveUrls](./ConfectionVersionBase.effectiveUrls.md)

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

[create(context, confectionId, variation)](./RolledTruffleVersion.create.md)

</td><td>

`static`

</td><td>

Factory method for creating a LibraryRuntime.Confections.RolledTruffleRecipeVariation.

</td></tr>
<tr><td>

[getEnrobingChocolate()](./RolledTruffleVersion.getEnrobingChocolate.md)

</td><td>



</td><td>

Gets resolved enrobing chocolate specification (lazy-loaded).

</td></tr>
<tr><td>

[getCoatings()](./RolledTruffleVersion.getCoatings.md)

</td><td>



</td><td>

Gets resolved coatings specification (lazy-loaded).

</td></tr>
<tr><td>

[getFillings()](./ConfectionVersionBase.getFillings.md)

</td><td>



</td><td>

Gets resolved filling slots for this variation.

</td></tr>
<tr><td>

[getProcedures()](./ConfectionVersionBase.getProcedures.md)

</td><td>



</td><td>

Gets resolved procedures for this variation.

</td></tr>
<tr><td>

[isMoldedBonBonVariation()](./ConfectionVersionBase.isMoldedBonBonVariation.md)

</td><td>



</td><td>

Returns true if this is a molded bonbon variation.

</td></tr>
<tr><td>

[isBarTruffleVariation()](./ConfectionVersionBase.isBarTruffleVariation.md)

</td><td>



</td><td>

Returns true if this is a bar truffle variation.

</td></tr>
<tr><td>

[isRolledTruffleVariation()](./ConfectionVersionBase.isRolledTruffleVariation.md)

</td><td>



</td><td>

Returns true if this is a rolled truffle variation.

</td></tr>
</tbody></table>
