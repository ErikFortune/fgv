[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Entities](../README.md) / IInlineTaskEntity

# Interface: IInlineTaskEntity

Defined in: [ts-chocolate/src/packlets/entities/tasks/model.ts:176](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/tasks/model.ts#L176)

An inline task defined directly in a procedure step.
Contains a full ITaskData definition with a synthetic baseId (derived from procedure/step)
plus params for rendering.

## Properties

### params

> `readonly` **params**: `Record`\<`string`, `unknown`\>

Defined in: [ts-chocolate/src/packlets/entities/tasks/model.ts:185](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/tasks/model.ts#L185)

Parameter values for rendering the template

***

### task

> `readonly` **task**: [`IRawTaskEntity`](IRawTaskEntity.md)

Defined in: [ts-chocolate/src/packlets/entities/tasks/model.ts:180](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/tasks/model.ts#L180)

Full task definition with synthetic baseId (e.g., `procedureId.step-N`)
