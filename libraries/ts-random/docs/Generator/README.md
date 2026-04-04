[Home](../README.md) > Generator

# Namespace: Generator

## Classes

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[SeededRandomSource](./classes/SeededRandomSource.md)

</td><td>

Seeded random number generator that can be cloned and used for deterministic generation.

</td></tr>
<tr><td>

[PseudoRandomGenerator](./classes/PseudoRandomGenerator.md)

</td><td>

A pseudo-random number generator that can be used to generate random values

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

[ISeedPair](./interfaces/ISeedPair.md)

</td><td>

Represents a seed as both a string and a number.

</td></tr>
<tr><td>

[INextResult](./interfaces/INextResult.md)

</td><td>

Result of an internal next() operation.

</td></tr>
<tr><td>

[ISeededRandomSourceConstructorParams](./interfaces/ISeededRandomSourceConstructorParams.md)

</td><td>

Constructor params for a Generator.SeededRandomSource | SeededRandomSource.

</td></tr>
<tr><td>

[ISeededRandomSourceCreateParams](./interfaces/ISeededRandomSourceCreateParams.md)

</td><td>

Static create parameters for a Generator.SeededRandomSource | SeededRandomSource.

</td></tr>
<tr><td>

[IPseudoRandomGeneratorCreateParams](./interfaces/IPseudoRandomGeneratorCreateParams.md)

</td><td>

Parameters for creating a generator.

</td></tr>
<tr><td>

[ISequentialPickParams](./interfaces/ISequentialPickParams.md)

</td><td>

Parameters for generating a sequence of values

</td></tr>
<tr><td>

[IRandomSequencePickParams](./interfaces/IRandomSequencePickParams.md)

</td><td>

Parameters for generating a sequence of values

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

[RandomStepFunction](./type-aliases/RandomStepFunction.md)

</td><td>

Function that steps a random number generator state and returns the next value.

</td></tr>
<tr><td>

[GeneratorGlobalThis](./type-aliases/GeneratorGlobalThis.md)

</td><td>

Global context (globalThis) into which the generator can install itself for sharing.

</td></tr>
<tr><td>

[SequencePickParams](./type-aliases/SequencePickParams.md)

</td><td>

Type representing parameters for generating a sequence of values.

</td></tr>
</tbody></table>
