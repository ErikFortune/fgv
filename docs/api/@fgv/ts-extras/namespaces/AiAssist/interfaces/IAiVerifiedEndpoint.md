[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IAiVerifiedEndpoint

# Interface: IAiVerifiedEndpoint

A host's assertion that a caller-supplied `endpoint` is the descriptor's own provider, so a
request sent there has its schemas adapted with that provider's keyword table rather than the
conservative one.

## Remarks

Every keyword table cites a provider's documentation, and that documentation describes the
provider's own endpoint. An `endpoint` override therefore gets
`JsonSchema.unverifiedWireSchemaKeywords` by default — a gateway, LiteLLM or vLLM speaks the wire
format without promising its keyword support. Pass this only for an endpoint you know reaches
the provider itself (a regional host, an egress proxy, a pass-through gateway that forwards the
body unchanged).

It is honoured only when **all** of these hold, and otherwise ignored, which leaves the
conservative table (always safe):
- an `endpoint` is set — with none, the request already goes to the provider's own endpoint;
- `verified` is the literal `true`;
- `providerId` is the descriptor's own `id`. The assertion names the provider so a stale or
  copied setting cannot silently vouch for a different one.

Honoured, the endpoint is treated exactly as the provider's own, including the rule that an
OpenAI fine-tuned (`ft:`) model gets the conservative table.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-providerid"></a> `providerId` | `readonly` | [`AiProviderId`](../type-aliases/AiProviderId.md) | The provider the endpoint is asserted to be — must equal the descriptor's `id`. |
| <a id="property-verified"></a> `verified` | `readonly` | `true` | The assertion itself; only the literal `true` is honoured. |
