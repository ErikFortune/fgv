[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / prepareTaskPrompt

# Function: prepareTaskPrompt()

> **prepareTaskPrompt**(`params`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskPromptHandoff`](../interfaces/ITaskPromptHandoff.md)\>\>

Prepares a delivery's context, resolves and checks the prompt that carries it, and returns a
handoff that acknowledges only against the text that was sent.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `params` | [`IPrepareTaskPromptParams`](../interfaces/IPrepareTaskPromptParams.md) |

## Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskPromptHandoff`](../interfaces/ITaskPromptHandoff.md)\>\>

## Remarks

If the prompt fails any check of [checkTaskPrompt](checkTaskPrompt.md) — the task slot dropped, overridden,
truncated, repeated or moved, the composition unavailable, a cache finding unhandled — the
delivery's manifest is abandoned before this returns, so the receipt it issued is
unacknowledgeable, and the failure is classified `invalid`. Nothing here acknowledges anything:
the delivery's obligations stay owed until the host calls the handoff's `acknowledge`.
