[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-web-extras](../README.md) / HttpContentEncoding

# Type Alias: HttpContentEncoding

> **HttpContentEncoding** = `"utf8"` \| `"base64"`

How a file's bytes are represented in the storage API's `contents` field.

## Remarks

Mirrors `StorageContentEncoding` in `@fgv/ts-http-storage`. Declared here
rather than imported because this package must not take a dependency on the
server library — the two are ends of a wire contract, not layers of a stack.
