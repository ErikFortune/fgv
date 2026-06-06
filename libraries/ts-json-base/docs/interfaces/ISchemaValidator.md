[Home](../README.md) > ISchemaValidator

# Interface: ISchemaValidator

A typed JSON Schema node for the LLM-tool subset. Every value returned by the
schema factories implements this interface — it IS a `Validator<T>` and also
carries a `toJson()` method for wire-format emission.

**Extends:** [`Validator<T>`](../type-aliases/Validator.md)

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

[__staticType](./ISchemaValidator.__staticType.md)

</td><td>

`readonly`

</td><td>

T

</td><td>

Phantom type carrier — type-level only, never present at runtime.

</td></tr>
<tr><td>

[_type](./ISchemaValidator._type.md)

</td><td>

`readonly`

</td><td>

[SchemaNodeType](../type-aliases/SchemaNodeType.md)

</td><td>

Runtime discriminant.

</td></tr>
<tr><td>

[description](./ISchemaValidator.description.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional human-readable description emitted into the wire JSON Schema.

</td></tr>
<tr><td>

[traits](./ISchemaValidator.traits.md)

</td><td>

`readonly`

</td><td>

ValidatorTraits

</td><td>

Validation.ValidatorTraits | Traits describing this validation.

</td></tr>
<tr><td>

[isOptional](./ISchemaValidator.isOptional.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Indicates whether this element is explicitly optional.

</td></tr>
<tr><td>

[brand](./ISchemaValidator.brand.md)

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

[toJson()](./ISchemaValidator.toJson.md)

</td><td>



</td><td>

Emits the standard JSON Schema (draft-07 LLM-tool subset) wire form for this schema.

</td></tr>
<tr><td>

[validate(from, context)](./ISchemaValidator.validate.md)

</td><td>



</td><td>

Tests to see if a supplied `unknown` value matches this validation.

</td></tr>
<tr><td>

[convert(from, context)](./ISchemaValidator.convert.md)

</td><td>



</td><td>

Tests to see if a supplied 'unknown' value matches this validation.

</td></tr>
<tr><td>

[validateOptional(from, context)](./ISchemaValidator.validateOptional.md)

</td><td>



</td><td>

Tests to see if a supplied `unknown` value matches this
validation.

</td></tr>
<tr><td>

[guard(from, context)](./ISchemaValidator.guard.md)

</td><td>



</td><td>

Non-throwing type guard

</td></tr>
<tr><td>

[optional()](./ISchemaValidator.optional.md)

</td><td>



</td><td>

Creates an Validation.Validator | in-place validator

</td></tr>
<tr><td>

[withConstraint(constraint, trait)](./ISchemaValidator.withConstraint.md)

</td><td>



</td><td>

Creates an Validation.Validator | in-place validator

</td></tr>
<tr><td>

[withBrand(brand)](./ISchemaValidator.withBrand.md)

</td><td>



</td><td>

Creates a new Validation.Validator | in-place validator which

</td></tr>
<tr><td>

[withFormattedError(formatter)](./ISchemaValidator.withFormattedError.md)

</td><td>



</td><td>

Creates a new Validation.Validator | in-place validator which

</td></tr>
<tr><td>

[or(other)](./ISchemaValidator.or.md)

</td><td>



</td><td>

Chains this validator with another of the same type, to be attempted if this

</td></tr>
</tbody></table>
