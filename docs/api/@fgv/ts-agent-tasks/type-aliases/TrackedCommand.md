[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / TrackedCommand

# Type Alias: TrackedCommand

> **TrackedCommand** = \{ `command`: `"start"` \| `"resume"`; `parameters`: `Readonly`\<`Record`\<`string`, `never`\>\>; \} \| \{ `command`: `"wait"`; `parameters`: \{ `reason`: [`IWaitingReason`](../interfaces/IWaitingReason.md); \}; \} \| \{ `command`: `"pause"`; `parameters`: \{ `reason`: [`ITaskReason`](../interfaces/ITaskReason.md); \}; \} \| \{ `command`: `"succeed"`; `parameters`: \{ `outcome`: [`ITaskOutcome`](../interfaces/ITaskOutcome.md); \}; \} \| \{ `command`: `"fail"` \| `"cancel"`; `parameters`: \{ `outcome?`: [`ITaskOutcome`](../interfaces/ITaskOutcome.md); `reason`: [`ITaskReason`](../interfaces/ITaskReason.md); \}; \} \| \{ `command`: `"set-title"`; `parameters`: \{ `title`: `string`; \}; \} \| \{ `command`: `"set-description"`; `parameters`: \{ `description?`: `string`; \}; \} \| \{ `command`: `"set-progress"`; `parameters`: \{ `progress?`: [`ITaskProgress`](../interfaces/ITaskProgress.md); \}; \} \| \{ `command`: `"set-attention"`; `parameters`: \{ `attention`: `ReadonlyArray`\<[`ITaskReference`](../interfaces/ITaskReference.md)\>; \}; \}

One `fgv.tracked@1` command with its typed parameters, discriminated on `command`.

## Remarks

T1 declared the command names; these are their parameter shapes. `set-description` and
`set-progress` clear their field when the value is omitted. A terminal command carries the payload its terminal state
requires: `succeed` an outcome, `fail` and `cancel` a reason.
