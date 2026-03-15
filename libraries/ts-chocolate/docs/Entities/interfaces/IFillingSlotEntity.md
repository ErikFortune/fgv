[Home](../../README.md) > [Entities](../README.md) > IFillingSlotEntity

# Interface: IFillingSlotEntity

A single filling slot with its own options and preferred selection.
Each slot can hold recipes OR ingredients (or both).

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

[slotId](./IFillingSlotEntity.slotId.md)

</td><td>

`readonly`

</td><td>

[SlotId](../../type-aliases/SlotId.md)

</td><td>

Unique identifier for this slot within the confection (e.g., "layer1", "center")

</td></tr>
<tr><td>

[name](./IFillingSlotEntity.name.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Human-readable name for display (e.g., "Inner Layer", "Ganache Center")

</td></tr>
<tr><td>

[filling](./IFillingSlotEntity.filling.md)

</td><td>

`readonly`

</td><td>

[IOptionsWithPreferred](../../interfaces/IOptionsWithPreferred.md)&lt;[AnyFillingOptionEntity](../../type-aliases/AnyFillingOptionEntity.md), [FillingOptionId](../../type-aliases/FillingOptionId.md)&gt;

</td><td>

Available filling options with preferred selection

</td></tr>
</tbody></table>
