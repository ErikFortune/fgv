[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [Mustache](../README.md) / MustacheTemplate

# Class: MustacheTemplate

A helper class for working with Mustache templates that provides
validation, variable extraction, and context validation utilities.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-options"></a> `options` | `public readonly` | `Readonly`\<[`IRequiredMustacheTemplateOptions`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-extras/docs)\> | The options used for parsing this template |
| <a id="property-template"></a> `template` | `public readonly` | `string` | The original template string |

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

### renderWithSegments()

> **renderWithSegments**(`context`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IRenderedTemplate`](../interfaces/IRenderedTemplate.md)\>

Renders the template and reports which part of the output came from where.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `context` | `unknown` | The context object for template rendering. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IRenderedTemplate`](../interfaces/IRenderedTemplate.md)\>

Success with the rendered text and its segment map, or Failure if the
template contains a construct this cannot describe

#### Remarks

The rendered `text` is identical to `render`'s. What is added is
`segments`: a document-ordered, contiguous, gapless attribution of every code unit to either
template literal text or a named interpolation. It answers "what is in this output, in what
order, and how much of it is each part" — a prompt's composition, a generated document's
section sizes, a diff-free view of where a template's bulk actually goes.

**Offsets are computed during the render, never recovered afterwards.** Recovering them by
searching the output for each substituted value is the obvious shortcut and it is unsound: a
value can occur more than once, can render empty, can be a substring of the surrounding
literal text, and can be altered by escaping between input and output. That failure is silent
and produces plausible offsets, which is the worst property a diagnostic can have.

**Sections, inverted sections and partials are refused, not approximated.** Their rendered
output is not a linear image of the token order — a section may repeat its body, or omit it —
so a segment list walked from the template would mis-describe the result. Failing names the
construct. Comments and set-delimiter tags emit nothing and are skipped; because each
interpolation is rendered from its already-parsed token rather than from a re-parsed slice of
the template, a set-delimiter tag has no effect on what this produces.

**Every context value is evaluated exactly once, as `render()` evaluates it.** A lambda in the
context is therefore invoked the same number of times either way, and a context whose lambda
answers differently per call is rendered rather than rejected — the returned `segments` always
describe the returned `text`, whatever that text was. (The concatenation identity is asserted
across every shape in this package's test suite, not re-checked at runtime: re-checking means
a second full render, which is precisely what would double those invocations.)

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
