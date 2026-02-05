[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Editing](../README.md) / ValidationReport

# Class: ValidationReport

Defined in: [ts-chocolate/src/packlets/editing/validation.ts:33](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/editing/validation.ts#L33)

Implementation of IValidationReport.
Immutable validation report with field and general errors.

## Implements

- [`IValidationReport`](../interfaces/IValidationReport.md)

## Constructors

### Constructor

> **new ValidationReport**(`fieldErrors`, `generalErrors`): `ValidationReport`

Defined in: [ts-chocolate/src/packlets/editing/validation.ts:49](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/editing/validation.ts#L49)

Create a validation report.

#### Parameters

##### fieldErrors

`ReadonlyMap`\<`string`, `string`\>

Map of field paths to error messages

##### generalErrors

readonly `string`[]

Array of general error messages

#### Returns

`ValidationReport`

## Properties

### fieldErrors

> `readonly` **fieldErrors**: `ReadonlyMap`\<`string`, `string`\>

Defined in: [ts-chocolate/src/packlets/editing/validation.ts:37](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/editing/validation.ts#L37)

Map of field paths to error messages.

#### Implementation of

[`IValidationReport`](../interfaces/IValidationReport.md).[`fieldErrors`](../interfaces/IValidationReport.md#fielderrors)

***

### generalErrors

> `readonly` **generalErrors**: readonly `string`[]

Defined in: [ts-chocolate/src/packlets/editing/validation.ts:42](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/editing/validation.ts#L42)

Array of general error messages.

#### Implementation of

[`IValidationReport`](../interfaces/IValidationReport.md).[`generalErrors`](../interfaces/IValidationReport.md#generalerrors)

## Accessors

### isValid

#### Get Signature

> **get** **isValid**(): `boolean`

Defined in: [ts-chocolate/src/packlets/editing/validation.ts:57](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/editing/validation.ts#L57)

Overall validation status.

##### Returns

`boolean`

Overall validation result.
True if all validations passed, false if any failed.

#### Implementation of

[`IValidationReport`](../interfaces/IValidationReport.md).[`isValid`](../interfaces/IValidationReport.md#isvalid)

## Methods

### success()

> `static` **success**(): `ValidationReport`

Defined in: [ts-chocolate/src/packlets/editing/validation.ts:65](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/editing/validation.ts#L65)

Create a successful (no errors) validation report.

#### Returns

`ValidationReport`

Empty validation report

***

### withErrors()

> `static` **withErrors**(`fieldErrors`, `generalErrors`): `ValidationReport`

Defined in: [ts-chocolate/src/packlets/editing/validation.ts:93](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/editing/validation.ts#L93)

Create a validation report with both field and general errors.

#### Parameters

##### fieldErrors

`Map`\<`string`, `string`\>

Map of field paths to error messages

##### generalErrors

`string`[]

Array of general error messages

#### Returns

`ValidationReport`

Validation report with all errors

***

### withFieldErrors()

> `static` **withFieldErrors**(`errors`): `ValidationReport`

Defined in: [ts-chocolate/src/packlets/editing/validation.ts:74](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/editing/validation.ts#L74)

Create a validation report with field errors.

#### Parameters

##### errors

`Map`\<`string`, `string`\>

Map of field paths to error messages

#### Returns

`ValidationReport`

Validation report with field errors

***

### withGeneralErrors()

> `static` **withGeneralErrors**(`errors`): `ValidationReport`

Defined in: [ts-chocolate/src/packlets/editing/validation.ts:83](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/editing/validation.ts#L83)

Create a validation report with general errors.

#### Parameters

##### errors

`string`[]

Array of general error messages

#### Returns

`ValidationReport`

Validation report with general errors
