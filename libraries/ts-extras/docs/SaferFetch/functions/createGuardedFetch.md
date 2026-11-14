[Home](../../README.md) > [SaferFetch](../README.md) > createGuardedFetch

# Function: createGuardedFetch

Creates a `fetch`-shaped function that sends every request through the safer-fetch hop walk and
returns the response **without reading its body** — for streaming responses (Server-Sent Events,
MCP Streamable HTTP) and for libraries that take a `fetch`.

## Signature

```typescript
function createGuardedFetch(options: IGuardedFetchOptions): Result<GuardedFetch>
```
