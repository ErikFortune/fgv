[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskAuthorization

# Interface: ITaskAuthorization

A host's current policy for one principal.

## Remarks

Created by the host for one principal: there is no principal or scope override anywhere in a
request. `check` may be asynchronous, so it runs outside the serialized writer; the broker
captures `policyEpoch()` with each check and refuses to commit if the epoch has changed by the
time it holds the writer. A check that fails or throws is a denial.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-policyidentity"></a> `policyIdentity?` | `readonly` | `string` | A stable, host-chosen name for **which** policy this is — the same for every instance of one consumer's policy, different for any other — when the host gives it one. **Remarks** Read once, when a binding is made, and converted (one non-empty line). The broker uses it in one place: `IBoundTaskDelivery.disposeWithheld` ends obligations only through a binding whose policy carries the identity the subscription recorded (`ISubscribeRequest.policyIdentity`), so a binding built with some other, narrower policy cannot decide what counts as withheld. It is a name, not a credential: the host constructs every binding, and a policy that claims another policy's identity is a host defect the broker cannot see. |

## Methods

### check()

> **check**(`request`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`ITaskAccessRequest`](ITaskAccessRequest.md) |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>\>

***

### policyEpoch()

> **policyEpoch**(): `string`

#### Returns

`string`
