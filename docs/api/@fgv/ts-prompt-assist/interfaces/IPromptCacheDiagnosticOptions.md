[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IPromptCacheDiagnosticOptions

# Interface: IPromptCacheDiagnosticOptions

Caller-supplied inputs to the prompt-cache threshold diagnostic.

## Remarks

There is deliberately no model-keyed registry lookup here — that home
(`design.md` §7) lives in `ts-extras/ai-assist` and serves the emit-path
breakpoint cap, which this package does not touch. This is the second of
the design's two homes for a caching minimum: a per-call override. When
neither home has an answer, the diagnostic reports the measured prefix
size and declines to judge it (R-c) — it never assumes the minimum is
zero.

**The paired `measure` must be a tokenizer.** `IPromptCompositionOptions.measure` accepts any
`(text: string) => number` — a word count or character count is equally valid for other uses of
`IPromptComposition` — but this diagnostic reports its result in tokens and compares it against
`minCacheablePrefixTokens`, which is only meaningful when `measure` actually counts tokens. A
non-token measure produces a verdict labeled in the wrong unit, not a caught error: this
diagnostic has no way to tell what `measure` counts.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-mincacheableprefixtokens"></a> `minCacheablePrefixTokens?` | `readonly` | `number` | Minimum cacheable prefix, in tokens, to judge the diagnostic against. Omitted means unknown. |
