[Home](../../README.md) > [Collections](../README.md) > Collectible

# Class: Collectible

Simple implementation of Collections.ICollectible | ICollectible which does not allow the index to be
changed once set.

**Implements:** [`ICollectible<TKEY, TINDEX>`](../../interfaces/ICollectible.md)

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

`constructor(params)`

</td><td>



</td><td>

Constructs a new Collections.Collectible | Collectible instance
with a defined, strongly-typed index.

</td></tr>
</tbody></table>

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

[key](./Collectible.key.md)

</td><td>

`readonly`

</td><td>

TKEY

</td><td>

Collections.ICollectible.key

</td></tr>
<tr><td>

[index](./Collectible.index.md)

</td><td>

`readonly`

</td><td>

TINDEX | undefined

</td><td>

Collections.ICollectible.index

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

[createCollectible(params)](./Collectible.createCollectible.md)

</td><td>

`static`

</td><td>

Creates a new Collections.Collectible | Collectible instance with a defined, strongly-typed index.

</td></tr>
<tr><td>

[setIndex(index)](./Collectible.setIndex.md)

</td><td>



</td><td>

Collections.ICollectible.setIndex

</td></tr>
</tbody></table>
