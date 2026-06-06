[Home](../README.md) > Crc32Normalizer

# Class: Crc32Normalizer

A Hash.HashingNormalizer | hashing normalizer which computes object
hash using the CRC32 algorithm.

**Extends:** [`HashingNormalizer`](HashingNormalizer.md)

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

[crc32Hash(parts)](./Crc32Normalizer.crc32Hash.md)

</td><td>

`static`

</td><td>



</td></tr>
<tr><td>

[computeHash(from)](./HashingNormalizer.computeHash.md)

</td><td>



</td><td>



</td></tr>
<tr><td>

[normalize(from)](./HashingNormalizer.normalize.md)

</td><td>



</td><td>

Normalizes the supplied value

</td></tr>
<tr><td>

[canonicalize(from)](./HashingNormalizer.canonicalize.md)

</td><td>



</td><td>

Produces a stable, byte-identical JSON string following RFC 8785
(JSON Canonicalization Scheme) key-ordering rules.

</td></tr>
<tr><td>

[normalizeEntries(entries)](./HashingNormalizer.normalizeEntries.md)

</td><td>



</td><td>

Normalizes an array of object property entries (e.g.

</td></tr>
<tr><td>

[normalizeLiteral(from)](./HashingNormalizer.normalizeLiteral.md)

</td><td>



</td><td>

Normalizes the supplied literal value

</td></tr>
</tbody></table>
