[Home](../../README.md) > [Context](../README.md) > IContextQualifierProviderValidatorBase

# Interface: IContextQualifierProviderValidatorBase

Base interface for shared operations between read-only and mutable context qualifier provider validators.
Contains common methods that don't depend on provider mutability.

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

[provider](./IContextQualifierProviderValidatorBase.provider.md)

</td><td>

`readonly`

</td><td>

T

</td><td>

The wrapped context qualifier provider.

</td></tr>
<tr><td>

[qualifiers](./IContextQualifierProviderValidatorBase.qualifiers.md)

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
