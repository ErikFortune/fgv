[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IIdentityCodecResult

# Interface: IIdentityCodecResult

The FileTree storage address an [IIdentityCodec](IIdentityCodec.md) maps a domain key to.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-idstem"></a> `idStem` | `readonly` | `string` | Filename stem (the part before `.md`). Filename-safe after encoding. |
| <a id="property-isversioned"></a> `isVersioned` | `readonly` | `boolean` | Whether this kind uses a versioned layout (temporal: multiple files per entity) vs. a flat layout (one file per entity). Non-temporal = always `false`. |
| <a id="property-scope"></a> `scope` | `readonly` | [`MemoryScopeKey`](../type-aliases/MemoryScopeKey.md) | Scope path segment (may be multi-level, e.g. `conversations/<id>`). |
