[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Entities](../../../README.md) / [Tasks](../README.md) / ITaskRefValidation

# Interface: ITaskRefValidation

Defined in: [ts-chocolate/src/packlets/entities/tasks/model.ts:139](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/tasks/model.ts#L139)

Result of validating a task reference against a task definition.

## Properties

### extraVariables

> `readonly` **extraVariables**: readonly `string`[]

Defined in: [ts-chocolate/src/packlets/entities/tasks/model.ts:158](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/tasks/model.ts#L158)

Variables provided but not required (warning only)

***

### isValid

> `readonly` **isValid**: `boolean`

Defined in: [ts-chocolate/src/packlets/entities/tasks/model.ts:143](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/tasks/model.ts#L143)

Whether the reference is valid (all required variables provided)

***

### messages

> `readonly` **messages**: readonly `string`[]

Defined in: [ts-chocolate/src/packlets/entities/tasks/model.ts:163](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/tasks/model.ts#L163)

Human-readable validation messages

***

### missingVariables

> `readonly` **missingVariables**: readonly `string`[]

Defined in: [ts-chocolate/src/packlets/entities/tasks/model.ts:153](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/tasks/model.ts#L153)

Variables that are missing from params

***

### taskFound

> `readonly` **taskFound**: `boolean`

Defined in: [ts-chocolate/src/packlets/entities/tasks/model.ts:148](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/tasks/model.ts#L148)

True if the referenced task was found
