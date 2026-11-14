[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / StructuredOutputFallback

# Type Alias: StructuredOutputFallback

> **StructuredOutputFallback** = `"degrade"` \| `"fail"`

What to do when the resolved model cannot apply the requested constraint.

## Remarks

`'degrade'` is the default, and it is only safe **because
`IAiCompletionResponse.structuredOutput` is required** rather than
optional. Degrade-and-tell-me is safe; degrade-silently is the failure this
whole surface exists to remove — so the two decisions are one decision, not
two independent ones.

Reach for `'fail'` when the output is persisted or put on a wire, where an
unconstrained generation that happens to parse is worse than an error because
it is wrong quietly. Leave it at `'degrade'` on paths that are *designed* to
degrade — an extractor that may return nothing, a segmenter that floors to a
mechanical chunker — where a hard failure would make this library less safe
than the code it replaces.
