[Home](../README.md) > IAiVerifiedEndpoint

# Interface: IAiVerifiedEndpoint

A host's assertion that a caller-supplied `endpoint` is the descriptor's own provider, so a
request sent there has its schemas adapted with that provider's keyword table rather than the
conservative one.

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

[providerId](./IAiVerifiedEndpoint.providerId.md)

</td><td>

`readonly`

</td><td>

[AiProviderId](../type-aliases/AiProviderId.md)

</td><td>

The provider the endpoint is asserted to be — must equal the descriptor's `id`.

</td></tr>
<tr><td>

[verified](./IAiVerifiedEndpoint.verified.md)

</td><td>

`readonly`

</td><td>

true

</td><td>

The assertion itself; only the literal `true` is honoured.

</td></tr>
</tbody></table>
