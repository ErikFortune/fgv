[Home](../../README.md) > [SaferFetch](../README.md) > IResponseHeadersGuard

# Interface: IResponseHeadersGuard

Policy guard over the response head.

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

[name](./IResponseHeadersGuard.name.md)

</td><td>

`readonly`

</td><td>

string

</td><td>



</td></tr>
<tr><td>

[acceptedContentTypes](./IResponseHeadersGuard.acceptedContentTypes.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

The media types this guard accepts, when it is a content-type allowlist.

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

[check(head, chain)](./IResponseHeadersGuard.check.md)

</td><td>



</td><td>



</td></tr>
</tbody></table>
