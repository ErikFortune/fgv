[Home](../../README.md) > [SaferFetch](../README.md) > IResolvedGuards

# Interface: IResolvedGuards

The guards a call will actually use. Every field is concrete: defaults are applied once, at
the boundary, and nothing downstream branches on a guard's absence.

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

[address](./IResolvedGuards.address.md)

</td><td>

`readonly`

</td><td>

[IAddressGuard](../../interfaces/IAddressGuard.md)

</td><td>

Caller-supplied; there is no default.

</td></tr>
<tr><td>

[request](./IResolvedGuards.request.md)

</td><td>

`readonly`

</td><td>

[IRequestGuard](../../interfaces/IRequestGuard.md)

</td><td>



</td></tr>
<tr><td>

[responseHeaders](./IResolvedGuards.responseHeaders.md)

</td><td>

`readonly`

</td><td>

[IResponseHeadersGuard](../../interfaces/IResponseHeadersGuard.md)

</td><td>



</td></tr>
<tr><td>

[responseBody](./IResolvedGuards.responseBody.md)

</td><td>

`readonly`

</td><td>

[IResponseBodyGuard](../../interfaces/IResponseBodyGuard.md)

</td><td>



</td></tr>
</tbody></table>
