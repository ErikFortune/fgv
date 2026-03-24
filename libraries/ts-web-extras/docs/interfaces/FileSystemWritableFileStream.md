[**@fgv/ts-web-extras**](../README.md)

***

[@fgv/ts-web-extras](../README.md) / FileSystemWritableFileStream

# Interface: FileSystemWritableFileStream

Writable file stream interface

## Extends

- `WritableStream`

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="locked"></a> `locked` | `readonly` | `boolean` | The **`locked`** read-only property of the WritableStream interface returns a boolean indicating whether the `WritableStream` is locked to a writer. [MDN Reference](https://developer.mozilla.org/docs/Web/API/WritableStream/locked) |

## Methods

### abort()

> **abort**(`reason?`): `Promise`\<`void`\>

The **`abort()`** method of the WritableStream interface aborts the stream, signaling that the producer can no longer successfully write to the stream and it is to be immediately moved to an error state, with any queued writes discarded.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/WritableStream/abort)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `reason?` | `any` |

#### Returns

`Promise`\<`void`\>

#### Inherited from

`WritableStream.abort`

***

### close()

> **close**(): `Promise`\<`void`\>

The **`close()`** method of the WritableStream interface closes the associated stream.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/WritableStream/close)

#### Returns

`Promise`\<`void`\>

#### Inherited from

`WritableStream.close`

***

### getWriter()

> **getWriter**(): `WritableStreamDefaultWriter`\<`any`\>

The **`getWriter()`** method of the WritableStream interface returns a new instance of WritableStreamDefaultWriter and locks the stream to that instance.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/WritableStream/getWriter)

#### Returns

`WritableStreamDefaultWriter`\<`any`\>

#### Inherited from

`WritableStream.getWriter`

***

### seek()

> **seek**(`position`): `Promise`\<`void`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `position` | `number` |

#### Returns

`Promise`\<`void`\>

***

### truncate()

> **truncate**(`size`): `Promise`\<`void`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `size` | `number` |

#### Returns

`Promise`\<`void`\>

***

### write()

> **write**(`data`): `Promise`\<`void`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `data` | `string` \| `BufferSource` \| `Blob` |

#### Returns

`Promise`\<`void`\>
