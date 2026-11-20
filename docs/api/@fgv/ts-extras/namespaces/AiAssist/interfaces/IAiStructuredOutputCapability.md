[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IAiStructuredOutputCapability

# Interface: IAiStructuredOutputCapability

Structured-output capability for a model family within a provider. Used as an
entry in `IAiProviderDescriptor.structuredOutput`.

## Remarks

Deliberately thinner than its `imageGeneration` / `embedding` siblings: it
carries no `supportsX` flags, because what each format can enforce is a
property of the provider's **API surface** rather than of any one model, and a
per-entry declaration of it could only ever disagree with the one in code.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-format"></a> `format` | `readonly` | [`AiStructuredOutputFormat`](../type-aliases/AiStructuredOutputFormat.md) | Wire format used to express the constraint for matching models. |
| <a id="property-modelprefix"></a> `modelPrefix` | `readonly` | `string` | Prefix matched against the resolved completion model id. The empty string is the catch-all and matches every model. When multiple rules' prefixes match a model id, the longest prefix wins; ties are broken by first-encountered. |
