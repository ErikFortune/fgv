[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ICreateTaskToolsParams

# Interface: ICreateTaskToolsParams

Parameters for [createTaskTools](../functions/createTaskTools.md).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-budget"></a> `budget?` | `readonly` | [`ITaskToolBudget`](ITaskToolBudget.md) | Output bounds. Defaults to [defaultTaskToolBudget](../variables/defaultTaskToolBudget.md). |
| <a id="property-commands"></a> `commands?` | `readonly` | [`ITaskCommandToolOptions`](ITaskCommandToolOptions.md) | Registered commands to offer as tools. Absent — the default — offers none. |
| <a id="property-logger"></a> `logger?` | `readonly` | [`ILogger`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) | Where the full text of a failure the view or the rendering reports goes. The model is told only the failure's code and a fixed description, never the underlying message, which can carry host text — a projector's error, a storage path, a thrown exception. Without a logger that text is discarded. |
| <a id="property-mutations"></a> `mutations?` | `readonly` | [`ITaskMutationToolOptions`](ITaskMutationToolOptions.md) | Mutation tools to offer beside the read tools. Absent — the default — offers none: the tools are exactly `task_query` and `task_inspect`. |
| <a id="property-renderer"></a> `renderer?` | `readonly` | [`TaskContextRenderer`](../classes/TaskContextRenderer.md) | The renderer every task presentation goes through. Defaults to `TaskContextRenderer.create()`. Its converters also validate the model's query arguments and task ids before the view is asked. Supply one built with the broker's converters when the host's field bounds differ from the defaults, so a task the view returns is never refused by the renderer. |
| <a id="property-stops"></a> `stops?` | `readonly` | [`ITaskStopToolOptions`](ITaskStopToolOptions.md) | Cascade-stop tools to offer. Absent — the default — offers none. |
| <a id="property-view"></a> `view` | `readonly` | [`IBoundTaskView`](IBoundTaskView.md) | The principal-bound view every tool reads through. It carries the principal, its scopes, its authorization and its projector; no tool argument can name or widen any of them. |
