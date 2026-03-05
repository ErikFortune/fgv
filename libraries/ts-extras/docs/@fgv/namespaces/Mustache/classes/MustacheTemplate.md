[**@fgv/ts-extras**](../../../../README.md)

***

[@fgv/ts-extras](../../../../README.md) / [Mustache](../README.md) / MustacheTemplate

# Class: MustacheTemplate

A helper class for working with Mustache templates that provides
validation, variable extraction, and context validation utilities.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="options"></a> `options` | `readonly` | `Readonly`\<[`IRequiredMustacheTemplateOptions`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-extras/docs)\> | The options used for parsing this template |
| <a id="template"></a> `template` | `readonly` | `string` | The original template string |

## Methods

### extractVariableNames()

> **extractVariableNames**(): readonly `string`[]

Extracts unique variable names from the template.

#### Returns

readonly `string`[]

An array of unique variable name strings (e.g., ['user.name', 'items'])

***

### extractVariables()

> **extractVariables**(): readonly [`IVariableRef`](../interfaces/IVariableRef.md)[]

Extracts all variable references from the template.

#### Returns

readonly [`IVariableRef`](../interfaces/IVariableRef.md)[]

An array of variable references found in the template

***

### render()

> **render**(`context`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

Renders the template with the given context.
Use this for pre-validated contexts where you've already checked
that all required variables are present.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `context` | `unknown` | The context object for template rendering |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

Success with the rendered string, or Failure if rendering fails

***

### validate()

> **validate**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`true`\>

Checks if this template instance has valid syntax.
Always returns Success(true) since parsing succeeded in create().

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`true`\>

Success with true

***

### validateAndRender()

> **validateAndRender**(`context`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

Validates the context and renders the template if validation passes.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `context` | `unknown` | The context object to validate and render with |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

Success with the rendered string, or Failure with validation or render errors

***

### validateContext()

> **validateContext**(`context`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IContextValidationResult`](../interfaces/IContextValidationResult.md)\>

Validates that a context object has all required variables.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `context` | `unknown` | The context object to validate |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IContextValidationResult`](../interfaces/IContextValidationResult.md)\>

Success with validation result containing details about present/missing variables

***

### create()

> `static` **create**(`template`, `options?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`MustacheTemplate`\>

Creates a new MustacheTemplate instance.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `template` | `string` | The Mustache template string to parse |
| `options?` | [`IMustacheTemplateOptions`](../interfaces/IMustacheTemplateOptions.md) | Optional parsing options |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`MustacheTemplate`\>

Success with the template instance, or Failure if parsing fails

***

### validate()

> `static` **validate**(`template`, `options?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`true`\>

Validates that a template string has valid Mustache syntax.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `template` | `string` | The template string to validate |
| `options?` | [`IMustacheTemplateOptions`](../interfaces/IMustacheTemplateOptions.md) | Optional parsing options |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`true`\>

Success with true if valid, or Failure with a descriptive error message
