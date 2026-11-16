[Home](../../README.md) > [SaferFetch](../README.md) > saferFetchText

# Function: saferFetchText

Fetches a URL and decodes the response body as text.

## Signature

```typescript
function saferFetchText(url: string | URL, options: ISaferFetchOptions): Promise<DetailedResult<ISaferFetchResponse<string>, FetchFailureReason>>
```
