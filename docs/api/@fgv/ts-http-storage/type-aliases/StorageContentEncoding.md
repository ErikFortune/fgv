[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-http-storage](../README.md) / StorageContentEncoding

# Type Alias: StorageContentEncoding

> **StorageContentEncoding** = `"utf8"` \| `"base64"`

How a file's bytes are represented in the `contents` field on the wire.

## Remarks

- `'utf8'` — `contents` is the file decoded as UTF-8 text. This is the
  historical (and default) representation, and it is **lossy**: the decode is
  the lenient WHATWG one, so any byte sequence that is not valid UTF-8 has
  already been replaced by U+FFFD by the time it reaches the wire, and the
  substitution is not recoverable downstream.
- `'base64'` — `contents` is the file's bytes, base64-encoded. Byte-faithful
  and therefore the only representation over which a consumer can decide
  whether the stored bytes were valid UTF-8, or read genuinely binary content.
  Costs roughly 33% more payload.
