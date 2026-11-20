[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / anthropicEffortToBudgetTokens

# Function: anthropicEffortToBudgetTokens()

> **anthropicEffortToBudgetTokens**(`effort`): `number`

Maps Anthropic effort level to the `thinking.budget_tokens` integer that the
Anthropic API requires when `thinking.type === 'enabled'`.

Policy: low = 2048, medium = 8192, high = 24000, max = 32000. The lower three
align with the Anthropic-published minimum-meaningful budget, a mid-range
default, and a "deep thinking" allotment respectively. `max` is the deepest
allotment and stays within typical model limits.

Only reached for models outside the Claude 5 family — the adaptive-thinking path
sends no budget at all.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `effort` | `NonNullable`\<`"max"` \| `"high"` \| `"low"` \| `"medium"` \| `undefined`\> |

## Returns

`number`
