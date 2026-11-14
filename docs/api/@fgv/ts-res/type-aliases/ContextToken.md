[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-res](../README.md) / ContextToken

# Type Alias: ContextToken

> **ContextToken** = [`Brand`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`, `"ContextToken"`\>

A string representing a validated context token. Context tokens are
pipe-separated lists of one or more context qualifier tokens. Uses "|" as separator
to avoid conflicts with comma-separated values within context values.
Example: "language=en-US,de-DE|territory=US|role=admin"
