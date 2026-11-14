[Home](../README.md) > SeededRandomSource

# Class: SeededRandomSource

Seeded random number generator that can be cloned and used for deterministic generation.

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

[seed](./SeededRandomSource.seed.md)

</td><td>

`readonly`

</td><td>

string

</td><td>



</td></tr>
<tr><td>

[lineage](./SeededRandomSource.lineage.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>



</td></tr>
<tr><td>

[counter](./SeededRandomSource.counter.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Gets the current counter value.

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

[create(seed)](./SeededRandomSource.create.md)

</td><td>

`static`

</td><td>

Creates a new seeded random source from an optional seed.

</td></tr>
<tr><td>

[mulberryStep(currentState)](./SeededRandomSource.mulberryStep.md)

</td><td>

`static`

</td><td>

Steps a mulberry32 random number generator state and returns the next value.

</td></tr>
<tr><td>

[hashSeed(seed)](./SeededRandomSource.hashSeed.md)

</td><td>

`static`

</td><td>

Hashes a seed value.

</td></tr>
<tr><td>

[hashStateAndLabel(state, label)](./SeededRandomSource.hashStateAndLabel.md)

</td><td>

`static`

</td><td>

Hashes a state and label.

</td></tr>
<tr><td>

[next()](./SeededRandomSource.next.md)

</td><td>



</td><td>

Generates the next random number.

</td></tr>
<tr><td>

[clone()](./SeededRandomSource.clone.md)

</td><td>



</td><td>

Creates a clone of this random source.

</td></tr>
<tr><td>

[createChild(label)](./SeededRandomSource.createChild.md)

</td><td>



</td><td>

Creates a child random source with a label.

</td></tr>
</tbody></table>
