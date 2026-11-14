[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-res](../README.md) / ConditionSetHash

# Type Alias: ConditionSetHash

> **ConditionSetHash** = [`Brand`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`, `"ConditionSetHash"`\>

Branded string representing a hash value for a condition set. The hash value
is an 8-character string derived from the crc32 hash of the condition set key
and is used to quickly and compactly identify a condition set or compare for
equality.
