[Home](../README.md) > ILanguageChooserOptions

# Interface: ILanguageChooserOptions

Options for Bcp47.choose | language tag list filter functions.

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

[use](./ILanguageChooserOptions.use.md)

</td><td>



</td><td>

"desiredLanguage" | "availableLanguage"

</td><td>

Indicates whether to return the matching language from the
desired list or the available list.

</td></tr>
<tr><td>

[filter](./ILanguageChooserOptions.filter.md)

</td><td>



</td><td>

"none" | "primaryLanguage"

</td><td>

Indicates how to filter the language list - `'primaryLanguage'`
indicates the each primary language should appear only once in
the list in its most similar form.

</td></tr>
<tr><td>

[ultimateFallback](./ILanguageChooserOptions.ultimateFallback.md)

</td><td>



</td><td>

string | [ISubtags](ISubtags.md) | [LanguageTag](../classes/LanguageTag.md)

</td><td>

An optional Bcp47.LanguageSpec | language specification
indicating a language to be returned if the filter call would
otherwise return an empty list (i.e.

</td></tr>
</tbody></table>
