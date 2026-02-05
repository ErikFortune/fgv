[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Editing](../README.md) / ValidationReportBuilder

# Class: ValidationReportBuilder

Defined in: [ts-chocolate/src/packlets/editing/validation.ts:107](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/editing/validation.ts#L107)

Builder for constructing validation reports.
Allows accumulating errors before creating final report.

## Constructors

### Constructor

> **new ValidationReportBuilder**(): `ValidationReportBuilder`

#### Returns

`ValidationReportBuilder`

## Methods

### addFieldError()

> **addFieldError**(`fieldPath`, `errorMessage`): `this`

Defined in: [ts-chocolate/src/packlets/editing/validation.ts:116](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/editing/validation.ts#L116)

Add a field error.

#### Parameters

##### fieldPath

`string`

Field path (dot notation for nested fields)

##### errorMessage

`string`

Error message

#### Returns

`this`

***

### addGeneralError()

> **addGeneralError**(`errorMessage`): `this`

Defined in: [ts-chocolate/src/packlets/editing/validation.ts:125](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/editing/validation.ts#L125)

Add a general error.

#### Parameters

##### errorMessage

`string`

Error message

#### Returns

`this`

***

### addValidationResult()

> **addValidationResult**(`fieldPath`, `result`): `this`

Defined in: [ts-chocolate/src/packlets/editing/validation.ts:136](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/editing/validation.ts#L136)

Add errors from a validation result.
If the result is a failure, adds it as a field error.

#### Parameters

##### fieldPath

`string`

Field path for the error

##### result

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`unknown`\>

Validation result

#### Returns

`this`

***

### build()

> **build**(): [`ValidationReport`](ValidationReport.md)

Defined in: [ts-chocolate/src/packlets/editing/validation.ts:155](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/editing/validation.ts#L155)

Build the final validation report.

#### Returns

[`ValidationReport`](ValidationReport.md)

Validation report with all accumulated errors

***

### buildResult()

> **buildResult**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ValidationReport`](ValidationReport.md)\>

Defined in: [ts-chocolate/src/packlets/editing/validation.ts:164](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/editing/validation.ts#L164)

Build and return as Result.
Returns success(report) if no errors, fail with error summary if errors exist.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ValidationReport`](ValidationReport.md)\>

Result containing validation report or failure

***

### hasErrors()

> **hasErrors**(): `boolean`

Defined in: [ts-chocolate/src/packlets/editing/validation.ts:147](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/editing/validation.ts#L147)

Check if any errors have been added.

#### Returns

`boolean`

True if there are errors
