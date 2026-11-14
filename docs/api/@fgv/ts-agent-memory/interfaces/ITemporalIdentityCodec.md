[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / ITemporalIdentityCodec

# Interface: ITemporalIdentityCodec

Additive extension of [IIdentityCodec](IIdentityCodec.md) for versioned (temporal) kinds. A
codec whose [encode](IIdentityCodec.md#encode) reports `isVersioned: true`
implements this so the store can form and parse per-version filenames without
knowing the layout. Non-versioned codecs do NOT implement it (probe with
[isTemporalIdentityCodec](../functions/isTemporalIdentityCodec.md)).

## Extends

- [`IIdentityCodec`](IIdentityCodec.md)

## Methods

### decode()

> **decode**(`scope`, `encodedStem`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`EntityId`](../type-aliases/EntityId.md)\>

Decode a FileTree address back to the original [EntityId](../type-aliases/EntityId.md). The exact
inverse of [encode](IIdentityCodec.md#encode) for non-versioned kinds.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`MemoryScopeKey`](../type-aliases/MemoryScopeKey.md) |
| `encodedStem` | `string` |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`EntityId`](../type-aliases/EntityId.md)\>

#### Inherited from

[`IIdentityCodec`](IIdentityCodec.md).[`decode`](IIdentityCodec.md#decode)

***

### decodeVersion()

> **decodeVersion**(`scope`, `stem`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ITemporalVersionAddress`](ITemporalVersionAddress.md)\>

Parse a `(subtree scope, version stem)` back to its
[ITemporalVersionAddress](ITemporalVersionAddress.md). The subtree scope is authoritative for the
`entityId`, disambiguating a stem whose `entityId` itself ends in
`-v<digits>`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`MemoryScopeKey`](../type-aliases/MemoryScopeKey.md) |
| `stem` | `string` |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ITemporalVersionAddress`](ITemporalVersionAddress.md)\>

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

#### Inherited from

[`IIdentityCodec`](IIdentityCodec.md).[`encode`](IIdentityCodec.md#encode)

***

### encodeVersion()

> **encodeVersion**(`entityId`, `seq`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

Form the version filename stem for a specific `(entityId, seq)`. The store
appends the extension and writes it under the entity subtree returned by
[encode](IIdentityCodec.md#encode).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `entityId` | [`EntityId`](../type-aliases/EntityId.md) |
| `seq` | `number` |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

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

#### Inherited from

[`IIdentityCodec`](IIdentityCodec.md).[`verifyRoundTrip`](IIdentityCodec.md#verifyroundtrip)
