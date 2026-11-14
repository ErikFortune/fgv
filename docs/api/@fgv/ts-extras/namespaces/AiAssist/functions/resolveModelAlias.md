[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / resolveModelAlias

# Function: resolveModelAlias()

> **resolveModelAlias**(`descriptor`, `model`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

Resolves a single (possibly-aliased) model string against a provider descriptor.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `descriptor` | [`IAiProviderDescriptor`](../interfaces/IAiProviderDescriptor.md) | The provider descriptor whose `aliases` map is consulted. |
| `model` | `string` | The (possibly-aliased) model string to resolve. |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

`Result` with the concrete provider model id, or a failure.

## Remarks

Resolution rules:
1. No leading [MODEL\_ALIAS\_SIGIL](../variables/MODEL_ALIAS_SIGIL.md) → raw provider id, returned verbatim.
2. Leading sigil + registered in `descriptor.aliases` → the registered target,
   which is itself resolved — so a chain of `@` aliases is followed until a
   non-`@` (concrete provider) id is reached. The canonical case is a single
   hop (an fgv alias targeting a provider-native alias), but longer chains
   resolve too.
3. Leading sigil + unregistered → fails loudly, naming the provider and alias.

An `@`→`@` cycle is guarded by a visited-set and fails rather than exhausting
the stack.
