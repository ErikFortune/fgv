[**@fgv/ts-chocolate**](../README.md)

***

[@fgv/ts-chocolate](../README.md) / ProcedureId

# Type Alias: ProcedureId

> **ProcedureId** = [`Brand`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`, `"ProcedureId"`\>

Defined in: [ts-chocolate/src/packlets/common/ids.ts:118](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/common/ids.ts#L118)

Globally unique procedure identifier (composite)
Format: "collectionId.baseProcedureId"
Must contain exactly one dot separator
Pattern: /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/
