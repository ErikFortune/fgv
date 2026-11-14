[Home](../README.md) > LanguageTag

# Class: LanguageTag

Represents a single BCP-47 language tag.

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

[subtags](./LanguageTag.subtags.md)

</td><td>

`readonly`

</td><td>

Readonly&lt;[ISubtags](../interfaces/ISubtags.md)&gt;

</td><td>

The individual Bcp47.Subtags | subtags for

</td></tr>
<tr><td>

[tag](./LanguageTag.tag.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

A string representation of this language tag.

</td></tr>
<tr><td>

[registry](./LanguageTag.registry.md)

</td><td>

`readonly`

</td><td>

LanguageRegistryData

</td><td>

Details about this language tag from the IANA language

</td></tr>
<tr><td>

[effectiveScript](./LanguageTag.effectiveScript.md)

</td><td>

`readonly`

</td><td>

[ScriptSubtag](../type-aliases/ScriptSubtag.md) | undefined

</td><td>

The effective script of this language tag, if known.

</td></tr>
<tr><td>

[isUndetermined](./LanguageTag.isUndetermined.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Determines if this tag represents the special `undetermined` language.

</td></tr>
<tr><td>

[isValid](./LanguageTag.isValid.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether this language tag is valid.

</td></tr>
<tr><td>

[isStrictlyValid](./LanguageTag.isStrictlyValid.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether if this language tag is strictly valid.

</td></tr>
<tr><td>

[isCanonical](./LanguageTag.isCanonical.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether this language tag is in canonical form.

</td></tr>
<tr><td>

[isPreferred](./LanguageTag.isPreferred.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether this language tag is in preferred form.

</td></tr>
<tr><td>

[isGrandfathered](./LanguageTag.isGrandfathered.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether this language tag is a grandfathered tag.

</td></tr>
<tr><td>

[description](./LanguageTag.description.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Gets a text description of this tag.

</td></tr>
</tbody></table>

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[createFromTag(tag, options)](./LanguageTag.createFromTag.md)

</td><td>

`static`

</td><td>

Creates a new Bcp47.LanguageTag | language tag from a supplied `string` tag

</td></tr>
<tr><td>

[createFromSubtags(subtags, options)](./LanguageTag.createFromSubtags.md)

</td><td>

`static`

</td><td>

Creates a new Bcp47.LanguageTag | language tag from a supplied

</td></tr>
<tr><td>

[create(from, options)](./LanguageTag.create.md)

</td><td>

`static`

</td><td>

Creates a new Bcp47.LanguageTag | language tag from a supplied `string`

</td></tr>
<tr><td>

[getSuppressedScript()](./LanguageTag.getSuppressedScript.md)

</td><td>



</td><td>

Returns the `Suppress-Script` value defined for the primary language of this tag,

</td></tr>
<tr><td>

[toValid()](./LanguageTag.toValid.md)

</td><td>



</td><td>

Gets a confirmed valid representation of this language tag.

</td></tr>
<tr><td>

[toStrictlyValid()](./LanguageTag.toStrictlyValid.md)

</td><td>



</td><td>

Gets a confirmed strictly valid representation of this language tag.

</td></tr>
<tr><td>

[toCanonical()](./LanguageTag.toCanonical.md)

</td><td>



</td><td>

Gets a confirmed canonical representation of this language tag.

</td></tr>
<tr><td>

[toPreferred()](./LanguageTag.toPreferred.md)

</td><td>



</td><td>

Gets a confirmed preferred representation of this language tag.

</td></tr>
<tr><td>

[toString()](./LanguageTag.toString.md)

</td><td>



</td><td>

Gets a string representation of this language tag.

</td></tr>
</tbody></table>
