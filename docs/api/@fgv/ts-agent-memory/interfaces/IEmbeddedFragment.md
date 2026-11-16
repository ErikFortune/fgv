[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IEmbeddedFragment

# Interface: IEmbeddedFragment

One embedded fragment of a record: the fragment's vector, plus at least one of the
two ways to identify it — its advisory in-record [span](IFragmentLocator.md)
and/or an opaque consumer-minted [fragmentId](#property-fragmentid).
Produced by a [FragmentEmbedder](../type-aliases/FragmentEmbedder.md) and stored via
[IFragmentVectorIndex.addFragments](IFragmentVectorIndex.md#addfragments).

## Remarks

Both identity fields are optional **in the type**, but the "at least one"
requirement is real — a fragment carrying neither is unidentifiable at the read
side. It is enforced by [embeddedFragmentConverter](../variables/embeddedFragmentConverter.md) (and re-checked by the
in-package index implementations) rather than by a conditional-required union
(`{ locator; fragmentId? } | { locator?; fragmentId }`), which was considered and
declined: the union costs at every construction site and buys nothing at the read
site, where each field reads as `… | undefined` either way.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-fragmentid"></a> `fragmentId?` | `readonly` | `string` | An opaque, consumer-minted identity for this fragment, carried verbatim through the index and returned on the corresponding [IVectorQueryHit](IVectorQueryHit.md). The index **never parses it, never filters on it, and never assigns meaning to it** — it is a bytestring, not part of the query path. It exists so a fragment stays identifiable when its text is not re-derivable from the record body. The guarantee is "we never parse it", NOT "we keep it stable". Because `addFragments` is whole-record-replace, an updated record re-emits its entire fragment set, so **any stability of a fragment id across re-embeds is the consumer's responsibility**, not the index's. |
| <a id="property-locator"></a> `locator?` | `readonly` | [`IFragmentLocator`](IFragmentLocator.md) | The region of the record body this fragment was derived from, when one can be stated honestly. Advisory — see [IFragmentLocator](IFragmentLocator.md); it is NOT a slice that reproduces the fragment text. Omit it for a fragment with no honest body span (a rewriting segmenter), in which case `fragmentId` must be supplied. |
| <a id="property-vector"></a> `vector` | `readonly` | `Float32Array` | The embedding vector for this fragment. |
