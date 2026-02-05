[**@fgv/ts-chocolate**](../README.md)

***

[@fgv/ts-chocolate](../README.md) / ConfectionId

# Type Alias: ConfectionId

> **ConfectionId** = [`Brand`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`, `"ConfectionId"`\>

Defined in: [ts-chocolate/src/packlets/common/ids.ts:188](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/common/ids.ts#L188)

Globally unique confection identifier (composite)
Format: "collectionId.baseConfectionId"
Must contain exactly one dot separator
Pattern: /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/
