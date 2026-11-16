[Home](../README.md) > browserSaferFetchText

# Function: browserSaferFetchText

Fetches a URL in a browser and decodes the response body as text.

## Signature

```typescript
function browserSaferFetchText(url: string | URL, options: ISaferFetchOptions): Promise<DetailedResult<ISaferFetchResponse<string>, FetchFailureReason>>
```
