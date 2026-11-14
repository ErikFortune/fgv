[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IScreenerContext

# Interface: IScreenerContext

Context passed to an [IScreener](IScreener.md) for a single slot value.

## Remarks

The `value` is **post-binding, pre-render** — the substituted slot content
before Mustache templating, which is the correct screening point. The full
[IPromptSlot](IPromptSlot.md) and the owning `promptId` are supplied for richer
attribution; `source` is the slot's declared source label (when any), so a
screener can implement its own source-aware skipping.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-promptid"></a> `promptId` | `readonly` | [`PromptId`](../type-aliases/PromptId.md) | The prompt whose resolve triggered the screen. |
| <a id="property-slot"></a> `slot` | `readonly` | [`IPromptSlot`](IPromptSlot.md) | The slot whose merged value is being screened. |
| <a id="property-source"></a> `source?` | `readonly` | `string` | The slot's declared source label, when set. |
| <a id="property-value"></a> `value` | `readonly` | `string` | Post-binding, pre-render slot value. |
