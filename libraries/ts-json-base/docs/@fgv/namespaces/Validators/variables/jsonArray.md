[**@fgv/ts-json-base**](../../../../README.md)

***

[@fgv/ts-json-base](../../../../README.md) / [Validators](../README.md) / jsonArray

# Variable: jsonArray

> `const` **jsonArray**: [`Validator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonArray`](../../../../interfaces/JsonArray.md), [`IJsonValidatorContext`](../interfaces/IJsonValidatorContext.md)\>

An in-place validator which validates that a supplied `unknown` value is
a valid [JsonArray](../../../../interfaces/JsonArray.md). Fails by default if any properties or array elements
are `undefined` - this default behavior can be overridden by supplying an appropriate
[context](../interfaces/IJsonValidatorContext.md) at runtime.
