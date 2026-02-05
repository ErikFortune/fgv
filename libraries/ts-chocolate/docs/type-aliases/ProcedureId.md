[**@fgv/ts-chocolate**](../README.md)

***

[@fgv/ts-chocolate](../README.md) / ProcedureId

# Type Alias: ProcedureId

> **ProcedureId** = [`Brand`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`, `"ProcedureId"`\>

Defined in: [ts-chocolate/src/packlets/common/ids.ts:118](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/common/ids.ts#L118)

Globally unique procedure identifier (composite)
Format: "collectionId.baseProcedureId"
Must contain exactly one dot separator
Pattern: /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/
