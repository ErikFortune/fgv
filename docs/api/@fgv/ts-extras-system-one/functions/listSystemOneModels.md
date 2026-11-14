[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-system-one](../README.md) / listSystemOneModels

# Function: listSystemOneModels()

> **listSystemOneModels**(`client`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`ModelCard`](../interfaces/ModelCard.md)[]\>\>

Lists the models the server offers.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `client` | [`ISystemOneClient`](../interfaces/ISystemOneClient.md) | A client from [createSystemOneClient](createSystemOneClient.md). |

## Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`ModelCard`](../interfaces/ModelCard.md)[]\>\>

The model cards, or a failure whose message starts with the reason
[askSystemOne](askSystemOne.md) would have classified, with the status and request id when there are any.
