[Home](../README.md) > IProducedConfectionEntityBase

# Interface: IProducedConfectionEntityBase

Base interface for all produced confection types.
Contains common fields shared by all confection productions.
Note: yield is NOT on the base — each concrete subtype declares its own yield type.

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

[ConfectionType](../type-aliases/ConfectionType.md)

</td><td>

Confection type discriminator (matches ConfectionType)

</td></tr>
<tr><td>

[variationId](./IProducedConfectionEntityBase.variationId.md)

</td><td>

`readonly`

</td><td>

[ConfectionRecipeVariationId](../type-aliases/ConfectionRecipeVariationId.md)

</td><td>

Confection variation ID that was produced

</td></tr>
<tr><td>

[fillings](./IProducedConfectionEntityBase.fillings.md)

</td><td>

`readonly`

</td><td>

readonly [AnyResolvedFillingSlotEntity](../type-aliases/AnyResolvedFillingSlotEntity.md)[]

</td><td>

Resolved filling slots with concrete selections

</td></tr>
<tr><td>

[procedureId](./IProducedConfectionEntityBase.procedureId.md)

</td><td>

`readonly`

</td><td>

[ProcedureId](../type-aliases/ProcedureId.md)

</td><td>

Resolved procedure ID if one was used

</td></tr>
<tr><td>

[decorationId](./IProducedConfectionEntityBase.decorationId.md)

</td><td>

`readonly`

</td><td>

[DecorationId](../type-aliases/DecorationId.md)

</td><td>

Resolved decoration ID if one was selected

</td></tr>
<tr><td>

[notes](./IProducedConfectionEntityBase.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](ICategorizedNote.md)[]

</td><td>

Optional categorized notes about production

</td></tr>
</tbody></table>
