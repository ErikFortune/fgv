[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-utils](../README.md) / Uuid

# Type Alias: Uuid

> **Uuid** = [`Brand`](Brand.md)\<`string`, `"Uuid"`\>

A canonical UUIDv4 string: 8-4-4-4-12 lowercase hex digits with version
nibble `4` and variant nibble in `[89ab]`. Produced by [generateUuid](../functions/generateUuid.md)
and validated by [isValidUuid](../functions/isValidUuid.md).
