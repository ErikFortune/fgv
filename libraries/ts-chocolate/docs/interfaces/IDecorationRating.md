[Home](../README.md) > IDecorationRating

# Interface: IDecorationRating

Rating for a specific category of a decoration.

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

[category](./IDecorationRating.category.md)

</td><td>

`readonly`

</td><td>

[RatingCategory](../type-aliases/RatingCategory.md)

</td><td>

The category being rated (e.g., difficulty, durability, appearance)

</td></tr>
<tr><td>

[score](./IDecorationRating.score.md)

</td><td>

`readonly`

</td><td>

[RatingScore](../type-aliases/RatingScore.md)

</td><td>

Score from 1-5

</td></tr>
<tr><td>

[notes](./IDecorationRating.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](ICategorizedNote.md)[]

</td><td>

Optional categorized notes about the rating

</td></tr>
</tbody></table>
