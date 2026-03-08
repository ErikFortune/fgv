[**@fgv/ts-utils**](../README.md)

***

[@fgv/ts-utils](../README.md) / MessageAggregator

# Class: MessageAggregator

A simple error aggregator to simplify collecting and reporting all errors in
a flow.

## Implements

- [`IMessageAggregator`](../interfaces/IMessageAggregator.md)

## Constructors

### Constructor

> **new MessageAggregator**(`errors?`): `MessageAggregator`

Constructs a new ErrorAggregator with an
optionally specified initial set of error messages.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `errors?` | `string`[] | optional array of errors to be included in the aggregation. |

#### Returns

`MessageAggregator`

## Accessors

### hasMessages

#### Get Signature

> **get** **hasMessages**(): `boolean`

Indicates whether any messages have been aggregated.

##### Returns

`boolean`

Indicates whether any messages have been aggregated.

#### Implementation of

[`IMessageAggregator`](../interfaces/IMessageAggregator.md).[`hasMessages`](../interfaces/IMessageAggregator.md#hasmessages)

***

### messages

#### Get Signature

> **get** **messages**(): `string`[]

The aggregated messages.

##### Returns

`string`[]

The aggregated messages.

#### Implementation of

[`IMessageAggregator`](../interfaces/IMessageAggregator.md).[`messages`](../interfaces/IMessageAggregator.md#messages)

***

### numMessages

#### Get Signature

> **get** **numMessages**(): `number`

The number of messages aggregated.

##### Returns

`number`

The number of messages aggregated.

#### Implementation of

[`IMessageAggregator`](../interfaces/IMessageAggregator.md).[`numMessages`](../interfaces/IMessageAggregator.md#nummessages)

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

#### Implementation of

[`IMessageAggregator`](../interfaces/IMessageAggregator.md).[`addMessage`](../interfaces/IMessageAggregator.md#addmessage)

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

#### Implementation of

[`IMessageAggregator`](../interfaces/IMessageAggregator.md).[`addMessages`](../interfaces/IMessageAggregator.md#addmessages)

***

### returnOrReport()

> **returnOrReport**\<`T`\>(`result`, `separator?`): [`Result`](../type-aliases/Result.md)\<`T`\>

If any error messages have been aggregated, returns
[Failure\<T\>](Failure.md) with the aggregated
messages concatenated using the optionally-supplied
separator, or newline.   If the supplied [Result\<T\>](../type-aliases/Result.md)
contains an error message that has not already been aggregated,
it will be included in the aggregated messages.

If no error messages have been aggregated, returns
the supplied [Result\<T\>](../type-aliases/Result.md).

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `result` | [`Result`](../type-aliases/Result.md)\<`T`\> | The [Result\<T\>](../type-aliases/Result.md) to be returned if no messages have been aggregated. |
| `separator?` | `string` | Optional string separator used to construct the error message. |

#### Returns

[`Result`](../type-aliases/Result.md)\<`T`\>

[Failure\<T\>](Failure.md) with an aggregated message
if any error messages were collected, the supplied
[Result\<T\>](../type-aliases/Result.md) otherwise.

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

#### Implementation of

[`IMessageAggregator`](../interfaces/IMessageAggregator.md).[`toString`](../interfaces/IMessageAggregator.md#tostring)
