[Home](../../../README.md) > [Entities](../../README.md) > [Confections](../README.md) > IProducedConfectionEntityBase

# Interface: IProducedConfectionEntityBase

Base interface for all produced confection types.
Contains common fields shared by all confection productions.

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

[confectionType](./IProducedConfectionEntityBase.confectionType.md)

</td><td>

`readonly`

</td><td>

[ConfectionType](../../../type-aliases/ConfectionType.md)

</td><td>

Confection type discriminator (matches ConfectionType)

</td></tr>
<tr><td>

[versionId](./IProducedConfectionEntityBase.versionId.md)

</td><td>

`readonly`

</td><td>

[ConfectionRecipeVariationId](../../../type-aliases/ConfectionRecipeVariationId.md)

</td><td>

Confection version ID that was produced

</td></tr>
<tr><td>

[yield](./IProducedConfectionEntityBase.yield.md)

</td><td>

`readonly`

</td><td>

[IConfectionYield](../../../interfaces/IConfectionYield.md)

</td><td>

Yield specification for this production

</td></tr>
<tr><td>

[fillings](./IProducedConfectionEntityBase.fillings.md)

</td><td>

`readonly`

</td><td>

readonly [AnyResolvedFillingSlotEntity](../../../type-aliases/AnyResolvedFillingSlotEntity.md)[]

</td><td>

Resolved filling slots with concrete selections

</td></tr>
<tr><td>

[procedureId](./IProducedConfectionEntityBase.procedureId.md)

</td><td>

`readonly`

</td><td>

[ProcedureId](../../../type-aliases/ProcedureId.md)

</td><td>

Resolved procedure ID if one was used

</td></tr>
<tr><td>

[notes](./IProducedConfectionEntityBase.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](../../../interfaces/ICategorizedNote.md)[]

</td><td>

Optional categorized notes about production

</td></tr>
</tbody></table>
