[Home](../../README.md) > [Entities](../README.md) > IResolvedFillingSlotEntity

# Interface: IResolvedFillingSlotEntity

Resolved slot with recipe filling.

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

[slotType](./IResolvedFillingSlotEntity.slotType.md)

</td><td>

`readonly`

</td><td>

"recipe"

</td><td>

Slot type discriminator

</td></tr>
<tr><td>

[slotId](./IResolvedFillingSlotEntity.slotId.md)

</td><td>

`readonly`

</td><td>

[SlotId](../../type-aliases/SlotId.md)

</td><td>

Slot identifier

</td></tr>
<tr><td>

[fillingId](./IResolvedFillingSlotEntity.fillingId.md)

</td><td>

`readonly`

</td><td>

[FillingId](../../type-aliases/FillingId.md)

</td><td>

Resolved filling recipe ID

</td></tr>
<tr><td>

[produced](./IResolvedFillingSlotEntity.produced.md)

</td><td>

`readonly`

</td><td>

[IProducedFillingEntity](../../interfaces/IProducedFillingEntity.md)

</td><td>

Full produced filling snapshot (populated in journal entries)

</td></tr>
</tbody></table>
