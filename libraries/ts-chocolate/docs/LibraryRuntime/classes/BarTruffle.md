[Home](../../README.md) > [LibraryRuntime](../README.md) > BarTruffle

# Class: BarTruffle

A resolved view of a bar truffle confection with navigation capabilities.
Immutable - does not allow modification of underlying data.

**Extends:** [`ConfectionBase<IBarTruffleVersion, IBarTruffleEntity>`](../../classes/ConfectionBase.md)

**Implements:** [`IBarTruffle`](../../interfaces/IBarTruffle.md)

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

[confectionType](./BarTruffle.confectionType.md)

</td><td>

`readonly`

</td><td>

"bar-truffle"

</td><td>

Confection type is always 'bar-truffle' for this type

</td></tr>
<tr><td>

[frameDimensions](./BarTruffle.frameDimensions.md)

</td><td>

`readonly`

</td><td>

[IFrameDimensions](../../interfaces/IFrameDimensions.md)

</td><td>

Frame dimensions for ganache slab (from golden version).

</td></tr>
<tr><td>

[singleBonBonDimensions](./BarTruffle.singleBonBonDimensions.md)

</td><td>

`readonly`

</td><td>

[IBonBonDimensions](../../interfaces/IBonBonDimensions.md)

</td><td>

Single bonbon dimensions for cutting (from golden version).

</td></tr>
<tr><td>

[fillings](./BarTruffle.fillings.md)

</td><td>

`readonly`

</td><td>

readonly [IResolvedFillingSlot](../../interfaces/IResolvedFillingSlot.md)[] | undefined

</td><td>

Resolved filling slots from the golden version.

</td></tr>
<tr><td>

[procedures](./BarTruffle.procedures.md)

</td><td>

`readonly`

</td><td>

[IOptionsWithPreferred](../../interfaces/IOptionsWithPreferred.md)&lt;[IResolvedConfectionProcedure](../../interfaces/IResolvedConfectionProcedure.md), [ProcedureId](../../type-aliases/ProcedureId.md)&gt; | undefined

</td><td>

Resolved procedures from the golden version.

</td></tr>
<tr><td>

[enrobingChocolate](./BarTruffle.enrobingChocolate.md)

</td><td>

`readonly`

</td><td>

[IResolvedChocolateSpec](../../interfaces/IResolvedChocolateSpec.md) | undefined

</td><td>

Resolved enrobing chocolate specification (from golden version, optional).

</td></tr>
<tr><td>

[entity](./BarTruffle.entity.md)

</td><td>

`readonly`

</td><td>

[IBarTruffleEntity](../../interfaces/IBarTruffleEntity.md)

</td><td>

Gets the underlying raw bar truffle data

</td></tr>
<tr><td>

[id](./ConfectionBase.id.md)

</td><td>

`readonly`

</td><td>

[ConfectionId](../../type-aliases/ConfectionId.md)

</td><td>

The composite confection ID (e.g., "common.dark-dome-bonbon")

</td></tr>
<tr><td>

[collectionId](./ConfectionBase.collectionId.md)

</td><td>

`readonly`

</td><td>

[CollectionId](../../type-aliases/CollectionId.md)

</td><td>

The source ID part of the composite ID

</td></tr>
<tr><td>

[baseId](./ConfectionBase.baseId.md)

</td><td>

`readonly`

</td><td>

[BaseConfectionId](../../type-aliases/BaseConfectionId.md)

</td><td>

The base confection ID within the source

</td></tr>
<tr><td>

[name](./ConfectionBase.name.md)

</td><td>

`readonly`

</td><td>

[ConfectionName](../../type-aliases/ConfectionName.md)

</td><td>

Human-readable name

</td></tr>
<tr><td>

[description](./ConfectionBase.description.md)

</td><td>

`readonly`

</td><td>

string | undefined

</td><td>

Optional description

</td></tr>
<tr><td>

[tags](./ConfectionBase.tags.md)

</td><td>

`readonly`

</td><td>

readonly string[] | undefined

</td><td>

Base tags for searching/filtering (version may add more via additionalTags)

</td></tr>
<tr><td>

[urls](./ConfectionBase.urls.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedUrl](../../interfaces/ICategorizedUrl.md)[] | undefined

</td><td>

Base URLs (version may add more via additionalUrls)

</td></tr>
<tr><td>

[goldenVersionSpec](./ConfectionBase.goldenVersionSpec.md)

</td><td>

`readonly`

</td><td>

[ConfectionVersionSpec](../../type-aliases/ConfectionVersionSpec.md)

</td><td>

The ID of the golden (approved default) version

</td></tr>
<tr><td>

[decorations](./ConfectionBase.decorations.md)

</td><td>

`readonly`

</td><td>

readonly [IConfectionDecoration](../../interfaces/IConfectionDecoration.md)[] | undefined

</td><td>

Decorations from the golden version

</td></tr>
<tr><td>

[yield](./ConfectionBase.yield.md)

</td><td>

`readonly`

</td><td>

[IConfectionYield](../../interfaces/IConfectionYield.md)

</td><td>

Yield specification from the golden version

</td></tr>
<tr><td>

[goldenVersion](./ConfectionBase.goldenVersion.md)

</td><td>

`readonly`

</td><td>

TVersion

</td><td>

The golden (default) version - resolved.

</td></tr>
<tr><td>

[versions](./ConfectionBase.versions.md)

</td><td>

`readonly`

</td><td>

readonly TVersion[]

</td><td>

All versions - resolved.

</td></tr>
<tr><td>

[effectiveTags](./ConfectionBase.effectiveTags.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Gets effective tags for the golden version (base tags + version's additional tags).

</td></tr>
<tr><td>

[effectiveUrls](./ConfectionBase.effectiveUrls.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedUrl](../../interfaces/ICategorizedUrl.md)[]

</td><td>

Gets effective URLs for the golden version (base URLs + version's additional URLs).

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

[create(context, id, confection)](./BarTruffle.create.md)

</td><td>

`static`

</td><td>

Factory method for creating a BarTruffle.

</td></tr>
<tr><td>

[getGoldenVersion()](./ConfectionBase.getGoldenVersion.md)

</td><td>



</td><td>

Gets the golden (default) version - resolved.

</td></tr>
<tr><td>

[getVersions()](./ConfectionBase.getVersions.md)

</td><td>



</td><td>

Gets all versions - resolved.

</td></tr>
<tr><td>

[getVersion(versionSpec)](./ConfectionBase.getVersion.md)

</td><td>



</td><td>

Gets a specific version by version specifier.

</td></tr>
<tr><td>

[getEffectiveTags(version)](./ConfectionBase.getEffectiveTags.md)

</td><td>



</td><td>

Gets effective tags for a specific version (base tags + version's additional tags).

</td></tr>
<tr><td>

[getEffectiveUrls(version)](./ConfectionBase.getEffectiveUrls.md)

</td><td>



</td><td>

Gets effective URLs for a specific version (base URLs + version's additional URLs).

</td></tr>
<tr><td>

[isMoldedBonBon()](./ConfectionBase.isMoldedBonBon.md)

</td><td>



</td><td>

Returns true if this is a molded bonbon confection.

</td></tr>
<tr><td>

[isBarTruffle()](./ConfectionBase.isBarTruffle.md)

</td><td>



</td><td>

Returns true if this is a bar truffle confection.

</td></tr>
<tr><td>

[isRolledTruffle()](./ConfectionBase.isRolledTruffle.md)

</td><td>



</td><td>

Returns true if this is a rolled truffle confection.

</td></tr>
</tbody></table>
