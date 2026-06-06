[Home](../../README.md) > [Context](../README.md) > MutableContextQualifierProviderValidator

# Class: MutableContextQualifierProviderValidator

A validator for mutable context qualifier providers that accepts string inputs
and converts them to strongly-typed values before calling the wrapped provider.
Provides both read and mutation operations.

**Extends:** `BaseContextQualifierProviderValidator<T>`

**Implements:** [`IMutableContextQualifierProviderValidator<T>`](../../interfaces/IMutableContextQualifierProviderValidator.md)

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

`constructor(params)`

</td><td>



</td><td>

Constructs a new Runtime.Context.MutableContextQualifierProviderValidator | MutableContextQualifierProviderValidator.

</td></tr>
</tbody></table>

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

[provider](./MutableContextQualifierProviderValidator.provider.md)

</td><td>

`readonly`

</td><td>

T

</td><td>

The wrapped mutable context qualifier provider.

</td></tr>
<tr><td>

[qualifiers](./MutableContextQualifierProviderValidator.qualifiers.md)

</td><td>

`readonly`

</td><td>

[IReadOnlyQualifierCollector](../../interfaces/IReadOnlyQualifierCollector.md)

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

[set(name, value)](./MutableContextQualifierProviderValidator.set.md)

</td><td>



</td><td>

Sets a qualifier value using string inputs, converting to strongly-typed values.

</td></tr>
<tr><td>

[remove(name)](./MutableContextQualifierProviderValidator.remove.md)

</td><td>



</td><td>

Removes a qualifier value using string input, converting to strongly-typed QualifierName.

</td></tr>
<tr><td>

[get(name)](./MutableContextQualifierProviderValidator.get.md)

</td><td>



</td><td>

Gets a qualifier value by its string name, converting to strongly-typed QualifierName.

</td></tr>
<tr><td>

[getByIndex(index)](./MutableContextQualifierProviderValidator.getByIndex.md)

</td><td>



</td><td>

Gets a qualifier value by its number index, converting to strongly-typed QualifierIndex.

</td></tr>
<tr><td>

[getValidated(name)](./MutableContextQualifierProviderValidator.getValidated.md)

</td><td>



</td><td>

Gets a validated qualifier context value by its string name.

</td></tr>
<tr><td>

[getValidatedByIndex(index)](./MutableContextQualifierProviderValidator.getValidatedByIndex.md)

</td><td>



</td><td>

Gets a validated qualifier context value by its number index.

</td></tr>
<tr><td>

[has(name)](./MutableContextQualifierProviderValidator.has.md)

</td><td>



</td><td>

Checks if a qualifier value exists with the given string name.

</td></tr>
</tbody></table>
