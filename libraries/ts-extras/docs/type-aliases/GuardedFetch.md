[Home](../README.md) > GuardedFetch

# Type Alias: GuardedFetch

A `fetch`-shaped function whose every request goes through the safer-fetch hop walk, and whose
response body is returned **unread**. Created by SaferFetch.createGuardedFetch.

## Type

```typescript
type GuardedFetch = (url: string | URL, init?: RequestInit) => Promise<Response>
```
