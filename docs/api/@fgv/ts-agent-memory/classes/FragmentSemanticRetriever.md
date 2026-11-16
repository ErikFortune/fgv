[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / FragmentSemanticRetriever

# Class: FragmentSemanticRetriever

The sub-document semantic-search retriever — the "discovery" half of a
search-then-read contract. It embeds a fragment query, queries the
[IFragmentVectorIndex](../interfaces/IFragmentVectorIndex.md), and returns the raw per-fragment
[hits](../interfaces/IVectorQueryHit.md) (each carrying a record `target` AND whichever of
`locator` / `fragmentId` the stored fragment was indexed with), NOT resolved
records: the consumer re-reads each record and resolves the fragment on its own
read side. Note the `locator` span is advisory — see [IFragmentLocator](../interfaces/IFragmentLocator.md); it
is not a slice guaranteed to reproduce the fragment's text.

## Remarks

Deliberately NOT an [IMemoryRetriever](../interfaces/IMemoryRetriever.md): memory recall is record-granular and
returns records; fragment discovery is fragment-granular and returns fragment
identities. Keeping it a distinct surface matches the consumer contract (memory
stays record-granular; sub-document knowledge uses a separate fragment index) and
avoids overloading the record retriever's return type with identity fields that
only make sense here.

When no backend is wired, `supportsFragmentRecall` is `false` and any fragment
query degrades loudly ([FRAGMENT\_SEMANTIC\_UNWIRED\_MESSAGE](../variables/FRAGMENT_SEMANTIC_UNWIRED_MESSAGE.md)) — it NEVER
returns a silent empty. A consumer-supplied backend that rejects (throws) is
normalized into a `Failure`.

## Accessors

### capabilities

#### Get Signature

> **get** **capabilities**(): [`IFragmentRetrieverCapabilities`](../interfaces/IFragmentRetrieverCapabilities.md)

What this retriever can do given its wiring.

##### Returns

[`IFragmentRetrieverCapabilities`](../interfaces/IFragmentRetrieverCapabilities.md)

## Methods

### retrieve()

> **retrieve**(`query`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IVectorQueryHit`](../interfaces/IVectorQueryHit.md)[]\>\>

Embed `query.semantic`, query the fragment index, and return the per-fragment
hits in descending score order. Fails loudly when no backend is wired.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `query` | [`IFragmentQuery`](../interfaces/IFragmentQuery.md) |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IVectorQueryHit`](../interfaces/IVectorQueryHit.md)[]\>\>

***

### create()

> `static` **create**(`params`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`FragmentSemanticRetriever`\>

Family-convention factory.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | \{ `backend?`: [`IFragmentSemanticBackend`](../interfaces/IFragmentSemanticBackend.md); `identityResolver?`: [`IIdentityResolver`](../interfaces/IIdentityResolver.md); \} | `backend` wires fragment recall itself. `identityResolver` resolves a query's `(kind, entityId)` narrowing to a storage address; `IMemoryStore` implements it, so the usual wiring is `{ backend, identityResolver: store }`. It is optional because an unscoped fragment search needs nothing to resolve — but a query that *does* carry a narrowing fails loudly without it rather than quietly searching everything. |
| `params.backend?` | [`IFragmentSemanticBackend`](../interfaces/IFragmentSemanticBackend.md) | - |
| `params.identityResolver?` | [`IIdentityResolver`](../interfaces/IIdentityResolver.md) | - |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`FragmentSemanticRetriever`\>
