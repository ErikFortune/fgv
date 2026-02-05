[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Entities](../../../README.md) / [Procedures](../README.md) / IProcedureStepValidation

# Interface: IProcedureStepValidation

Defined in: [ts-chocolate/src/packlets/entities/procedures/model.ts:76](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/procedures/model.ts#L76)

Runtime validation state for a procedure step.
This is computed at render/use time based on which TasksLibrary is available.

## Properties

### messages

> `readonly` **messages**: readonly `string`[]

Defined in: [ts-chocolate/src/packlets/entities/procedures/model.ts:89](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/procedures/model.ts#L89)

Validation messages describing any issues

***

### status

> `readonly` **status**: [`TaskRefStatus`](../../Tasks/type-aliases/TaskRefStatus.md)

Defined in: [ts-chocolate/src/packlets/entities/procedures/model.ts:84](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/procedures/model.ts#L84)

Validation status for task reference
- 'valid': Task found and all required variables provided
- 'task-not-found': Referenced task not found in TasksLibrary
- 'missing-variables': Task found but required variables missing from params
- 'invalid-params': Params validation failed
