[Home](../../README.md) > [Classes](../README.md) > TypeGuardValidator

# Class: TypeGuardValidator

An in-place Validation.Validator | Validator that can be instantiated using a type guard
function.

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

Constructs a new Validation.Classes.TypeGuardValidator | TypeGuardValidator.

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

[options](./TypeGuardValidator.options.md)

</td><td>

`readonly`

</td><td>

[ValidatorOptions](../../interfaces/ValidatorOptions.md)&lt;TC&gt;

</td><td>

Validation.ValidatorOptions | Options which apply to this

</td></tr>
<tr><td>

[description](./TypeGuardValidator.description.md)

</td><td>

`readonly`

</td><td>

string

</td><td>



</td></tr>
<tr><td>

[traits](./TypeGuardValidator.traits.md)

</td><td>

`readonly`

</td><td>

[ValidatorTraits](../../classes/ValidatorTraits.md)

</td><td>

Validation.ValidatorTraits | Traits describing this validation.

</td></tr>
<tr><td>

[isOptional](./TypeGuardValidator.isOptional.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Indicates whether this element is explicitly optional.

</td></tr>
<tr><td>

[brand](./TypeGuardValidator.brand.md)

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

[validate(from, context)](./TypeGuardValidator.validate.md)

</td><td>



</td><td>

Tests to see if a supplied `unknown` value matches this validation.

</td></tr>
<tr><td>

[convert(from, context)](./TypeGuardValidator.convert.md)

</td><td>



</td><td>

Tests to see if a supplied 'unknown' value matches this validation.

</td></tr>
<tr><td>

[validateOptional(from, context)](./TypeGuardValidator.validateOptional.md)

</td><td>



</td><td>

Tests to see if a supplied `unknown` value matches this
validation.

</td></tr>
<tr><td>

[guard(from, context)](./TypeGuardValidator.guard.md)

</td><td>



</td><td>

Non-throwing type guard

</td></tr>
<tr><td>

[optional()](./TypeGuardValidator.optional.md)

</td><td>



</td><td>

Creates an Validation.Validator | in-place validator

</td></tr>
<tr><td>

[withConstraint(constraint, trait)](./TypeGuardValidator.withConstraint.md)

</td><td>



</td><td>

Creates an Validation.Validator | in-place validator

</td></tr>
<tr><td>

[withBrand(brand)](./TypeGuardValidator.withBrand.md)

</td><td>



</td><td>

The brand for a branded type.

</td></tr>
<tr><td>

[withFormattedError(formatter)](./TypeGuardValidator.withFormattedError.md)

</td><td>



</td><td>

Creates a new Validation.Validator | in-place validator which

</td></tr>
<tr><td>

[or(other)](./TypeGuardValidator.or.md)

</td><td>



</td><td>

Chains this validator with another of the same type, to be attempted if this

</td></tr>
</tbody></table>
