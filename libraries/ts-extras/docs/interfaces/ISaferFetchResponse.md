[Home](../README.md) > ISaferFetchResponse

# Interface: ISaferFetchResponse

A successful safer-fetch response.

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

[value](./ISaferFetchResponse.value.md)

</td><td>

`readonly`

</td><td>

T

</td><td>



</td></tr>
<tr><td>

[status](./ISaferFetchResponse.status.md)

</td><td>

`readonly`

</td><td>

number

</td><td>



</td></tr>
<tr><td>

[headers](./ISaferFetchResponse.headers.md)

</td><td>

`readonly`

</td><td>

Readonly&lt;Record&lt;string, string&gt;&gt;

</td><td>

Header names are lowercased.

</td></tr>
<tr><td>

[urlChain](./ISaferFetchResponse.urlChain.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Every URL actually requested, in order, as cleared by the address guard.

</td></tr>
<tr><td>

[bytesRead](./ISaferFetchResponse.bytesRead.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Decoded bytes read from the response body.

</td></tr>
</tbody></table>
