[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Editing](../README.md) / IValidationReport

# Interface: IValidationReport

Defined in: [ts-chocolate/src/packlets/editing/model.ts:174](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/editing/model.ts#L174)

Validation report with detailed field-level errors.
Provides comprehensive validation feedback for entity data.

## Properties

### fieldErrors

> `readonly` **fieldErrors**: `ReadonlyMap`\<`string`, `string`\>

Defined in: [ts-chocolate/src/packlets/editing/model.ts:185](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/editing/model.ts#L185)

Field-level validation errors.
Map of field path to error message.

***

### generalErrors

> `readonly` **generalErrors**: readonly `string`[]

Defined in: [ts-chocolate/src/packlets/editing/model.ts:191](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/editing/model.ts#L191)

General validation errors not specific to a single field.
Used for cross-field validations and collection-level constraints.

***

### isValid

> `readonly` **isValid**: `boolean`

Defined in: [ts-chocolate/src/packlets/editing/model.ts:179](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/editing/model.ts#L179)

Overall validation result.
True if all validations passed, false if any failed.
