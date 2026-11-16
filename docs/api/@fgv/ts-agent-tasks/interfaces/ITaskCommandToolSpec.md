[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskCommandToolSpec

# Interface: ITaskCommandToolSpec

One registered command a host offers the model as a tool.

## Remarks

The command is looked up in the kind registry when the tools are built — its kind, detail
version and command name must be registered — and the tool's wire schema carries that command's registered
parameter schema. The tool sends the command only to tasks of exactly this kind and detail version.

`name` is the tool's name. It defaults to `task_command_` followed by the command name, with every
character a provider does not accept in a tool name replaced by `_`. It may not be one of the fixed
task tool names, whether or not those tools are offered, and no two command tools may share one: a
clash — including two kinds that register the same command name — refuses the whole tool set when
it is built, and the host names one of them.

`description`, when given, replaces the first sentence of the tool's description; the sentences
that say what the result means are always appended.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-command"></a> `command` | `readonly` | `string` |
| <a id="property-description"></a> `description?` | `readonly` | `string` |
| <a id="property-detailversion"></a> `detailVersion` | `readonly` | `number` |
| <a id="property-kind"></a> `kind` | `readonly` | [`TaskKind`](../type-aliases/TaskKind.md) |
| <a id="property-name"></a> `name?` | `readonly` | `string` |
