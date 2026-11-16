[Home](../README.md) > saferFetchJson

# Function: saferFetchJson

Fetches a URL and parses the response body as JSON, yielding the raw `JsonValue` for the
caller to validate.

## Signature

```typescript
function saferFetchJson(url: string | URL, options: ISaferFetchOptions): Promise<DetailedResult<ISaferFetchResponse<JsonValue>, FetchFailureReason>>
```
