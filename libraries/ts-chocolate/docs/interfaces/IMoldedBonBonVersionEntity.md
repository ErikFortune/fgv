[Home](../README.md) > IMoldedBonBonVersionEntity

# Interface: IMoldedBonBonVersionEntity

Version interface for molded bonbon confections.
Includes mold and chocolate shell specifications.

**Extends:** [`IConfectionVersionEntityBase`](IConfectionVersionEntityBase.md)

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

[molds](./IMoldedBonBonVersionEntity.molds.md)

</td><td>

`readonly`

</td><td>

[IOptionsWithPreferred](IOptionsWithPreferred.md)&lt;[IConfectionMoldRef](../type-aliases/IConfectionMoldRef.md), [MoldId](../type-aliases/MoldId.md)&gt;

</td><td>

Required molds with preferred selection

</td></tr>
<tr><td>

[shellChocolate](./IMoldedBonBonVersionEntity.shellChocolate.md)

</td><td>

`readonly`

</td><td>

[IChocolateSpec](../type-aliases/IChocolateSpec.md)

</td><td>

Required shell chocolate specification

</td></tr>
<tr><td>

[additionalChocolates](./IMoldedBonBonVersionEntity.additionalChocolates.md)

</td><td>

`readonly`

</td><td>

readonly [IAdditionalChocolateEntity](IAdditionalChocolateEntity.md)[]

</td><td>

Optional additional chocolates (seal, decoration)

</td></tr>
<tr><td>

[versionSpec](./IConfectionVersionEntityBase.versionSpec.md)

</td><td>

`readonly`

</td><td>

[ConfectionVersionSpec](../type-aliases/ConfectionVersionSpec.md)

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

[IConfectionYield](IConfectionYield.md)

</td><td>

Yield specification for this version

</td></tr>
<tr><td>

[fillings](./IConfectionVersionEntityBase.fillings.md)

</td><td>

`readonly`

</td><td>

readonly [IFillingSlotEntity](IFillingSlotEntity.md)[]

</td><td>

Optional filling slots - each slot has independent options with a preferred selection

</td></tr>
<tr><td>

[decorations](./IConfectionVersionEntityBase.decorations.md)

</td><td>

`readonly`

</td><td>

readonly [IConfectionDecoration](IConfectionDecoration.md)[]

</td><td>

Optional decorations for this version

</td></tr>
<tr><td>

[procedures](./IConfectionVersionEntityBase.procedures.md)

</td><td>

`readonly`

</td><td>

[IOptionsWithPreferred](IOptionsWithPreferred.md)&lt;[IProcedureRefEntity](../type-aliases/IProcedureRefEntity.md), [ProcedureId](../type-aliases/ProcedureId.md)&gt;

</td><td>

Optional procedures with preferred selection

</td></tr>
<tr><td>

[notes](./IConfectionVersionEntityBase.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](ICategorizedNote.md)[]

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

readonly [ICategorizedUrl](ICategorizedUrl.md)[]

</td><td>

Additional URLs (merged with base confection URLs)

</td></tr>
</tbody></table>
