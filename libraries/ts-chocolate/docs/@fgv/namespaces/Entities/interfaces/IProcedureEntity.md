[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Entities](../README.md) / IProcedureEntity

# Interface: IProcedureEntity

Defined in: [ts-chocolate/src/packlets/entities/procedures/model.ts:108](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/procedures/model.ts#L108)

Represents a procedure for making chocolate confections

## Properties

### baseId

> `readonly` **baseId**: [`BaseProcedureId`](../../../../type-aliases/BaseProcedureId.md)

Defined in: [ts-chocolate/src/packlets/entities/procedures/model.ts:112](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/procedures/model.ts#L112)

Base procedure identifier (unique within source)

***

### category?

> `readonly` `optional` **category**: [`ProcedureType`](../../../../type-aliases/ProcedureType.md)

Defined in: [ts-chocolate/src/packlets/entities/procedures/model.ts:129](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/procedures/model.ts#L129)

Optional procedure category this procedure applies to.
Can be a filling category (ganache, caramel, gianduja), confection type, or 'other'.
If set, procedure is category-specific; if not, it's general/reusable.

***

### description?

> `readonly` `optional` **description**: `string`

Defined in: [ts-chocolate/src/packlets/entities/procedures/model.ts:122](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/procedures/model.ts#L122)

Optional description of the procedure

***

### name

> `readonly` **name**: `string`

Defined in: [ts-chocolate/src/packlets/entities/procedures/model.ts:117](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/procedures/model.ts#L117)

Human-readable name of the procedure

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/entities/procedures/model.ts:144](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/procedures/model.ts#L144)

Optional categorized notes about the procedure

***

### steps

> `readonly` **steps**: readonly [`IProcedureStepEntity`](IProcedureStepEntity.md)[]

Defined in: [ts-chocolate/src/packlets/entities/procedures/model.ts:134](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/procedures/model.ts#L134)

Steps of the procedure in order

***

### tags?

> `readonly` `optional` **tags**: readonly `string`[]

Defined in: [ts-chocolate/src/packlets/entities/procedures/model.ts:139](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/procedures/model.ts#L139)

Optional tags for categorization and search
