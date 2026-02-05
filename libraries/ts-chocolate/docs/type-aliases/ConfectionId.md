[**@fgv/ts-chocolate**](../README.md)

***

[@fgv/ts-chocolate](../README.md) / ConfectionId

# Type Alias: ConfectionId

> **ConfectionId** = [`Brand`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`, `"ConfectionId"`\>

Defined in: [ts-chocolate/src/packlets/common/ids.ts:188](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/common/ids.ts#L188)

Globally unique confection identifier (composite)
Format: "collectionId.baseConfectionId"
Must contain exactly one dot separator
Pattern: /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/
