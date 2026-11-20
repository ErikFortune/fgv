[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IPromptJoinPolicy

# Interface: IPromptJoinPolicy

Join policy controlling how partial-candidate bodies are concatenated.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-order"></a> `order?` | `readonly` | `"specificity-ascending"` \| `"specificity-descending"` | Fragment order. `'specificity-ascending'` (default) puts least-specific first. |
| <a id="property-separator"></a> `separator?` | `readonly` | `string` | String inserted between fragments. Default `'\n\n'`. |
| <a id="property-trimtrailingwhitespace"></a> `trimTrailingWhitespace?` | `readonly` | `boolean` | Strip trailing whitespace per fragment before joining. Default `true`. |
