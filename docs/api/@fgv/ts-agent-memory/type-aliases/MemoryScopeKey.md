[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / MemoryScopeKey

# Type Alias: MemoryScopeKey

> **MemoryScopeKey** = [`Brand`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`, `"MemoryScopeKey"`\>

Scope path segment. May be multi-segment (`/`-separated) for kinds whose
codec maps an entity into a sub-tree (e.g. MTM: `conversations/<id>`). The
codec — not this brand — owns filename-safe escaping, so the converter
validates only the non-empty/length/whitespace hygiene shared by every
brand.
