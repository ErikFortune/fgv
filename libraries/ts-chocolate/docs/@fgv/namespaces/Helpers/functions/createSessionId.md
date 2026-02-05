[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Helpers](../README.md) / createSessionId

# Function: createSessionId()

> **createSessionId**(`collectionId`, `baseId`): [`SessionId`](../../../../type-aliases/SessionId.md)

Defined in: [ts-chocolate/src/packlets/common/helpers.ts:213](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/common/helpers.ts#L213)

Creates a composite [SessionId](../../../../type-aliases/SessionId.md) from [collection ID](../../../../type-aliases/CollectionId.md) and
[base session ID](../../../../type-aliases/BaseSessionId.md).

## Parameters

### collectionId

[`CollectionId`](../../../../type-aliases/CollectionId.md)

The collection identifier (e.g., "user-sessions")

### baseId

[`BaseSessionId`](../../../../type-aliases/BaseSessionId.md)

The base session identifier

## Returns

[`SessionId`](../../../../type-aliases/SessionId.md)

Composite session ID in format "collectionId.baseSessionId"
