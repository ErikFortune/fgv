[Home](../../README.md) > [Validators](../README.md) > jsonObject

# Variable: jsonObject

An in-place validator which validates that a supplied `unknown` value is
a valid JsonObject | JsonObject. Fails by default if any properties or array elements
are `undefined` - this default behavior can be overridden by supplying an appropriate
Validators.IJsonValidatorContext | context at runtime.

## Type

`Validator<JsonObject, IJsonValidatorContext>`
