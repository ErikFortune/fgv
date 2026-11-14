[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IPromptSafetyPolicy

# Interface: IPromptSafetyPolicy

Safety policy supplied to [PromptLibrary.create](../classes/PromptLibrary.md#create).

## Remarks

All fields are optional. When omitted, the library applies no global length
cap (per-slot / per-descriptor caps still apply), runs no screeners, and adds
no anti-jailbreak preface. The length cap and the anti-jailbreak preface stay
policy-level primitives — they are structurally distinct from per-slot-value
screening (pre-screen and post-render respectively) and are not expressed as
[IScreener](IScreener.md)s.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-antijailbreakpreface"></a> `antiJailbreakPreface?` | `readonly` | (`descriptor`) => [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`string`\> | Optional post-render seam: consumer-supplied text prepended (with a newline separator) to the body AFTER Mustache substitution completes. The library ships no default content. Invoked with the descriptor; the returned text is NOT subject to template substitution — it frames the rendered prompt. |
| <a id="property-antijailbreakprefacestability"></a> `antiJailbreakPrefaceStability?` | `readonly` | [`PromptCacheStability`](../type-aliases/PromptCacheStability.md) | Declared cache stability for the `antiJailbreakPreface` text. Default `'frozen'`, matching `analyzePromptCacheStability`'s prior unconditional default for a `'preface'` section. **Remarks** `antiJailbreakPreface` is a consumer-supplied callback invoked fresh on every resolve, not checked-in file content — unlike a `'template'` section, whose D2 refutation (design.md §9) gives the library resolve-time evidence to downgrade a wrong `'frozen'` claim. A callback can vary its output (per-descriptor policy text, a rotated warning, anything short of a pure function of `descriptor`) with no trace data recording that it did, so there is no refutation path for a preface that breaks the assumption (design.md §15, OQ-7). Neither blanket default is safe: `'frozen'` risks a silent, permanent cache miss on a genuinely dynamic preface (the design's worst case, §1); `'per-request'` would report `'cache-hostile-ordering'` on every resolve with a preface followed by any more-stable content, which is the common, correct shape (fixed framing text, then stable instructions). Declaring it here — the same call-site-style override the annotation vocabulary already gives every other stability claim (design.md §4) — lets the policy author who actually knows whether their callback is deterministic say so, rather than the library guessing on their behalf. Defaulting to `'frozen'` preserves C2's shipped behavior for every existing caller. |
| <a id="property-defaultmaxlength"></a> `defaultMaxLength?` | `readonly` | `number` | Fallback maximum length applied when neither the slot's `maxLength` nor the descriptor's `safeguards.defaultMaxLength` is set. When omitted, no global cap applies. |
| <a id="property-screeners"></a> `screeners?` | `readonly` | readonly [`IScreener`](IScreener.md)[] | Screeners run against each merged slot value (post-binding, pre-render), sequentially in declaration order. See [IScreener](IScreener.md). Use [createPatternScreener](../functions/createPatternScreener.md) for regex-based injection screening. |
