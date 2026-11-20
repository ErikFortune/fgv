[Home](../../README.md) > [SaferFetch](../README.md) > saferFetchBytes

# Function: saferFetchBytes

Fetches a URL and returns the raw response bytes, subject to the scheme check, the address
guard, the request and response guards, the deadlines, and the response size cap.

## Signature

```typescript
function saferFetchBytes(url: string | URL, options: ISaferFetchOptions): Promise<DetailedResult<ISaferFetchResponse<Uint8Array<ArrayBufferLike>>, FetchFailureReason>>
```
