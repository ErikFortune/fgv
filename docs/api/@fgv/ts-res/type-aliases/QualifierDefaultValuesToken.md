[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-res](../README.md) / QualifierDefaultValuesToken

# Type Alias: QualifierDefaultValuesToken

> **QualifierDefaultValuesToken** = [`Brand`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`, `"QualifierDefaultValuesToken"`\>

A string representing a validated qualifier default values token. Default value tokens are
pipe-separated lists of one or more qualifier default value tokens. Uses "|" as separator
to avoid conflicts with comma-separated values within default values.
Example: "language=en-US,en-CA|territory=US|device=desktop,tablet"
