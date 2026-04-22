[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-sudoku-lib](../../../README.md) / [Hints](../README.md) / ExplanationFormatter

# Class: ExplanationFormatter

Utility class for formatting and displaying hint explanations.

## Constructors

### Constructor

> **new ExplanationFormatter**(): `ExplanationFormatter`

#### Returns

`ExplanationFormatter`

## Methods

### createLevelSummary()

> `static` **createLevelSummary**(`explanations`): `string`

Creates a summary of available explanation levels.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `explanations` | readonly [`IHintExplanation`](../interfaces/IHintExplanation.md)[] | The explanations to summarize |

#### Returns

`string`

Summary string

***

### formatAllExplanations()

> `static` **formatAllExplanations**(`explanations`): `string`

Formats all explanations for a hint as a structured string.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `explanations` | readonly [`IHintExplanation`](../interfaces/IHintExplanation.md)[] | The explanations to format |

#### Returns

`string`

Formatted explanations string

***

### formatExplanation()

> `static` **formatExplanation**(`explanation`, `includeSteps`, `includeTips`): `string`

Formats a hint explanation as a readable string.

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `explanation` | [`IHintExplanation`](../interfaces/IHintExplanation.md) | `undefined` | The explanation to format |
| `includeSteps` | `boolean` | `true` | Whether to include step-by-step instructions |
| `includeTips` | `boolean` | `true` | Whether to include tips |

#### Returns

`string`

Formatted explanation string
