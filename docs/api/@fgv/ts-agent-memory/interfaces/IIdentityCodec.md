[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IIdentityCodec

# Interface: IIdentityCodec

Maps a consumer-supplied domain key ⇄ a FileTree storage address. Injected
per kind so the store never touches raw domain keys: the codec owns all
filename escaping and the flat-vs-versioned layout dispatch.

## Extended by

- [`ITemporalIdentityCodec`](ITemporalIdentityCodec.md)

## Methods

### decode()

> **decode**(`scope`, `encodedStem`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`EntityId`](../type-aliases/EntityId.md)\>

Decode a FileTree address back to the original [EntityId](../type-aliases/EntityId.md). The exact
inverse of [encode](#encode) for non-versioned kinds.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`MemoryScopeKey`](../type-aliases/MemoryScopeKey.md) |
| `encodedStem` | `string` |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`EntityId`](../type-aliases/EntityId.md)\>

***

### encode()

> **encode**(`entityId`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IIdentityCodecResult`](IIdentityCodecResult.md)\>

Encode a consumer-supplied entity id to a FileTree address. Deterministic
and pure — no I/O.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `entityId` | [`EntityId`](../type-aliases/EntityId.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IIdentityCodecResult`](IIdentityCodecResult.md)\>

***

### verifyRoundTrip()

> **verifyRoundTrip**(`scope`, `stem`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`true`\>

Assert that `stem` is the stem this codec would produce for
`decode(scope, stem)`: `encode(...).idStem` for a flat kind, the
`encodeVersion(...)` stem for a versioned one. Used by the store's load-time
identity check (`verifyLoadedIdentity`).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`MemoryScopeKey`](../type-aliases/MemoryScopeKey.md) |
| `stem` | `string` |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`true`\>

#### Remarks

Only the idStem is part of this contract. The store separately enforces that
a loaded record's scope equals `encode(entityId).scope`, so a codec need not
check scope here — though checking it is harmless, and gives an earlier,
codec-specific message. The store also re-checks the stem itself: against `encode(entityId).idStem`
for a flat kind, and against `encodeVersion(entityId, seq)` for a versioned one.
