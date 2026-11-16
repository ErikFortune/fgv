[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IAiClientTool

# Interface: IAiClientTool\<TParams\>

A client-defined tool: configuration + execution callback pair.

## Remarks

The `execute` callback receives typed `TParams` (already validated by
`config.parametersSchema.validate()`) and returns a `Promise<Result<unknown>>`.
Thrown errors are caught via `captureAsyncResult` in the round-trip helper.

The optional second parameter carries the turn's context (its abort signal). A tool that
ignores it may declare only the first parameter.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tparams"></a> `TParams` | `unknown` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-config"></a> `config` | `readonly` | [`IAiClientToolConfig`](IAiClientToolConfig.md)\<`TParams`\> | The tool's configuration (name, description, parameters schema). |
| <a id="property-execute"></a> `execute` | `readonly` | (`args`, `context?`) => `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`unknown`\>\> | Execute the tool with validated parameters. |
