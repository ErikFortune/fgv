[**@fgv/ts-json-base**](../../../../README.md)

***

[@fgv/ts-json-base](../../../../README.md) / [Validators](../README.md) / jsonValue

# Variable: jsonValue

> `const` **jsonValue**: [`Validator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../../../../type-aliases/JsonValue.md), [`IJsonValidatorContext`](../interfaces/IJsonValidatorContext.md)\>

An in-place validator which validates that a supplied `unknown` value is
a valid [JsonValue](../../../../type-aliases/JsonValue.md). Fails by default if any properties or array elements
are `undefined` - this default behavior can be overridden by supplying an appropriate
[context](../interfaces/IJsonValidatorContext.md) at runtime.
