[Home](../README.md) > ISaferFetchResponseHead

# Interface: ISaferFetchResponseHead

Response status and headers, available before any body bytes are read.

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

[status](./ISaferFetchResponseHead.status.md)

</td><td>

`readonly`

</td><td>

number

</td><td>



</td></tr>
<tr><td>

[statusText](./ISaferFetchResponseHead.statusText.md)

</td><td>

`readonly`

</td><td>

string

</td><td>



</td></tr>
<tr><td>

[headers](./ISaferFetchResponseHead.headers.md)

</td><td>

`readonly`

</td><td>

Readonly&lt;Record&lt;string, string&gt;&gt;

</td><td>

Header names are lowercased.

</td></tr>
<tr><td>

[contentType](./ISaferFetchResponseHead.contentType.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Raw `content-type` header value, including any parameters.

</td></tr>
<tr><td>

[contentLength](./ISaferFetchResponseHead.contentLength.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Parsed `content-length`, present only when the header was sent and is a valid count.

</td></tr>
</tbody></table>
