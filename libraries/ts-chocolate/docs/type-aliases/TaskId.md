[**@fgv/ts-chocolate**](../README.md)

***

[@fgv/ts-chocolate](../README.md) / TaskId

# Type Alias: TaskId

> **TaskId** = [`Brand`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`, `"TaskId"`\>

Defined in: [ts-chocolate/src/packlets/common/ids.ts:127](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/common/ids.ts#L127)

Globally unique task identifier (composite)
Format: "collectionId.baseTaskId"
Must contain exactly one dot separator
Pattern: /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/
