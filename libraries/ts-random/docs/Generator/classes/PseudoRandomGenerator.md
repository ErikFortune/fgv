[Home](../../README.md) > [Generator](../README.md) > PseudoRandomGenerator

# Class: PseudoRandomGenerator

A pseudo-random number generator that can be used to generate random values
of various shapes.

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

[rng](./PseudoRandomGenerator.rng.md)

</td><td>

`readonly`

</td><td>

[SeededRandomSource](../../classes/SeededRandomSource.md)

</td><td>

The underlying random number generator.

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

[create(params)](./PseudoRandomGenerator.create.md)

</td><td>

`static`

</td><td>

Creates a new pseudo-random number generator.

</td></tr>
<tr><td>

[setGlobalRng(rng)](./PseudoRandomGenerator.setGlobalRng.md)

</td><td>

`static`

</td><td>

Sets this generator as the global random number generator.

</td></tr>
<tr><td>

[getGlobalRng()](./PseudoRandomGenerator.getGlobalRng.md)

</td><td>

`static`

</td><td>

Gets the global random number generator.

</td></tr>
<tr><td>

[ensureRng(rng)](./PseudoRandomGenerator.ensureRng.md)

</td><td>

`static`

</td><td>

Ensures a random number generator is available, using the global generator if available

</td></tr>
<tr><td>

[clone()](./PseudoRandomGenerator.clone.md)

</td><td>



</td><td>

Creates a clone of this generator.

</td></tr>
<tr><td>

[createChild(label)](./PseudoRandomGenerator.createChild.md)

</td><td>



</td><td>

Creates a child generator with the given label.

</td></tr>
<tr><td>

[nextFloat()](./PseudoRandomGenerator.nextFloat.md)

</td><td>



</td><td>

Generates a random float between 0 and 1.

</td></tr>
<tr><td>

[nextInt(max)](./PseudoRandomGenerator.nextInt.md)

</td><td>



</td><td>

Generates a random integer between 0 and the specified maximum value.

</td></tr>
<tr><td>

[nextInRange(min, max)](./PseudoRandomGenerator.nextInRange.md)

</td><td>



</td><td>

Generates a random integer between the specified minimum and maximum values.

</td></tr>
<tr><td>

[nextBoolean(trueProbability)](./PseudoRandomGenerator.nextBoolean.md)

</td><td>



</td><td>

Generates a random boolean value.

</td></tr>
<tr><td>

[nextString(length, chars)](./PseudoRandomGenerator.nextString.md)

</td><td>



</td><td>

Generates a random string of the specified length using the given characters.

</td></tr>
<tr><td>

[pickNext(items)](./PseudoRandomGenerator.pickNext.md)

</td><td>



</td><td>

Generates a random item from the given array.

</td></tr>
<tr><td>

[pickSequential(params)](./PseudoRandomGenerator.pickSequential.md)

</td><td>



</td><td>

Generates a sequence of values by randomly selecting from the given candidates.

</td></tr>
<tr><td>

[pickRandom(params)](./PseudoRandomGenerator.pickRandom.md)

</td><td>



</td><td>

Generates a sequence of values by randomly selecting from the given candidates.

</td></tr>
<tr><td>

[pickSequence(params)](./PseudoRandomGenerator.pickSequence.md)

</td><td>



</td><td>

Generates a sequence of values by randomly selecting from the given candidates.

</td></tr>
</tbody></table>
