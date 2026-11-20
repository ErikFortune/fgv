[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [SaferFetch](../README.md) / SUPPORTED\_SCHEMES

# Variable: SUPPORTED\_SCHEMES

> `const` **SUPPORTED\_SCHEMES**: `ReadonlyArray`\<`string`\>

URL schemes this primitive will ever request.

## Remarks

Core rejects everything else — `file:`, `data:`, `blob:`, `ftp:`, `gopher:`, `ws:` — outright
and at every hop, because none of them is a legitimate network fetch and each is a standard
SSRF payload. Deciding between `http:` and `https:`, and which ports are acceptable, belongs
to the address guard, which is why core does not narrow this further.
