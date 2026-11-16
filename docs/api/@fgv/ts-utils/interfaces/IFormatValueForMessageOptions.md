[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-utils](../README.md) / IFormatValueForMessageOptions

# Interface: IFormatValueForMessageOptions

Options for [formatValueForMessage](../functions/formatValueForMessage.md).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-indent"></a> `indent?` | `readonly` | `number` | Number of spaces used to indent nested members, with the same meaning (and the same clamp to 0–10) as the `space` argument of `JSON.stringify`. Default `0` (compact). |
| <a id="property-maxlength"></a> `maxLength?` | `readonly` | `number` | Maximum length of the returned text, in UTF-16 code units, including the trailing ellipsis (`…`) that marks a truncated rendering. Values below 1 or that are not numbers select the default. Default [DEFAULT\_FORMAT\_VALUE\_MAX\_LENGTH](../variables/DEFAULT_FORMAT_VALUE_MAX_LENGTH.md) for the `'json'` style and [DEFAULT\_FORMAT\_VALUE\_STRING\_MAX\_LENGTH](../variables/DEFAULT_FORMAT_VALUE_STRING_MAX_LENGTH.md) for the `'string'` style. |
| <a id="property-style"></a> `style?` | `readonly` | `"string"` \| `"json"` | How to render the value: - `'json'` (default): the `JSON.stringify` rendering described at [formatValueForMessage](../functions/formatValueForMessage.md). - `'string'`: `String(value)`, which is what interpolating the value into a template literal produces, except for a symbol, where a template literal throws and `String()` does not. Falls back to the `'json'` rendering when `String()` throws (a null-prototype object, a Proxy whose traps throw, a throwing `toString`). For messages that have always interpolated the value directly and whose text must not change. It invokes the value's own `toString` / `Symbol.toPrimitive`. Its default bound is the larger [DEFAULT\_FORMAT\_VALUE\_STRING\_MAX\_LENGTH](../variables/DEFAULT_FORMAT_VALUE_STRING_MAX_LENGTH.md): the text of such a message was never bounded, and is unchanged up to that length, but `String()` of a large array runs to megabytes. |
