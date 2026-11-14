[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IIdentityResolver

# Interface: IIdentityResolver

Resolves a consumer-facing `(kind, entityId)` address to the storage address the
vault files it under, **without reading the record**.

## Remarks

This is the resolution `IMemoryStore.get(kind, entityId)` already performs before
it reads anything: `kind` selects the kind's `IIdentityCodec`, and the codec's
`encode` computes `{ scope, idStem, isVersioned }`. Exposing it separately lets a
caller that needs only the *address* — a fragment query narrowing to one record,
say — avoid paying for a read it does not want.

**The resolution is a function, not a search, and that is the load-bearing
property.** A consumer holds an `EntityId`; a vector hit is addressed by a
`(scope, id)` pair; and `EntityId` promises no uniqueness beyond a scope, so the
same id may legitimately appear in several scopes (a document `acme-corp` under
one kind and the entity `acme-corp` under another is the ordinary case, not a
pathological one). Supplying `kind` selects one codec, and a codec cannot return
two answers — so ambiguity is structurally impossible rather than merely unlikely,
and no disambiguation pass is needed anywhere downstream.

Narrow by design, mirroring `IMemoryRecordResolver`: a component that needs to
turn an entity address into a storage address should depend on this rather than on
the whole store.

## Extended by

- [`IMemoryStore`](IMemoryStore.md)

## Methods

### resolveIdentity()

> **resolveIdentity**(`kind`, `entityId`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IIdentityCodecResult`](IIdentityCodecResult.md)\>

The storage address `(kind, entityId)` maps to, without reading the record.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `kind` | [`Kind`](../type-aliases/Kind.md) | Selects the identity codec. Required: it is what makes the resolution unambiguous. |
| `entityId` | [`EntityId`](../type-aliases/EntityId.md) | The consumer-supplied domain key. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IIdentityCodecResult`](IIdentityCodecResult.md)\>

`Success` with the codec's `{ scope, idStem, isVersioned }`, or
`Failure` if no codec is registered for `kind` (and no default is wired) or the
codec rejects the id. Both are caller errors and both are loud.
