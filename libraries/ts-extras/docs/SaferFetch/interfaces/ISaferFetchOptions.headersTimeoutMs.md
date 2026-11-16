[Home](../../README.md) > [SaferFetch](../README.md) > [ISaferFetchOptions](./ISaferFetchOptions.md) > headersTimeoutMs

## ISaferFetchOptions.headersTimeoutMs property

Deadline to first response headers, in milliseconds. Default
SaferFetch.DEFAULT_HEADERS_TIMEOUT_MS. Distinguishes "the host is not answering"
from "the host is answering slowly", which the failure taxonomy then reports as
`timeout.phase`.

**Signature:**

```typescript
readonly headersTimeoutMs: number;
```
