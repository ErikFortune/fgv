[Home](../../../README.md) > [Runtime](../../README.md) > [Context](../README.md) > IMutableContextQualifierProviderValidator

# Interface: IMutableContextQualifierProviderValidator

A mutable interface for validators wrapping mutable context qualifier providers.
Extends the base interface with mutation operations and provides compile-time type safety.

**Extends:** [`IContextQualifierProviderValidatorBase<T>`](../../../interfaces/IContextQualifierProviderValidatorBase.md)

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

[provider](./IMutableContextQualifierProviderValidator.provider.md)

</td><td>

`readonly`

</td><td>

T

</td><td>

The wrapped mutable context qualifier provider.

</td></tr>
<tr><td>

[qualifiers](./IContextQualifierProviderValidatorBase.qualifiers.md)

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

[set(name, value)](./IMutableContextQualifierProviderValidator.set.md)

</td><td>



</td><td>

Sets a qualifier value using string inputs, converting to strongly-typed values.

</td></tr>
<tr><td>

[remove(name)](./IMutableContextQualifierProviderValidator.remove.md)

</td><td>



</td><td>

Removes a qualifier value using string input, converting to strongly-typed QualifierName.

</td></tr>
<tr><td>

[get(name)](./IContextQualifierProviderValidatorBase.get.md)

</td><td>



</td><td>

Gets a qualifier value by its string name, converting to strongly-typed QualifierName.

</td></tr>
<tr><td>

[getByIndex(index)](./IContextQualifierProviderValidatorBase.getByIndex.md)

</td><td>



</td><td>

Gets a qualifier value by its number index, converting to strongly-typed QualifierIndex.

</td></tr>
<tr><td>

[getValidated(name)](./IContextQualifierProviderValidatorBase.getValidated.md)

</td><td>



</td><td>

Gets a validated qualifier context value by its string name.

</td></tr>
<tr><td>

[getValidatedByIndex(index)](./IContextQualifierProviderValidatorBase.getValidatedByIndex.md)

</td><td>



</td><td>

Gets a validated qualifier context value by its number index.

</td></tr>
<tr><td>

[has(name)](./IContextQualifierProviderValidatorBase.has.md)

</td><td>



</td><td>

Checks if a qualifier value exists with the given string name.

</td></tr>
</tbody></table>
