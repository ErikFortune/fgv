[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskMutationToolOptions

# Interface: ITaskMutationToolOptions

The mutation tools a host opts into, and what they need to run.

## Remarks

Opting in makes tools available to the model; it authorizes nothing. Every call is authorized by
`writer`'s policy when it runs, exactly as a direct call to the writer would be.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-enable"></a> `enable` | `readonly` | readonly [`TaskMutationToolGroup`](../type-aliases/TaskMutationToolGroup.md)[] | The tool groups to offer. An empty list offers none. |
| <a id="property-environment"></a> `environment` | `readonly` | `Pick`\<[`ITaskEnvironment`](ITaskEnvironment.md), `"newTaskId"` \| `"newOperationId"`\> | Mints each call's operation id, and a new task's id. The model never supplies either. Usually the host's `TaskEnvironment`. |
| <a id="property-writer"></a> `writer` | `readonly` | [`IBoundTaskWriter`](IBoundTaskWriter.md) | The writer every mutation goes through. It must be the very object passed as `view`: the revision the model reads is then the revision the writer checks, under one principal, one set of scopes and one policy. |
