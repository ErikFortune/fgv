[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ExternalCommandResult

# Type Alias: ExternalCommandResult\<TDetails\>

> **ExternalCommandResult**\<`TDetails`\> = `Exclude`\<[`SourceCommandResult`](SourceCommandResult.md), \{ `state`: `"applied"`; \}\> \| \{ `observation`: [`ExternalProjection`](ExternalProjection.md)\<`TDetails`\>; `state`: `"applied"`; \}

A typed command answer: `applied` carries a typed projection.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-tdetails"></a> `TDetails` |
