[Home](../README.md) > PuzzleDefinitionFactory

# Class: PuzzleDefinitionFactory

Factory for creating and validating puzzle definitions

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

[create(dimensions, options)](./PuzzleDefinitionFactory.create.md)

</td><td>

`static`

</td><td>

Create a puzzle definition from dimensions and options

</td></tr>
<tr><td>

[createKiller(dimensions, description)](./PuzzleDefinitionFactory.createKiller.md)

</td><td>

`static`

</td><td>

Create killer sudoku puzzle definition with cage constraints

</td></tr>
<tr><td>

[validate(dimensions)](./PuzzleDefinitionFactory.validate.md)

</td><td>

`static`

</td><td>

Validate puzzle dimensions

</td></tr>
<tr><td>

[getStandardConfig(name)](./PuzzleDefinitionFactory.getStandardConfig.md)

</td><td>

`static`

</td><td>

Get a standard configuration by name

</td></tr>
<tr><td>

[getStandardConfigs()](./PuzzleDefinitionFactory.getStandardConfigs.md)

</td><td>

`static`

</td><td>

Get all available standard configurations

</td></tr>
<tr><td>

[getValidator(puzzleType)](./PuzzleDefinitionFactory.getValidator.md)

</td><td>

`static`

</td><td>

Get validator for a specific puzzle type

</td></tr>
<tr><td>

[registerValidator(puzzleType, validator)](./PuzzleDefinitionFactory.registerValidator.md)

</td><td>

`static`

</td><td>

Register a custom validator for a puzzle type

</td></tr>
</tbody></table>
