[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / TaskRepositoryMode

# Type Alias: TaskRepositoryMode

> **TaskRepositoryMode** = `"session"` \| \{ `durable`: `"process-crash"`; \}

How durable a repository's commits are.

## Remarks

`'session'` is atomic visibility within the running process and nothing more. The durable
mode names the one guarantee this release can qualify — `'process-crash'` — and a root
that cannot honor it refuses construction rather than silently becoming a session
repository. There is no OS-crash or power-loss mode: a request for one fails before any
I/O (decision A1).
