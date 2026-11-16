[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskContextBudget

# Interface: ITaskContextBudget

Bounds on one rendered task context.

## Remarks

`maxChars` counts UTF-16 code units of the *whole* rendered text, framing and omission
report included. The renderer reserves the framing before selecting anything, and rejects
a budget too small to hold it. No token count is claimed.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-maxchars"></a> `maxChars` | `readonly` | `number` | Maximum length of the rendered text, in UTF-16 code units. |
| <a id="property-maxdepth"></a> `maxDepth` | `readonly` | `number` | Maximum depth in the visible task tree. Roots of the visible forest are depth 0. |
| <a id="property-maxitems"></a> `maxItems` | `readonly` | `number` | Maximum number of rendered items: task revisions plus unresolved diagnostics. |
