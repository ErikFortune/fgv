[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / ModelSpecKey

# Type Alias: ModelSpecKey

> **ModelSpecKey** = `"base"` \| `"advanced"` \| `"frontier"` \| `"image"` \| `"embedding"`

Known context keys for model specification maps.

## Remarks

Two axes live here and nothing else: the **quality tier** (`base` / `advanced`
/ `frontier`) selects the *completion* model, and `image` / `embedding` select
the non-completion modalities.

There is deliberately **no `tools` or `thinking` key**. Both existed before the
quality-tier axis landed and were removed with it: server-side tools and
reasoning effort are orthogonal *request* params that ride on top of whatever
model the tier already selected — they never select a model. A tool-using or
thinking-enabled call passes a tier like any other call (omit → `base`, or
`'advanced'` / `'frontier'`) and sets the tools / thinking request params
independently. Thinking composes with any tier without a tier-level capability
check — but that is a statement about the tier axis, not a claim that every
provider supports thinking, or that every model of a thinking-capable provider
does: the descriptor itself declares no thinking-availability field at all.
`AiModelCapability`'s `'thinking'` entry (per-model, RegExp-matched on model id
in `DEFAULT_MODEL_CAPABILITY_CONFIG`) is a listing/filtering signal only — the
call path does not gate a thinking request on it, so an unlisted model is not
rejected, merely absent from a capability-filtered menu. (`adaptiveThinkingModelPrefixes`
is per-model but selects a wire *shape*, not availability.) What the tier axis
guarantees is therefore narrow and exact: a tier selects a model within one
provider and never changes the provider.

Do not add a `'tools'` or `'thinking'` key here, and do not hand-roll a
`resolveModel` + `resolveModelAlias` walk to emulate one — call
`resolveProviderModel` with the tier you want.
