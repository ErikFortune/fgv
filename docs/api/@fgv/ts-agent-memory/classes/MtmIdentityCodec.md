[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / MtmIdentityCodec

# Class: MtmIdentityCodec

Identity codec for the medium-term-memory (MTM) kind family. An MTM entity is
keyed by the colon-composite `<conversationId>:<turnIndex>` and maps into a
per-conversation subtree.

## Remarks

- `encode`: splits the entity id on `:`; scope =
  `conversations/<conversationId>` (multi-segment), idStem = `turn-<turnIndex>`,
  `isVersioned = false`.
- `decode`: reverses scope `conversations/<id>` + stem `turn-<N>` to the
  composite `<id>:<N>`.
- Escaping: `conversationId` must match the POSIX portable filename set (so it
  contains no `/` or `:`); `turnIndex` must be a non-negative integer string,
  preserved verbatim so the round-trip is exact.
- Layout: `vault/conversations/<conversationId>/turn-<N>.md`. The `/` in the
  scope is handled by the store's multi-segment scope resolver.

**Verbatim turn index (caller-canonicalization note).** The turn index is
preserved exactly — `conv-1:7` and `conv-1:007` are DISTINCT entities mapping
to distinct files (`turn-7.md` / `turn-007.md`). Verbatim preservation is what
makes the round-trip exact, but it means a caller that formats turn indices
inconsistently (some zero-padded, some not) will silently mint separate
entities. Callers should canonicalize to one form (e.g. no leading zeros).

## Implements

- [`IIdentityCodec`](../interfaces/IIdentityCodec.md)

## Constructors

### Constructor

> **new MtmIdentityCodec**(): `MtmIdentityCodec`

#### Returns

`MtmIdentityCodec`

## Properties

| Property | Modifier | Type | Default value | Description |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-rootscopesegment"></a> `rootScopeSegment` | `public static readonly` | `string` | `'conversations'` | The top-level scope segment under which every MTM subtree lives. |
| <a id="property-turnstemprefix"></a> `turnStemPrefix` | `public static readonly` | `string` | `'turn-'` | The fixed filename-stem prefix for a turn record. |

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
