[Home](../../README.md) > [SaferFetch](../README.md) > FetchFailureReason

# Type Alias: FetchFailureReason

Machine-readable reason a safer-fetch call failed, carried as the detail of the
`DetailedResult` every entry point returns.

## Type

```typescript
type FetchFailureReason = { kind: "invalid-url"; url: string; detail: string } | { kind: "blocked-by-guard"; url: string; hop: number; guard: string; detail: string } | { kind: "redirect-rejected"; url: string; status: number } | { kind: "redirect-opaque" } | { kind: "too-many-redirects"; hops: number; limit: number } | { kind: "timeout"; phase: FetchTimeoutPhase; elapsedMs: number; limitMs: number } | { kind: "aborted" } | { kind: "network"; detail: string } | { kind: "http-status"; status: number; statusText: string; bodyPreview?: string } | { kind: "too-large"; bytesRead: number; limit: number; declared?: number } | { kind: "unsupported-content-type"; contentType?: string; accepted: ReadonlyArray<string> } | { kind: "decode"; detail: string } | { kind: "parse"; detail: string } | { kind: "unknown"; detail: string }
```
