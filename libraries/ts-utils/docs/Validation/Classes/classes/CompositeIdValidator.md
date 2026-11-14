[Home](../../../README.md) > [Validation](../../README.md) > [Classes](../README.md) > CompositeIdValidator

# Class: CompositeIdValidator

An in-place Validation.Validator | Validator for a strongly-typed composite ID.

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

Constructs a new Validation.Classes.StringValidator | StringValidator.

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

[traits](./CompositeIdValidator.traits.md)

</td><td>

`readonly`

</td><td>

[ValidatorTraits](../../../classes/ValidatorTraits.md)

</td><td>

Validation.ValidatorTraits | Traits describing this validation.

</td></tr>
<tr><td>

[isOptional](./CompositeIdValidator.isOptional.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Indicates whether this element is explicitly optional.

</td></tr>
<tr><td>

[brand](./CompositeIdValidator.brand.md)

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

[validate(from, context)](./CompositeIdValidator.validate.md)

</td><td>



</td><td>

Tests to see if a supplied `unknown` value matches this validation.

</td></tr>
<tr><td>

[convert(from, context)](./CompositeIdValidator.convert.md)

</td><td>



</td><td>

Tests to see if a supplied 'unknown' value matches this validation.

</td></tr>
<tr><td>

[validateOptional(from, context)](./CompositeIdValidator.validateOptional.md)

</td><td>



</td><td>

Tests to see if a supplied `unknown` value matches this
validation.

</td></tr>
<tr><td>

[guard(from, context)](./CompositeIdValidator.guard.md)

</td><td>



</td><td>

Non-throwing type guard

</td></tr>
<tr><td>

[optional()](./CompositeIdValidator.optional.md)

</td><td>



</td><td>

Creates an Validation.Validator | in-place validator

</td></tr>
<tr><td>

[withConstraint(constraint, trait)](./CompositeIdValidator.withConstraint.md)

</td><td>



</td><td>

Creates an Validation.Validator | in-place validator

</td></tr>
<tr><td>

[withBrand(brand)](./CompositeIdValidator.withBrand.md)

</td><td>



</td><td>

The brand for a branded type.

</td></tr>
<tr><td>

[withFormattedError(formatter)](./CompositeIdValidator.withFormattedError.md)

</td><td>



</td><td>

Creates a new Validation.Validator | in-place validator which

</td></tr>
<tr><td>

[or(other)](./CompositeIdValidator.or.md)

</td><td>



</td><td>

Chains this validator with another of the same type, to be attempted if this

</td></tr>
</tbody></table>
