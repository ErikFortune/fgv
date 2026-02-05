[Home](../../README.md) > [LibraryRuntime](../README.md) > IMoldedBonBonVersion

# Interface: IMoldedBonBonVersion

Runtime confection version narrowed to molded bonbon type.

**Extends:** [`IConfectionVersionBase<IMoldedBonBon, IMoldedBonBonVersionEntity>`](../../interfaces/IConfectionVersionBase.md)

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

[molds](./IMoldedBonBonVersion.molds.md)

</td><td>

`readonly`

</td><td>

[IOptionsWithPreferred](../../interfaces/IOptionsWithPreferred.md)&lt;[IResolvedConfectionMoldRef](../../interfaces/IResolvedConfectionMoldRef.md), [MoldId](../../type-aliases/MoldId.md)&gt;

</td><td>

Resolved molds with preferred selection

</td></tr>
<tr><td>

[shellChocolate](./IMoldedBonBonVersion.shellChocolate.md)

</td><td>

`readonly`

</td><td>

[IResolvedChocolateSpec](../../interfaces/IResolvedChocolateSpec.md)

</td><td>

Resolved shell chocolate specification

</td></tr>
<tr><td>

[additionalChocolates](./IMoldedBonBonVersion.additionalChocolates.md)

</td><td>

`readonly`

</td><td>

readonly [IResolvedAdditionalChocolate](../../interfaces/IResolvedAdditionalChocolate.md)[]

</td><td>

Resolved additional chocolates (optional)

</td></tr>
<tr><td>

[preferredMold](./IMoldedBonBonVersion.preferredMold.md)

</td><td>

`readonly`

</td><td>

[IResolvedConfectionMoldRef](../../interfaces/IResolvedConfectionMoldRef.md) | undefined

</td><td>

Gets the preferred mold, falling back to first available

</td></tr>
<tr><td>

[preferredProcedure](./IMoldedBonBonVersion.preferredProcedure.md)

</td><td>

`readonly`

</td><td>

[IResolvedConfectionProcedure](../../interfaces/IResolvedConfectionProcedure.md) | undefined

</td><td>

Gets the preferred procedure, falling back to first available

</td></tr>
<tr><td>

[versionSpec](./IConfectionVersionBase.versionSpec.md)

</td><td>

`readonly`

</td><td>

[ConfectionVersionSpec](../../type-aliases/ConfectionVersionSpec.md)

</td><td>

Version specifier for this version.

</td></tr>
<tr><td>

[createdDate](./IConfectionVersionBase.createdDate.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Date this version was created (ISO 8601 format).

</td></tr>
<tr><td>

[confectionId](./IConfectionVersionBase.confectionId.md)

</td><td>

`readonly`

</td><td>

[ConfectionId](../../type-aliases/ConfectionId.md)

</td><td>

The parent confection ID.

</td></tr>
<tr><td>

[confection](./IConfectionVersionBase.confection.md)

</td><td>

`readonly`

</td><td>

[IMoldedBonBon](../../interfaces/IMoldedBonBon.md)

</td><td>

The parent confection - resolved.

</td></tr>
<tr><td>

[yield](./IConfectionVersionBase.yield.md)

</td><td>

`readonly`

</td><td>

[IConfectionYield](../../interfaces/IConfectionYield.md)

</td><td>

Yield specification for this version.

</td></tr>
<tr><td>

[decorations](./IConfectionVersionBase.decorations.md)

</td><td>

`readonly`

</td><td>

readonly [IConfectionDecoration](../../interfaces/IConfectionDecoration.md)[]

</td><td>

Optional decorations for this version.

</td></tr>
<tr><td>

[notes](./IConfectionVersionBase.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](../../interfaces/ICategorizedNote.md)[]

</td><td>

Optional notes about this version.

</td></tr>
<tr><td>

[fillings](./IConfectionVersionBase.fillings.md)

</td><td>

`readonly`

</td><td>

readonly [IResolvedFillingSlot](../../interfaces/IResolvedFillingSlot.md)[]

</td><td>

Resolved filling slots for this version.

</td></tr>
<tr><td>

[procedures](./IConfectionVersionBase.procedures.md)

</td><td>

`readonly`

</td><td>

[IOptionsWithPreferred](../../interfaces/IOptionsWithPreferred.md)&lt;[IResolvedConfectionProcedure](../../interfaces/IResolvedConfectionProcedure.md), [ProcedureId](../../type-aliases/ProcedureId.md)&gt;

</td><td>

Resolved procedures for this version.

</td></tr>
<tr><td>

[effectiveTags](./IConfectionVersionBase.effectiveTags.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Effective tags for this version (base confection tags + version's additional tags).

</td></tr>
<tr><td>

[effectiveUrls](./IConfectionVersionBase.effectiveUrls.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedUrl](../../interfaces/ICategorizedUrl.md)[]

</td><td>

Effective URLs for this version (base confection URLs + version's additional URLs).

</td></tr>
<tr><td>

[entity](./IConfectionVersionBase.entity.md)

</td><td>

`readonly`

</td><td>

[IMoldedBonBonVersionEntity](../../interfaces/IMoldedBonBonVersionEntity.md)

</td><td>

Gets the underlying recipe version entity data.

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

[isMoldedBonBonVersion()](./IConfectionVersionBase.isMoldedBonBonVersion.md)

</td><td>



</td><td>

Returns true if this is a molded bonbon version.

</td></tr>
<tr><td>

[isBarTruffleVersion()](./IConfectionVersionBase.isBarTruffleVersion.md)

</td><td>



</td><td>

Returns true if this is a bar truffle version.

</td></tr>
<tr><td>

[isRolledTruffleVersion()](./IConfectionVersionBase.isRolledTruffleVersion.md)

</td><td>



</td><td>

Returns true if this is a rolled truffle version.

</td></tr>
</tbody></table>
