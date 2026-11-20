[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [JsonSchema](../README.md) / isSchemaValidator

# Function: isSchemaValidator()

> **isSchemaValidator**(`value`): `value is ISchemaValidator<unknown>`

Whether `value` is an `ISchemaValidator` — i.e. a schema authored with the
`JsonSchema` factories, as opposed to a plain `Converter` or `Validator`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `unknown` | The value to test. |

## Returns

`value is ISchemaValidator<unknown>`

## Remarks

`ISchemaValidator<T> extends Validator<T>`, so a caller can already pass a
schema anywhere a `Validator` is accepted and the callee cannot tell. This guard
is what lets such a callee *look* — and do something more with a schema than it
can with a bare validator, most usefully emitting `toJson()` onto a wire.
`@fgv/ts-extras`' `generateJsonCompletion` uses it exactly that way: one object
is both the wire schema and the reply validator, so the two cannot drift.

Narrows to `ISchemaValidator<unknown>` rather than `ISchemaValidator<T>` —
`_type` is a *node-kind* discriminant and carries no evidence about `T`, which
lives only in the erased `__staticType` phantom. A guard claiming otherwise
would be asserting, not checking.
