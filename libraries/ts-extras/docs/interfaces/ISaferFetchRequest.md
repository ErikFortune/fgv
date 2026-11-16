[Home](../README.md) > ISaferFetchRequest

# Interface: ISaferFetchRequest

The request a safer-fetch call is about to issue.

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

[url](./ISaferFetchRequest.url.md)

</td><td>

`readonly`

</td><td>

URL

</td><td>



</td></tr>
<tr><td>

[method](./ISaferFetchRequest.method.md)

</td><td>

`readonly`

</td><td>

"POST" | "GET" | "HEAD" | "PUT" | "DELETE" | "PATCH"

</td><td>



</td></tr>
<tr><td>

[headers](./ISaferFetchRequest.headers.md)

</td><td>

`readonly`

</td><td>

Readonly&lt;Record&lt;string, string&gt;&gt;

</td><td>

Header names are lowercased.

</td></tr>
<tr><td>

[body](./ISaferFetchRequest.body.md)

</td><td>

`readonly`

</td><td>

string | Uint8Array&lt;ArrayBufferLike&gt;

</td><td>



</td></tr>
</tbody></table>
