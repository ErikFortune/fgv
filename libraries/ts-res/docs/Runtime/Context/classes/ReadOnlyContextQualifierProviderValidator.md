[Home](../../../README.md) > [Runtime](../../README.md) > [Context](../README.md) > ReadOnlyContextQualifierProviderValidator

# Class: ReadOnlyContextQualifierProviderValidator

A validator for read-only context qualifier providers that accepts string inputs
and converts them to strongly-typed values before calling the wrapped provider.
Only provides read operations for compile-time type safety.

**Extends:** `BaseContextQualifierProviderValidator<T>`

**Implements:** [`IReadOnlyContextQualifierProviderValidator<T>`](../../../interfaces/IReadOnlyContextQualifierProviderValidator.md)

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

Constructs a new Runtime.Context.ReadOnlyContextQualifierProviderValidator | ReadOnlyContextQualifierProviderValidator.

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

[provider](./ReadOnlyContextQualifierProviderValidator.provider.md)

</td><td>

`readonly`

</td><td>

T

</td><td>

The wrapped read-only context qualifier provider.

</td></tr>
<tr><td>

[qualifiers](./ReadOnlyContextQualifierProviderValidator.qualifiers.md)

</td><td>

`readonly`

</td><td>

[IReadOnlyQualifierCollector](../../../interfaces/IReadOnlyQualifierCollector.md)

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

[get(name)](./ReadOnlyContextQualifierProviderValidator.get.md)

</td><td>



</td><td>

Gets a qualifier value by its string name, converting to strongly-typed QualifierName.

</td></tr>
<tr><td>

[getByIndex(index)](./ReadOnlyContextQualifierProviderValidator.getByIndex.md)

</td><td>



</td><td>

Gets a qualifier value by its number index, converting to strongly-typed QualifierIndex.

</td></tr>
<tr><td>

[getValidated(name)](./ReadOnlyContextQualifierProviderValidator.getValidated.md)

</td><td>



</td><td>

Gets a validated qualifier context value by its string name.

</td></tr>
<tr><td>

[getValidatedByIndex(index)](./ReadOnlyContextQualifierProviderValidator.getValidatedByIndex.md)

</td><td>



</td><td>

Gets a validated qualifier context value by its number index.

</td></tr>
<tr><td>

[has(name)](./ReadOnlyContextQualifierProviderValidator.has.md)

</td><td>



</td><td>

Checks if a qualifier value exists with the given string name.

</td></tr>
</tbody></table>
