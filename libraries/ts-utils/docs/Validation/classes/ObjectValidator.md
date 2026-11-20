[Home](../../README.md) > [Validation](../README.md) > ObjectValidator

# Class: ObjectValidator

In-place Validation.Validator | Validator for an object of type `<T>`.

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

Constructs a new Validation.Classes.ObjectValidator | ObjectValidator<T>.

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

[fields](./ObjectValidator.fields.md)

</td><td>

`readonly`

</td><td>

[FieldValidators](../../type-aliases/FieldValidators.md)&lt;T&gt;

</td><td>

A Validation.Classes.FieldValidators | FieldValidators object specifying a

</td></tr>
<tr><td>

[options](./ObjectValidator.options.md)

</td><td>

`readonly`

</td><td>

[ObjectValidatorOptions](../../interfaces/ObjectValidatorOptions.md)&lt;T, TC&gt;

</td><td>

Validation.Classes.ObjectValidatorOptions | Options which apply to this

</td></tr>
<tr><td>

[traits](./ObjectValidator.traits.md)

</td><td>

`readonly`

</td><td>

[ValidatorTraits](../../classes/ValidatorTraits.md)

</td><td>

Validation.ValidatorTraits | Traits describing this validation.

</td></tr>
<tr><td>

[isOptional](./ObjectValidator.isOptional.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Indicates whether this element is explicitly optional.

</td></tr>
<tr><td>

[brand](./ObjectValidator.brand.md)

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

[partial(options)](./ObjectValidator.partial.md)

</td><td>



</td><td>

Creates a new Validation.Classes.ObjectValidator | ObjectValidator derived from this one but with

</td></tr>
<tr><td>

[addPartial(addOptionalFields)](./ObjectValidator.addPartial.md)

</td><td>



</td><td>

Creates a new Validation.Classes.ObjectValidator | ObjectValidator derived from this one but with

</td></tr>
<tr><td>

[validate(from, context)](./ObjectValidator.validate.md)

</td><td>



</td><td>

Tests to see if a supplied `unknown` value matches this validation.

</td></tr>
<tr><td>

[convert(from, context)](./ObjectValidator.convert.md)

</td><td>



</td><td>

Tests to see if a supplied 'unknown' value matches this validation.

</td></tr>
<tr><td>

[validateOptional(from, context)](./ObjectValidator.validateOptional.md)

</td><td>



</td><td>

Tests to see if a supplied `unknown` value matches this
validation.

</td></tr>
<tr><td>

[guard(from, context)](./ObjectValidator.guard.md)

</td><td>



</td><td>

Non-throwing type guard

</td></tr>
<tr><td>

[optional()](./ObjectValidator.optional.md)

</td><td>



</td><td>

Creates an Validation.Validator | in-place validator

</td></tr>
<tr><td>

[withConstraint(constraint, trait)](./ObjectValidator.withConstraint.md)

</td><td>



</td><td>

Creates an Validation.Validator | in-place validator

</td></tr>
<tr><td>

[withBrand(brand)](./ObjectValidator.withBrand.md)

</td><td>



</td><td>

The brand for a branded type.

</td></tr>
<tr><td>

[withFormattedError(formatter)](./ObjectValidator.withFormattedError.md)

</td><td>



</td><td>

Creates a new Validation.Validator | in-place validator which

</td></tr>
<tr><td>

[or(other)](./ObjectValidator.or.md)

</td><td>



</td><td>

Chains this validator with another of the same type, to be attempted if this

</td></tr>
</tbody></table>
