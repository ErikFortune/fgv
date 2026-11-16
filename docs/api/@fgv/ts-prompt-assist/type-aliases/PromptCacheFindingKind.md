[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / PromptCacheFindingKind

# Type Alias: PromptCacheFindingKind

> **PromptCacheFindingKind** = `"stability-refuted"` \| `"cache-hostile-ordering"` \| `"no-cacheable-prefix"` \| `"threshold-unknown"` \| `"below-threshold"`

Discriminator for a [IPromptCacheFinding](../interfaces/IPromptCacheFinding.md).

## Remarks

`'stability-refuted'` — a claim contradicted by resolve-time evidence;
the claim is downgraded, never upgraded. Fires for a declared slot claim
(multi-scope binding, a resource-bound slot, or a slot inside a
qualifier-conditional body) and for the derived `'template'` `'frozen'`
default (a qualifier-conditional body). A qualifier-conditional body refutes
a claim only when an axis conditioning it — a winning candidate's, or once
a winner is conditional, a competing candidate's — is declared (or defaults,
as `'per-request'`) less stable than the claim; see
[IExpectedQualifierAxis.stability](../interfaces/IExpectedQualifierAxis.md#property-stability). A `'preface'` section's stability —
whether the `'frozen'` default or an explicit
[IPromptSafetyPolicy.antiJailbreakPrefaceStability](../interfaces/IPromptSafetyPolicy.md#property-antijailbreakprefacestability) — is trusted, not
refuted: no resolve-time evidence can check it (see
`effectiveSectionStability`'s doc comment); this finding never fires for it.
`'cache-hostile-ordering'` — a stable section follows a less-stable one in
document order, which costs money today on every provider whose caching is
automatic, since byte order is the only lever those providers give a
caller.
`'no-cacheable-prefix'` — the resolve's stability hints yield no cacheable
prefix at all: the very first section is already `'per-request'`.
`'threshold-unknown'` — a cacheable prefix exists and (when a measure was
supplied) its size is known, but this library has no verified minimum to
judge it against.
`'below-threshold'` — a cacheable prefix exists, its size is known, a
minimum is known, and the prefix falls short of it.
