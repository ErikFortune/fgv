[**@fgv/ts-chocolate**](../README.md)

***

[@fgv/ts-chocolate](../README.md) / ConfectionId

# Type Alias: ConfectionId

> **ConfectionId** = [`Brand`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`, `"ConfectionId"`\>

Defined in: [ts-chocolate/src/packlets/common/ids.ts:188](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/common/ids.ts#L188)

Globally unique confection identifier (composite)
Format: "collectionId.baseConfectionId"
Must contain exactly one dot separator
Pattern: /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/
