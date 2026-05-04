[Home](../README.md) > extractJsonText

# Variable: extractJsonText

Default AiAssist.JsonTextExtractor | extractor for LLM responses. Tolerates:

- Leading/trailing whitespace and a leading byte-order mark.
- Markdown code fences (with or without a language tag).
- Conversational preamble before the first `{` or `[`.
- Trailing prose after the matched closing `}` or `]`.

Out of scope: repairing malformed JSON, handling smart quotes, etc.

## Type

`JsonTextExtractor`
