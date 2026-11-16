[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / StructuredOutputEnforcement

# Type Alias: StructuredOutputEnforcement

> **StructuredOutputEnforcement** = `"none"` \| `"json-mode"` \| `"schema"` \| `"tool-forced"`

Which constraint the provider was **asked** to apply to this response.

## Remarks

Three questions hide inside *"did it honour my schema"*, and they have different
owners:

| question | answerable by |
|---|---|
| did we send a constraint? | this client, at request-build time |
| which constraint did the provider apply? | this client, from the resolved model's capability |
| does *this response* conform to my shape? | the caller's converter, and nothing else |

This type answers the first two and deliberately not the third. Reporting
conformance would mean re-validating against the caller's own schema to
re-derive an answer the caller already holds.

- `'none'` — nothing was sent; the resolved model declares no capability.
- `'json-mode'` — syntactically valid JSON is guaranteed; the shape is not.
- `'schema'` — generation was constrained to the supplied schema, and the reply
  is the model's own text. Includes Anthropic's `output_config.format`.
  **Folded constraints are not provider-enforced:** a constraint keyword the
  provider does not document (Anthropic JSON outputs refuse `minimum` and
  `maxLength`, for example) is removed from the wire schema and stated in the
  node's description instead, so the provider constrains the reply's shape but
  not that value. Your schema's validator still enforces it, and a reply that
  breaks it fails validation.
- `'tool-forced'` — Anthropic-style forced tool use; the shape comes from the
  forced tool's input schema, and `content` is the re-serialized tool input.
