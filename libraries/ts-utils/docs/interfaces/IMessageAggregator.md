[**@fgv/ts-utils**](../README.md)

***

[@fgv/ts-utils](../README.md) / IMessageAggregator

# Interface: IMessageAggregator

Simple error aggregator to simplify collecting all errors in
a flow.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="hasmessages"></a> `hasMessages` | `readonly` | `boolean` | Indicates whether any messages have been aggregated. |
| <a id="messages"></a> `messages` | `readonly` | readonly `string`[] | The aggregated messages. |
| <a id="nummessages"></a> `numMessages` | `readonly` | `number` | The number of messages aggregated. |

## Methods

### addMessage()

> **addMessage**(`message`): `this`

Adds a message to the aggregator, if defined.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message` | `string` \| `undefined` | The message to add - pass `undefined` or the empty string to continue without adding a message. |

#### Returns

`this`

***

### addMessages()

> **addMessages**(`messages`): `this`

Adds multiple messages to the aggregator.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `messages` | `string`[] \| `undefined` | the messages to add. |

#### Returns

`this`

***

### toString()

> **toString**(`separator?`): `string`

Returns all messages as a single string joined
using the optionally-supplied `separator`, or
newline if no separator is specified.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `separator?` | `string` | The optional separator used to join strings. |

#### Returns

`string`
