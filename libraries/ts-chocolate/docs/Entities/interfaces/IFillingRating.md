[Home](../../README.md) > [Entities](../README.md) > IFillingRating

# Interface: IFillingRating

Rating for a specific category of a filling recipe version

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

[category](./IFillingRating.category.md)

</td><td>

`readonly`

</td><td>

[RatingCategory](../../type-aliases/RatingCategory.md)

</td><td>

The category being rated

</td></tr>
<tr><td>

[score](./IFillingRating.score.md)

</td><td>

`readonly`

</td><td>

[RatingScore](../../type-aliases/RatingScore.md)

</td><td>

Score from 1-5

</td></tr>
<tr><td>

[notes](./IFillingRating.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](../../interfaces/ICategorizedNote.md)[]

</td><td>

Optional categorized notes about the rating

</td></tr>
</tbody></table>
