[Home](../README.md) > browserSaferFetchJson

# Function: browserSaferFetchJson

Fetches a URL in a browser and parses the response body as JSON, yielding the raw `JsonValue`.

## Signature

```typescript
function browserSaferFetchJson(url: string | URL, options: ISaferFetchOptions): Promise<DetailedResult<ISaferFetchResponse<JsonValue>, FetchFailureReason>>
```
