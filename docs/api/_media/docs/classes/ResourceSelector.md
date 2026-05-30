[Home](../README.md) > ResourceSelector

# Class: ResourceSelector

Resource selector utility for filtering resources based on various criteria.
Supports built-in selector types and extensible custom selectors.

## Constructors

<table><thead><tr><th>

Constructor

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

`constructor()`

</td><td>



</td><td>



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

[registerSelector(type, handler)](./ResourceSelector.registerSelector.md)

</td><td>



</td><td>

Register a new selector type that can be used in grid configurations.

</td></tr>
<tr><td>

[getRegisteredTypes()](./ResourceSelector.getRegisteredTypes.md)

</td><td>



</td><td>

Get all registered selector types (useful for debugging/tooling).

</td></tr>
<tr><td>

[select(selector, resources)](./ResourceSelector.select.md)

</td><td>



</td><td>

Select resources based on the provided selector configuration.

</td></tr>
</tbody></table>
