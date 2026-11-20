[Home](../README.md) > Bcp47

# Namespace: Bcp47

## Namespaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[Overrides](./Overrides/README.md)

</td><td>



</td></tr>
<tr><td>

[Subtags](./Subtags/README.md)

</td><td>



</td></tr>
</tbody></table>

## Classes

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[LanguageTag](./classes/LanguageTag.md)

</td><td>

Represents a single BCP-47 language tag.

</td></tr>
<tr><td>

[LanguageSimilarityMatcher](./classes/LanguageSimilarityMatcher.md)

</td><td>

Helper to compare two language tags to determine how closely related they are,

</td></tr>
<tr><td>

[NormalizeTag](./classes/NormalizeTag.md)

</td><td>

Normalization helpers for BCP-47 language tags.

</td></tr>
<tr><td>

[ValidateTag](./classes/ValidateTag.md)

</td><td>

Validation helpers for BCP-47 language tags.

</td></tr>
</tbody></table>

## Interfaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[IExtensionSubtagValue](./interfaces/IExtensionSubtagValue.md)

</td><td>



</td></tr>
<tr><td>

[ISubtags](./interfaces/ISubtags.md)

</td><td>



</td></tr>
<tr><td>

[ILanguageTagInitOptions](./interfaces/ILanguageTagInitOptions.md)

</td><td>

Initialization options for parsing or creation of Bcp47.LanguageTag | language tag objects.

</td></tr>
<tr><td>

[ILanguageChooserOptions](./interfaces/ILanguageChooserOptions.md)

</td><td>

Options for Bcp47.choose | language tag list filter functions.

</td></tr>
</tbody></table>

## Type Aliases

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[LanguageSpec](./type-aliases/LanguageSpec.md)

</td><td>

Any of the possible ways to represent a language - as a `string`,

</td></tr>
<tr><td>

[ExtensionSingleton](./type-aliases/ExtensionSingleton.md)

</td><td>



</td></tr>
<tr><td>

[ExtensionSubtag](./type-aliases/ExtensionSubtag.md)

</td><td>



</td></tr>
<tr><td>

[TagSimilarity](./type-aliases/TagSimilarity.md)

</td><td>

Numeric representation of the quality of a language match.

</td></tr>
<tr><td>

[TagNormalization](./type-aliases/TagNormalization.md)

</td><td>

Describes the degree of normalization of a language tag.

</td></tr>
<tr><td>

[TagValidity](./type-aliases/TagValidity.md)

</td><td>

Describes the validation level of a particular tag.

</td></tr>
</tbody></table>

## Functions

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[tag](./functions/tag.md)

</td><td>

Creates a new Bcp47.LanguageTag | language tag from a Bcp47.LanguageSpec | language specifier

The supplied initializer must be at least
https://www.rfc-editor.org/rfc/rfc5646.html#section-2.2.9 | well-formed according to RFC 5646.

</td></tr>
<tr><td>

[tags](./functions/tags.md)

</td><td>

Creates an array of Bcp47.LanguageTag | language tags from an incoming array of

</td></tr>
<tr><td>

[similarity](./functions/similarity.md)

</td><td>

Determine how similar two language tags are to each other.

</td></tr>
<tr><td>

[choose](./functions/choose.md)

</td><td>

Matches a list of desired Bcp47.LanguageSpec | languages to a list of available Bcp47.LanguageSpec | languages,

</td></tr>
<tr><td>

[subtagsToString](./functions/subtagsToString.md)

</td><td>

Converts Bcp47.Subtags | subtags to a string.

</td></tr>
</tbody></table>

## Variables

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[tagSimilarity](./variables/tagSimilarity.md)

</td><td>

Common levels of match quality for a single language match.

</td></tr>
</tbody></table>
