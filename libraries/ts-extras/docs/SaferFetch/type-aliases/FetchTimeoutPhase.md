[Home](../../README.md) > [SaferFetch](../README.md) > FetchTimeoutPhase

# Type Alias: FetchTimeoutPhase

Which deadline a SaferFetch.FetchFailureReason | timeout failure belongs to.

- `'headers'`: the per-attempt headers deadline elapsed before the server sent
  response headers — the host is not answering.
- `'body'`: the overall deadline elapsed while the response body was being read
  — the host answered and then trickled (the slowloris shape).
- `'overall'`: the overall deadline elapsed before response headers arrived.

## Type

```typescript
type FetchTimeoutPhase = "headers" | "body" | "overall"
```
