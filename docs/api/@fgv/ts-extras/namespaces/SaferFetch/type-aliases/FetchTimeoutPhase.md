[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [SaferFetch](../README.md) / FetchTimeoutPhase

# Type Alias: FetchTimeoutPhase

> **FetchTimeoutPhase** = `"headers"` \| `"body"` \| `"overall"`

Which deadline a [timeout failure](FetchFailureReason.md) belongs to.

- `'headers'`: the per-attempt headers deadline elapsed before the server sent
  response headers — the host is not answering.
- `'body'`: the overall deadline elapsed while the response body was being read
  — the host answered and then trickled (the slowloris shape).
- `'overall'`: the overall deadline elapsed before response headers arrived.
