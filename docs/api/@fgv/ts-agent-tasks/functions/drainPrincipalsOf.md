[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / drainPrincipalsOf

# Function: drainPrincipalsOf()

> **drainPrincipalsOf**(`record`): readonly `string`[]

The principals that may bind a subscription's delivery, as its record stands: the recorded list,
or — for a record written before drain principals existed — its registering principal alone.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `record` | [`ITaskConsumerRecord`](../interfaces/ITaskConsumerRecord.md) |

## Returns

readonly `string`[]
