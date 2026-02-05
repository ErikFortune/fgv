[Home](../../README.md) > [LibraryRuntime](../README.md) > MoldedBonBonVersion

# Class: MoldedBonBonVersion

A resolved view of a molded bonbon version with all references resolved.

**Extends:** [`ConfectionVersionBase<IMoldedBonBon, IMoldedBonBonVersionEntity>`](../../classes/ConfectionVersionBase.md)

**Implements:** [`IMoldedBonBonVersion`](../../interfaces/IMoldedBonBonVersion.md)

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

[molds](./MoldedBonBonVersion.molds.md)

</td><td>

`readonly`

</td><td>

[IOptionsWithPreferred](../../interfaces/IOptionsWithPreferred.md)&lt;[IResolvedConfectionMoldRef](../../interfaces/IResolvedConfectionMoldRef.md), [MoldId](../../type-aliases/MoldId.md)&gt;

</td><td>

Resolved molds with preferred selection (lazy-loaded).

</td></tr>
<tr><td>

[shellChocolate](./MoldedBonBonVersion.shellChocolate.md)

</td><td>

`readonly`

</td><td>

[IResolvedChocolateSpec](../../interfaces/IResolvedChocolateSpec.md)

</td><td>

Resolved shell chocolate specification (lazy-loaded).

</td></tr>
<tr><td>

[additionalChocolates](./MoldedBonBonVersion.additionalChocolates.md)

</td><td>

`readonly`

</td><td>

readonly [IResolvedAdditionalChocolate](../../interfaces/IResolvedAdditionalChocolate.md)[] | undefined

</td><td>

Resolved additional chocolates (lazy-loaded).

</td></tr>
<tr><td>

[preferredMold](./MoldedBonBonVersion.preferredMold.md)

</td><td>

`readonly`

</td><td>

[IResolvedConfectionMoldRef](../../interfaces/IResolvedConfectionMoldRef.md) | undefined

</td><td>

Gets the preferred mold, falling back to first available.

</td></tr>
<tr><td>

[preferredProcedure](./MoldedBonBonVersion.preferredProcedure.md)

</td><td>

`readonly`

</td><td>

[IResolvedConfectionProcedure](../../interfaces/IResolvedConfectionProcedure.md) | undefined

</td><td>

Gets the preferred procedure, falling back to first available.

</td></tr>
<tr><td>

[entity](./MoldedBonBonVersion.entity.md)

</td><td>

`readonly`

</td><td>

[IMoldedBonBonVersionEntity](../../interfaces/IMoldedBonBonVersionEntity.md)

</td><td>

Gets the underlying molded bonbon version entity data.

</td></tr>
<tr><td>

[versionSpec](./ConfectionVersionBase.versionSpec.md)

</td><td>

`readonly`

</td><td>

[ConfectionVersionSpec](../../type-aliases/ConfectionVersionSpec.md)

</td><td>

Version specifier for this version.

</td></tr>
<tr><td>

[createdDate](./ConfectionVersionBase.createdDate.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Date this version was created (ISO 8601 format).

</td></tr>
<tr><td>

[confectionId](./ConfectionVersionBase.confectionId.md)

</td><td>

`readonly`

</td><td>

[ConfectionId](../../type-aliases/ConfectionId.md)

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

[IConfectionYield](../../interfaces/IConfectionYield.md)

</td><td>

Yield specification for this version.

</td></tr>
<tr><td>

[decorations](./ConfectionVersionBase.decorations.md)

</td><td>

`readonly`

</td><td>

readonly [IConfectionDecoration](../../interfaces/IConfectionDecoration.md)[] | undefined

</td><td>

Optional decorations for this version.

</td></tr>
<tr><td>

[notes](./ConfectionVersionBase.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](../../interfaces/ICategorizedNote.md)[] | undefined

</td><td>

Optional categorized notes about this version.

</td></tr>
<tr><td>

[fillings](./ConfectionVersionBase.fillings.md)

</td><td>

`readonly`

</td><td>

readonly [IResolvedFillingSlot](../../interfaces/IResolvedFillingSlot.md)[] | undefined

</td><td>

Resolved filling slots for this version.

</td></tr>
<tr><td>

[procedures](./ConfectionVersionBase.procedures.md)

</td><td>

`readonly`

</td><td>

[IOptionsWithPreferred](../../interfaces/IOptionsWithPreferred.md)&lt;[IResolvedConfectionProcedure](../../interfaces/IResolvedConfectionProcedure.md), [ProcedureId](../../type-aliases/ProcedureId.md)&gt; | undefined

</td><td>

Resolved procedures for this version.

</td></tr>
<tr><td>

[effectiveTags](./ConfectionVersionBase.effectiveTags.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Effective tags for this version (base confection tags + version's additional tags).

</td></tr>
<tr><td>

[effectiveUrls](./ConfectionVersionBase.effectiveUrls.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedUrl](../../interfaces/ICategorizedUrl.md)[]

</td><td>

Effective URLs for this version (base confection URLs + version's additional URLs).

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

[create(context, confectionId, version)](./MoldedBonBonVersion.create.md)

</td><td>

`static`

</td><td>

Factory method for creating a MoldedBonBonVersion.

</td></tr>
<tr><td>

[getMolds()](./MoldedBonBonVersion.getMolds.md)

</td><td>



</td><td>

Gets resolved molds with preferred selection (lazy-loaded).

</td></tr>
<tr><td>

[getShellChocolate()](./MoldedBonBonVersion.getShellChocolate.md)

</td><td>



</td><td>

Gets resolved shell chocolate specification (lazy-loaded).

</td></tr>
<tr><td>

[getAdditionalChocolates()](./MoldedBonBonVersion.getAdditionalChocolates.md)

</td><td>



</td><td>

Gets resolved additional chocolates (lazy-loaded).

</td></tr>
<tr><td>

[getFillings()](./ConfectionVersionBase.getFillings.md)

</td><td>



</td><td>

Gets resolved filling slots for this version.

</td></tr>
<tr><td>

[getProcedures()](./ConfectionVersionBase.getProcedures.md)

</td><td>



</td><td>

Gets resolved procedures for this version.

</td></tr>
<tr><td>

[isMoldedBonBonVersion()](./ConfectionVersionBase.isMoldedBonBonVersion.md)

</td><td>



</td><td>

Returns true if this is a molded bonbon version.

</td></tr>
<tr><td>

[isBarTruffleVersion()](./ConfectionVersionBase.isBarTruffleVersion.md)

</td><td>



</td><td>

Returns true if this is a bar truffle version.

</td></tr>
<tr><td>

[isRolledTruffleVersion()](./ConfectionVersionBase.isRolledTruffleVersion.md)

</td><td>



</td><td>

Returns true if this is a rolled truffle version.

</td></tr>
</tbody></table>
