[Home](../README.md) > KillerCombinations

# Class: KillerCombinations

Helper class providing UI assistance functions for killer sudoku puzzle solving.
Generates possible totals, number combinations with constraints, and cell-specific
possibilities based on current puzzle state.

## Constructors

<table><thead><tr><th>

Constructor

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

`constructor()`

</td><td>



</td><td>



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

[getPossibleTotals(cageSize, maxValue)](./KillerCombinations.getPossibleTotals.md)

</td><td>

`static`

</td><td>

Gets all mathematically possible totals for a given cage size.

</td></tr>
<tr><td>

[getCombinations(cageSize, total, constraints, maxValue)](./KillerCombinations.getCombinations.md)

</td><td>

`static`

</td><td>

Generates all possible number combinations that sum to the target total.

</td></tr>
<tr><td>

[getCellPossibilities(puzzle, state, cage)](./KillerCombinations.getCellPossibilities.md)

</td><td>

`static`

</td><td>

Determines possible values for each cell in a killer cage based on current puzzle state.

</td></tr>
</tbody></table>
