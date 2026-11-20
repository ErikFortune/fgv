[Home](../README.md) > IReadOnlyContextQualifierProvider

# Interface: IReadOnlyContextQualifierProvider

Read-only interface for providing qualifier values in an optimized runtime context.
Explicitly marked as immutable with compile-time type discrimination.

**Extends:** [`IContextQualifierProviderBase`](IContextQualifierProviderBase.md)

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

[mutable](./IReadOnlyContextQualifierProvider.mutable.md)

</td><td>

`readonly`

</td><td>

false

</td><td>

Explicit mutability marker for compile-time type discrimination.

</td></tr>
<tr><td>

[qualifiers](./IContextQualifierProviderBase.qualifiers.md)

</td><td>

`readonly`

</td><td>

[IReadOnlyQualifierCollector](IReadOnlyQualifierCollector.md)

</td><td>

The readonly qualifier collector that defines and validates the qualifiers for this context.

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

[get(nameOrIndexOrQualifier)](./IContextQualifierProviderBase.get.md)

</td><td>



</td><td>

Gets a qualifier value by its name, index, or qualifier object.

</td></tr>
<tr><td>

[getValidated(nameOrIndexOrQualifier)](./IContextQualifierProviderBase.getValidated.md)

</td><td>



</td><td>

Gets a validated qualifier context value by its name, index, or qualifier object.

</td></tr>
<tr><td>

[has(name)](./IContextQualifierProviderBase.has.md)

</td><td>



</td><td>

Checks if a qualifier value exists with the given name.

</td></tr>
<tr><td>

[getNames()](./IContextQualifierProviderBase.getNames.md)

</td><td>



</td><td>

Gets all available qualifier names in this context.

</td></tr>
</tbody></table>
