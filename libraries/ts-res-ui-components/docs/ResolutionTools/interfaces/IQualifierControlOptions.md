[Home](../../README.md) > [ResolutionTools](../README.md) > IQualifierControlOptions

# Interface: IQualifierControlOptions

Options for controlling individual qualifier context controls.

Provides fine-grained control over the behavior, appearance, and editability
of individual qualifier inputs. This allows hosts to customize which qualifiers
are editable, provide external values, and control the presentation.

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

[visible](./IQualifierControlOptions.visible.md)

</td><td>



</td><td>

boolean

</td><td>

Whether this qualifier should be visible at all

</td></tr>
<tr><td>

[editable](./IQualifierControlOptions.editable.md)

</td><td>



</td><td>

boolean

</td><td>

Whether this qualifier is editable by the user

</td></tr>
<tr><td>

[hostValue](./IQualifierControlOptions.hostValue.md)

</td><td>



</td><td>

string

</td><td>

External/host-managed value that overrides user input

</td></tr>
<tr><td>

[showHostValue](./IQualifierControlOptions.showHostValue.md)

</td><td>



</td><td>

boolean

</td><td>

Whether to show host-managed values in the display

</td></tr>
<tr><td>

[placeholder](./IQualifierControlOptions.placeholder.md)

</td><td>



</td><td>

string

</td><td>

Custom placeholder text for this qualifier

</td></tr>
<tr><td>

[className](./IQualifierControlOptions.className.md)

</td><td>



</td><td>

string

</td><td>

Custom CSS classes for this qualifier control

</td></tr>
</tbody></table>
