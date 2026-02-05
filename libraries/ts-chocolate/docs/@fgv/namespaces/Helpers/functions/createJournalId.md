[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Helpers](../README.md) / createJournalId

# Function: createJournalId()

> **createJournalId**(`collectionId`, `baseId`): [`JournalId`](../../../../type-aliases/JournalId.md)

Defined in: [ts-chocolate/src/packlets/common/helpers.ts:167](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/common/helpers.ts#L167)

Creates a composite JournalId from collection ID and base journal ID

## Parameters

### collectionId

[`CollectionId`](../../../../type-aliases/CollectionId.md)

The collection identifier (e.g., "user-journals")

### baseId

[`BaseJournalId`](../../../../type-aliases/BaseJournalId.md)

The base journal identifier

## Returns

[`JournalId`](../../../../type-aliases/JournalId.md)

Composite journal ID in format "collectionId.baseJournalId"
