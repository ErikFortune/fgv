[Home](../../README.md) > [SaferFetch](../README.md) > browserSaferFetchBytes

# Function: browserSaferFetchBytes

Fetches a URL in a browser and returns the raw response bytes.

## Signature

```typescript
function browserSaferFetchBytes(url: string | URL, options: ISaferFetchOptions): Promise<DetailedResult<ISaferFetchResponse<Uint8Array<ArrayBufferLike>>, FetchFailureReason>>
```
