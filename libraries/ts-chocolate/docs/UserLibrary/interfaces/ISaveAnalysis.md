[Home](../../README.md) > [UserLibrary](../README.md) > ISaveAnalysis

# Interface: ISaveAnalysis

Analysis of save options and recommendations based on session changes.

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

[canCreateVariation](./ISaveAnalysis.canCreateVariation.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether the original collection is mutable (allows creating new variation)

</td></tr>
<tr><td>

[canAddAlternatives](./ISaveAnalysis.canAddAlternatives.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether we can add ingredients as alternatives to the original recipe

</td></tr>
<tr><td>

[mustCreateNew](./ISaveAnalysis.mustCreateNew.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether we must create a new recipe (collection is immutable)

</td></tr>
<tr><td>

[recommendedOption](./ISaveAnalysis.recommendedOption.md)

</td><td>

`readonly`

</td><td>

"new" | "variation" | "alternatives"

</td><td>

Recommended save option based on changes

</td></tr>
<tr><td>

[changes](./ISaveAnalysis.changes.md)

</td><td>

`readonly`

</td><td>

{ ingredientsAdded: boolean; ingredientsRemoved: boolean; ingredientsChanged: boolean; weightChanged: boolean; notesChanged: boolean }

</td><td>

Detailed change information

</td></tr>
</tbody></table>
