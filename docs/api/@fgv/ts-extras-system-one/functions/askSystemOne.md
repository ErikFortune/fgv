[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-system-one](../README.md) / askSystemOne

# Function: askSystemOne()

> **askSystemOne**\<`Q`\>(`client`, `request`): `Promise`\<[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ISystemOneAnswer`](../interfaces/ISystemOneAnswer.md)\<`Q`\>, `"input-over-limit"` \| `"invalid-request"` \| `"unauthorized"` \| `"rate-limited"` \| `"server"` \| `"connection"` \| `"timeout"` \| `"aborted"` \| `"invalid-response"`\>\>

Asks a System-1 server the given questions about a state.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-q"></a> `Q` *extends* [`Questions`](../interfaces/Questions.md) |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `client` | [`ISystemOneClient`](../interfaces/ISystemOneClient.md) | A client from [createSystemOneClient](createSystemOneClient.md). |
| `request` | [`ISystemOneRequest`](../interfaces/ISystemOneRequest.md)\<`Q`\> | The state, the questions, the input bound and an optional signal. |

## Returns

`Promise`\<[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ISystemOneAnswer`](../interfaces/ISystemOneAnswer.md)\<`Q`\>, `"input-over-limit"` \| `"invalid-request"` \| `"unauthorized"` \| `"rate-limited"` \| `"server"` \| `"connection"` \| `"timeout"` \| `"aborted"` \| `"invalid-response"`\>\>

The validated answer and its meta, or a failure whose detail is the reason.

## Remarks

In order: the input bound (unless `'unchecked'`), with no request made when it refuses; the
call; failure classification; validation of the response against the request's own questions;
and projection, which drops `confidence` and any field the SDK does not declare.
