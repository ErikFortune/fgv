[Home](../../README.md) > [AiAssist](../README.md) > extractJsonText

# Variable: extractJsonText

Default AiAssist.JsonTextExtractor | extractor for LLM responses. Tolerates:

- Leading/trailing whitespace and a leading byte-order mark.
- Markdown code fences (with or without a language tag).
- Conversational preamble before the first `{` or `[`.
- Trailing prose after the matched closing `}` or `]`.

Out of scope: repairing malformed JSON, handling smart quotes, etc.

When an object or array opens but never closes before the end of input —
the shape a response truncated by a token cap leaves behind — the failure
names that specifically (distinct from the generic "no JSON-shaped
substring found" for input that never looked like JSON at all) and points
at `IAiCompletionResponse.truncated` and the `maxTokens` request option as
the likely cause and fix.

## Type

`JsonTextExtractor`
