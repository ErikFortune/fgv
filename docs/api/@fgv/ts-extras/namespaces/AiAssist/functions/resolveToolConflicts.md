[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / resolveToolConflicts

# Function: resolveToolConflicts()

> **resolveToolConflicts**(`descriptor`, `serverTools`, `clientTools`, `policy?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IAiResolvedToolConflicts`](../interfaces/IAiResolvedToolConflicts.md)\>

Applies a provider's declared server-tool/client-tool exclusions to one request's
tools.

## Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `descriptor` | [`IAiProviderDescriptor`](../interfaces/IAiProviderDescriptor.md) | `undefined` | The provider descriptor carrying the declared exclusions. |
| `serverTools` | readonly [`IAiWebSearchToolConfig`](../interfaces/IAiWebSearchToolConfig.md)[] \| `undefined` | `undefined` | The server tools the caller wants to send, if any. |
| `clientTools` | readonly [`IAiClientTool`](../interfaces/IAiClientTool.md)\<`unknown`\>[] | `undefined` | The client tools the caller wants to send. |
| `policy?` | [`AiToolConflictPolicy`](../type-aliases/AiToolConflictPolicy.md) | `defaultToolConflictPolicy` | What to do about a conflict. Defaults to [AiAssist.defaultToolConflictPolicy](../variables/defaultToolConflictPolicy.md). |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IAiResolvedToolConflicts`](../interfaces/IAiResolvedToolConflicts.md)\>

`Success` with the surviving tools and a report, or `Failure` naming the
conflict when `policy` is `'fail'`.

## Remarks

The generic half of a rule that used to be a provider-identity branch. The
constraint is declared on the descriptor
(`IAiProviderDescriptor.serverToolsExclusiveWithClientTools`); this reads it
and applies `policy`, so no consumer needs to know *which* provider has the limit
or *what* the limit is. A descriptor that declares nothing, or a request with no
client tools, or one with no server tools, passes through untouched with an empty
report — the exclusion is about the *combination*, and either half alone is legal.

Sibling to [AiAssist.resolveEffectiveTools](resolveEffectiveTools.md) rather than an extension of it:
that function filters server tools against what the provider supports at all and
is used by every completion path, most of which have no client tools to weigh.
