[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [Mustache](../README.md) / MustacheTemplate

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

> **render**(`context`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

Renders the template with the given context.
Use this for pre-validated contexts where you've already checked
that all required variables are present.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `context` | `unknown` | The context object for template rendering |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

Success with the rendered string, or Failure if rendering fails

***

### validate()

> **validate**(): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`true`\>

Checks if this template instance has valid syntax.
Always returns Success(true) since parsing succeeded in create().

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`true`\>

Success with true

***

### validateAndRender()

> **validateAndRender**(`context`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

Validates the context and renders the template if validation passes.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `context` | `unknown` | The context object to validate and render with |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

Success with the rendered string, or Failure with validation or render errors

***

### validateContext()

> **validateContext**(`context`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IContextValidationResult`](../interfaces/IContextValidationResult.md)\>

Validates that a context object has all required variables.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `context` | `unknown` | The context object to validate |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IContextValidationResult`](../interfaces/IContextValidationResult.md)\>

Success with validation result containing details about present/missing variables

***

### create()

> `static` **create**(`template`, `options?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`MustacheTemplate`\>

Creates a new MustacheTemplate instance.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `template` | `string` | The Mustache template string to parse |
| `options?` | [`IMustacheTemplateOptions`](../interfaces/IMustacheTemplateOptions.md) | Optional parsing options |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`MustacheTemplate`\>

Success with the template instance, or Failure if parsing fails

***

### validate()

> `static` **validate**(`template`, `options?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`true`\>

Validates that a template string has valid Mustache syntax.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `template` | `string` | The template string to validate |
| `options?` | [`IMustacheTemplateOptions`](../interfaces/IMustacheTemplateOptions.md) | Optional parsing options |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`true`\>

Success with true if valid, or Failure with a descriptive error message
