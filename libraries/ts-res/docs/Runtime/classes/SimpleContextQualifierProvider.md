[Home](../../README.md) > [Runtime](../README.md) > SimpleContextQualifierProvider

# Class: SimpleContextQualifierProvider

Simple concrete implementation of Runtime.Context.IContextQualifierProvider | IContextQualifierProvider
using a `ResultMap` for qualifier value storage.

**Extends:** [`ContextQualifierProvider`](../../classes/ContextQualifierProvider.md)

**Implements:** [`IMutableContextQualifierProvider`](../../interfaces/IMutableContextQualifierProvider.md)

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

[mutable](./SimpleContextQualifierProvider.mutable.md)

</td><td>

`readonly`

</td><td>

true

</td><td>

Explicit mutability marker for compile-time type discrimination.

</td></tr>
<tr><td>

[qualifiers](./SimpleContextQualifierProvider.qualifiers.md)

</td><td>

`readonly`

</td><td>

[IReadOnlyQualifierCollector](../../interfaces/IReadOnlyQualifierCollector.md)

</td><td>

The readonly qualifier collector that defines and validates the qualifiers for this context.

</td></tr>
<tr><td>

[size](./SimpleContextQualifierProvider.size.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Gets the number of qualifier values in this provider.

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

[create(params)](./SimpleContextQualifierProvider.create.md)

</td><td>

`static`

</td><td>

Creates a new Runtime.SimpleContextQualifierProvider | SimpleContextQualifierProvider object.

</td></tr>
<tr><td>

[get(nameOrIndexOrQualifier)](./SimpleContextQualifierProvider.get.md)

</td><td>



</td><td>

Gets a qualifier value by its name, index, or qualifier object.

</td></tr>
<tr><td>

[getValidated(nameOrIndexOrQualifier)](./SimpleContextQualifierProvider.getValidated.md)

</td><td>



</td><td>

Gets a validated qualifier context value by its name, index, or qualifier object.

</td></tr>
<tr><td>

[has(name)](./SimpleContextQualifierProvider.has.md)

</td><td>



</td><td>

Checks if a qualifier value exists with the given name.

</td></tr>
<tr><td>

[getNames()](./SimpleContextQualifierProvider.getNames.md)

</td><td>



</td><td>

Gets all available qualifier names in this context.

</td></tr>
<tr><td>

[set(name, value)](./SimpleContextQualifierProvider.set.md)

</td><td>



</td><td>

Sets a qualifier value in this provider.

</td></tr>
<tr><td>

[remove(name)](./SimpleContextQualifierProvider.remove.md)

</td><td>



</td><td>

Removes a qualifier value from this provider.

</td></tr>
<tr><td>

[clear()](./SimpleContextQualifierProvider.clear.md)

</td><td>



</td><td>

Clears all qualifier values from this provider.

</td></tr>
</tbody></table>
