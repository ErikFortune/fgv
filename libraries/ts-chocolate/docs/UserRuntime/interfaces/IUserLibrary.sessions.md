[Home](../../README.md) > [UserRuntime](../README.md) > [IUserLibrary](./IUserLibrary.md) > sessions

## IUserLibrary.sessions property

A materialized library of all sessions, keyed by composite ID.
Sessions are materialized lazily on access and cached.

**Signature:**

```typescript
readonly sessions: MaterializedLibrary<SessionId, AnySessionEntity, AnyMaterializedSession, never>;
```
