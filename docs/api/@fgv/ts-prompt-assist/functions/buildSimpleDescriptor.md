[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / buildSimpleDescriptor

# Function: buildSimpleDescriptor()

> **buildSimpleDescriptor**(`params`): [`IPromptDescriptor`](../interfaces/IPromptDescriptor.md)

Builds a fully-shaped [IPromptDescriptor](../interfaces/IPromptDescriptor.md) for the trivial chat
case: one body, no slots, free-text output. Cuts the boilerplate of
spelling out `schemaVersion`, `slots: []`, and
`output: \{ kind: 'free-text' \}` at every seed call site (per F2).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `params` | [`IBuildSimpleDescriptorParams`](../interfaces/IBuildSimpleDescriptorParams.md) |

## Returns

[`IPromptDescriptor`](../interfaces/IPromptDescriptor.md)

## Remarks

Intentionally limited to the free-text-output shape. The descriptor's
`output.kind` is load-bearing — `PromptLibrary.resolveJsonOutput` and
`resolveFreeTextOutput` both runtime-verify it against the call
path — so silently defaulting `output` for a JSON-output prompt
would route the consumer into the wrong dispatcher. For JSON-output
prompts, author the full [IPromptDescriptor](../interfaces/IPromptDescriptor.md) shape directly so
the `output.converterId` discriminator is explicit at the call site.
