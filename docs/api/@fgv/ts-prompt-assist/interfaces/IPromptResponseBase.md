[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IPromptResponseBase

# Interface: IPromptResponseBase

Discriminator base for the consumer's response union type parameter
(`TResponse`). Every member of the consumer's `TResponse` union must
carry a string-literal `kind` field; the JSON output pipeline uses
that discriminator to dispatch the registered Converter and to narrow
each validator's `appliesTo`.

## Remarks

Declared as a named interface (rather than the inline `\{ kind: string \}`
lower bound that previously appeared at every parameterized signature)
so the discriminator role has a single TSDoc-attach point and so
`TResponse extends IPromptResponseBase` reads as a domain constraint
rather than an ad-hoc shape.

Consumers extend it as a discriminated union, e.g.
`type MyResponses = \{ kind: 'classify'; label: string \} | \{ kind: 'extract'; data: Record<string, string> \}`.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-kind"></a> `kind` | `readonly` | `string` | String-literal discriminator that the JSON pipeline dispatches on. |
