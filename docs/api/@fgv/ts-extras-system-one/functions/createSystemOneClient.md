[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-system-one](../README.md) / createSystemOneClient

# Function: createSystemOneClient()

> **createSystemOneClient**(`params`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ISystemOneClient`](../interfaces/ISystemOneClient.md)\>

Creates a client for one System-1 server and model.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`ICreateSystemOneClientParams`](../interfaces/ICreateSystemOneClientParams.md) | The server, model, key and options. |

## Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ISystemOneClient`](../interfaces/ISystemOneClient.md)\>

The client, or a failure naming the invalid parameter; every failure is
`invalid-request`, including parameters of the wrong shape from a JavaScript caller.

## Remarks

The server URL, model, key and log level are always passed to the SDK, so no `TYPESAFE_*`
environment variable can take effect. There is no per-call URL.
