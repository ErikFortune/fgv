[Home](../../README.md) > [LibraryRuntime](../README.md) > IResolvedFillingSlot

# Interface: IResolvedFillingSlot

A resolved filling slot with resolved recipe/ingredient references.

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

[slotId](./IResolvedFillingSlot.slotId.md)

</td><td>

`readonly`

</td><td>

[SlotId](../../type-aliases/SlotId.md)

</td><td>

Unique identifier for this slot within the confection

</td></tr>
<tr><td>

[name](./IResolvedFillingSlot.name.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Human-readable name for display

</td></tr>
<tr><td>

[filling](./IResolvedFillingSlot.filling.md)

</td><td>

`readonly`

</td><td>

[IOptionsWithPreferred](../../interfaces/IOptionsWithPreferred.md)&lt;[IResolvedFillingOption](../../type-aliases/IResolvedFillingOption.md), [FillingOptionId](../../type-aliases/FillingOptionId.md)&gt;

</td><td>

Resolved filling options with preferred selection

</td></tr>
</tbody></table>
