[Home](../README.md) > jsonValue

# Variable: jsonValue

An in-place validator which validates that a supplied `unknown` value is
a valid JsonValue | JsonValue. Fails by default if any properties or array elements
are `undefined` - this default behavior can be overridden by supplying an appropriate
Validators.IJsonValidatorContext | context at runtime.

## Type

`Validator<JsonValue, IJsonValidatorContext>`
