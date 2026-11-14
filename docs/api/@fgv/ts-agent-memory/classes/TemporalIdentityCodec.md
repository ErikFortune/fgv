[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / TemporalIdentityCodec

# Class: TemporalIdentityCodec

Identity codec for a versioned (temporal) kind family, resolving OQ-11 to the
subtree-per-entity layout: every version of an entity is a distinct file under
a per-entity subtree.

## Remarks

- `encode`: scope = `<baseScope>/entities/<entityId>`, idStem = `<entityId>`,
  `isVersioned = true`. The idStem is the stable entity prefix; the store forms
  each version's filename via [TemporalIdentityCodec.encodeVersion](#encodeversion).
- `encodeVersion`: version stem = `<entityId>-v<seq>`.
- `decode` / `decodeVersion`: recover `entityId` (and `seq`) from a
  `(subtree scope, version stem)` pair; the scope is authoritative for the
  `entityId`.
- Escaping: `baseScope` and `entityId` must each match the POSIX portable
  filename set (they become path segments); `seq` is a non-negative integer.
- Layout: `vault/<baseScope>/entities/<entityId>/<entityId>-v<seq>.md`.

## Implements

- [`ITemporalIdentityCodec`](../interfaces/ITemporalIdentityCodec.md)

## Properties

| Property | Modifier | Type | Default value | Description |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-basescope"></a> `baseScope` | `public readonly` | `string` | `undefined` | The base scope segment this codec's entities live under. |
| <a id="property-entitiessegment"></a> `entitiesSegment` | `public static readonly` | `string` | `'entities'` | The fixed subtree segment separating an entity's versions from its scope. |
| <a id="property-versioninfix"></a> `versionInfix` | `public static readonly` | `string` | `'-v'` | The version-stem infix: `<entityId>` + this + `<seq>`. |

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

[`ITemporalIdentityCodec`](../interfaces/ITemporalIdentityCodec.md).[`decode`](../interfaces/ITemporalIdentityCodec.md#decode)

***

### decodeVersion()

> **decodeVersion**(`scope`, `stem`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ITemporalVersionAddress`](../interfaces/ITemporalVersionAddress.md)\>

Parse a `(subtree scope, version stem)` back to its
[ITemporalVersionAddress](../interfaces/ITemporalVersionAddress.md). The subtree scope is authoritative for the
`entityId`, disambiguating a stem whose `entityId` itself ends in
`-v<digits>`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`MemoryScopeKey`](../type-aliases/MemoryScopeKey.md) |
| `stem` | `string` |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ITemporalVersionAddress`](../interfaces/ITemporalVersionAddress.md)\>

#### Implementation of

[`ITemporalIdentityCodec`](../interfaces/ITemporalIdentityCodec.md).[`decodeVersion`](../interfaces/ITemporalIdentityCodec.md#decodeversion)

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

[`ITemporalIdentityCodec`](../interfaces/ITemporalIdentityCodec.md).[`encode`](../interfaces/ITemporalIdentityCodec.md#encode)

***

### encodeVersion()

> **encodeVersion**(`entityId`, `seq`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

Form the version filename stem for a specific `(entityId, seq)`. The store
appends the extension and writes it under the entity subtree returned by
[encode](../interfaces/IIdentityCodec.md#encode).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `entityId` | [`EntityId`](../type-aliases/EntityId.md) |
| `seq` | `number` |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

#### Implementation of

[`ITemporalIdentityCodec`](../interfaces/ITemporalIdentityCodec.md).[`encodeVersion`](../interfaces/ITemporalIdentityCodec.md#encodeversion)

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

[`ITemporalIdentityCodec`](../interfaces/ITemporalIdentityCodec.md).[`verifyRoundTrip`](../interfaces/ITemporalIdentityCodec.md#verifyroundtrip)

***

### create()

> `static` **create**(`baseScope`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`TemporalIdentityCodec`\>

Family-convention factory. Validates that `baseScope` is a single portable
filename segment (it becomes the top-level path component).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `baseScope` | `string` |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`TemporalIdentityCodec`\>
