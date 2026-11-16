[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / AiStructuredOutputFormat

# Type Alias: AiStructuredOutputFormat

> **AiStructuredOutputFormat** = `"openai-json-schema"` \| `"openai-responses-format"` \| `"gemini-response-schema"` \| `"anthropic-output-format"` \| `"anthropic-tool-forced"`

Wire format a provider uses to express a structured-output constraint.

## Remarks

Five shapes, not one, and they differ in more than field names: the OpenAI
pair carry the schema in the request body, Gemini carries it inside
`generationConfig`, and Anthropic has two mechanisms that are not
interchangeable:

- `'anthropic-output-format'` — the schema goes in `output_config.format`
  (Anthropic's JSON outputs) and the reply arrives as text. Generation is
  constrained to the schema, so it reports `'schema'` exactly as the OpenAI and
  Gemini formats do.
- `'anthropic-tool-forced'` — the schema becomes a synthetic tool and
  `tool_choice` forces it. The reply arrives as a `tool_use` block, which is why
  it reports the distinct [AiAssist.StructuredOutputEnforcement](StructuredOutputEnforcement.md) value
  `'tool-forced'` rather than a spelling of `'schema'`. Retained for the lines
  that still accept forcing; the lines that return a 400 on a forced
  `tool_choice` declare `'anthropic-output-format'` instead.
