[Home](../README.md) > OneOfValidator

# Class: OneOfValidator

An in-place Validator | Validator which validates that a supplied
value matches one of several other validators.

**Extends:** `ValidatorBase<T, TC>`

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

Constructs a new Validation.Classes.OneOfValidator | OneOfValidator.

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

[options](./OneOfValidator.options.md)

</td><td>

`readonly`

</td><td>

[ValidatorOptions](../interfaces/ValidatorOptions.md)&lt;TC&gt;

</td><td>

Validation.ValidatorOptions | Options which apply to this

</td></tr>
<tr><td>

[traits](./OneOfValidator.traits.md)

</td><td>

`readonly`

</td><td>

[ValidatorTraits](ValidatorTraits.md)

</td><td>

Validation.ValidatorTraits | Traits describing this validation.

</td></tr>
<tr><td>

[isOptional](./OneOfValidator.isOptional.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Indicates whether this element is explicitly optional.

</td></tr>
<tr><td>

[brand](./OneOfValidator.brand.md)

</td><td>

`readonly`

</td><td>

string | undefined

</td><td>

The brand for a branded type.

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

[validate(from, context)](./OneOfValidator.validate.md)

</td><td>



</td><td>

Tests to see if a supplied `unknown` value matches this validation.

</td></tr>
<tr><td>

[convert(from, context)](./OneOfValidator.convert.md)

</td><td>



</td><td>

Tests to see if a supplied 'unknown' value matches this validation.

</td></tr>
<tr><td>

[validateOptional(from, context)](./OneOfValidator.validateOptional.md)

</td><td>



</td><td>

Tests to see if a supplied `unknown` value matches this
validation.

</td></tr>
<tr><td>

[guard(from, context)](./OneOfValidator.guard.md)

</td><td>



</td><td>

Non-throwing type guard

</td></tr>
<tr><td>

[optional()](./OneOfValidator.optional.md)

</td><td>



</td><td>

Creates an Validation.Validator | in-place validator

</td></tr>
<tr><td>

[withConstraint(constraint, trait)](./OneOfValidator.withConstraint.md)

</td><td>



</td><td>

Creates an Validation.Validator | in-place validator

</td></tr>
<tr><td>

[withBrand(brand)](./OneOfValidator.withBrand.md)

</td><td>



</td><td>

The brand for a branded type.

</td></tr>
<tr><td>

[withFormattedError(formatter)](./OneOfValidator.withFormattedError.md)

</td><td>



</td><td>

Creates a new Validation.Validator | in-place validator which

</td></tr>
<tr><td>

[or(other)](./OneOfValidator.or.md)

</td><td>



</td><td>

Chains this validator with another of the same type, to be attempted if this

</td></tr>
</tbody></table>
