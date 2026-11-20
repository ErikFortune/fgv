[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / LtmIdentityCodec

# Class: LtmIdentityCodec

Identity codec for the long-term-memory (LTM) kind family. An LTM entity is
keyed by its `conversationId`, used verbatim as the filename stem under the
flat `conversations` scope.

## Remarks

- `encode`: scope = `conversations`, idStem = `conversationId`, `isVersioned = false`.
- `decode`: brands the stem back to an [EntityId](../type-aliases/EntityId.md).
- Escaping: the `conversationId` must match the POSIX portable filename set.
- Layout: `vault/conversations/<conversationId>.md`.

An LTM file (`conversations/<id>.md`) and the MTM subtree
(`conversations/<id>/turn-N.md`) coexist — a file and a same-named directory
are independent on every supported FileTree backend.

## Implements

- [`IIdentityCodec`](../interfaces/IIdentityCodec.md)

## Constructors

### Constructor

> **new LtmIdentityCodec**(): `LtmIdentityCodec`

#### Returns

`LtmIdentityCodec`

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-scope"></a> `scope` | `public static readonly` | [`MemoryScopeKey`](../type-aliases/MemoryScopeKey.md) | The fixed scope for every LTM entity. |

## Methods

### decode()

> **decode**(`scope`, `encodedStem`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`EntityId`](../type-aliases/EntityId.md)\>

Decode a FileTree address back to the original [EntityId](../type-aliases/EntityId.md). The exact
inverse of [encode](../interfaces/IIdentityCodec.md#encode) for non-versioned kinds.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`MemoryScopeKey`](../type-aliases/MemoryScopeKey.md) |
| `encodedStem` | `string` |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`EntityId`](../type-aliases/EntityId.md)\>

#### Implementation of

[`IIdentityCodec`](../interfaces/IIdentityCodec.md).[`decode`](../interfaces/IIdentityCodec.md#decode)

***

### encode()

> **encode**(`entityId`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IIdentityCodecResult`](../interfaces/IIdentityCodecResult.md)\>

Encode a consumer-supplied entity id to a FileTree address. Deterministic
and pure — no I/O.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `entityId` | [`EntityId`](../type-aliases/EntityId.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IIdentityCodecResult`](../interfaces/IIdentityCodecResult.md)\>

#### Implementation of

[`IIdentityCodec`](../interfaces/IIdentityCodec.md).[`encode`](../interfaces/IIdentityCodec.md#encode)

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

#### Implementation of

[`IIdentityCodec`](../interfaces/IIdentityCodec.md).[`verifyRoundTrip`](../interfaces/IIdentityCodec.md#verifyroundtrip)
