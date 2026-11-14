[Home](../../README.md) > [AiAssist](../README.md) > IFencedStringifiedJsonOptions

# Interface: IFencedStringifiedJsonOptions

Options for the validating overload of AiAssist.fencedStringifiedJson.
`inner` is required so the typed `Converter<T>` return value can never lie
about the runtime shape.

**Extends:** [`IFencedStringifiedJsonExtractorOptions`](../../interfaces/IFencedStringifiedJsonExtractorOptions.md)

## Properties

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[inner](./IFencedStringifiedJsonOptions.inner.md)

</td><td>

`readonly`

</td><td>

Converter&lt;T, unknown&gt; | Validator&lt;T, unknown&gt;

</td><td>

Inner converter or validator applied to the parsed JSON value.

</td></tr>
<tr><td>

[extractor](./IFencedStringifiedJsonExtractorOptions.extractor.md)

</td><td>

`readonly`

</td><td>

[JsonTextExtractor](../../type-aliases/JsonTextExtractor.md)

</td><td>

Optional pre-parse extractor.

</td></tr>
</tbody></table>
