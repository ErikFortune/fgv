[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Entities](../../../README.md) / [Tasks](../README.md) / TaskRefStatus

# Type Alias: TaskRefStatus

> **TaskRefStatus** = `"valid"` \| `"task-not-found"` \| `"missing-variables"` \| `"invalid-params"`

Defined in: [ts-chocolate/src/packlets/entities/tasks/model.ts:133](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/tasks/model.ts#L133)

Validation status for a step's task reference.
Used at load time to mark incomplete references without hard failing.
