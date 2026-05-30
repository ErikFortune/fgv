[Home](../README.md) > ValidatingSimpleContextQualifierProvider

# Class: ValidatingSimpleContextQualifierProvider

A Runtime.SimpleContextQualifierProvider | SimpleContextQualifierProvider with a
Runtime.Context.MutableContextQualifierProviderValidator | validator property that enables
validated use of the underlying provider with string keys and values.
This eliminates the need for type casting in consumer code.

**Extends:** [`SimpleContextQualifierProvider`](SimpleContextQualifierProvider.md)

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

[validating](./ValidatingSimpleContextQualifierProvider.validating.md)

</td><td>

`readonly`

</td><td>

[IMutableContextQualifierProviderValidator](../interfaces/IMutableContextQualifierProviderValidator.md)

</td><td>

A Runtime.Context.MutableContextQualifierProviderValidator | MutableContextQualifierProviderValidator which validates

</td></tr>
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

[IReadOnlyQualifierCollector](../interfaces/IReadOnlyQualifierCollector.md)

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

[create(params)](./ValidatingSimpleContextQualifierProvider.create.md)

</td><td>

`static`

</td><td>

Creates a new Runtime.ValidatingSimpleContextQualifierProvider | ValidatingSimpleContextQualifierProvider object.

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
