[Home](../README.md) > IHttpTreeParams

# Interface: IHttpTreeParams

Configuration for creating HTTP-backed tree accessors.

**Extends:** `IFileTreeInitParams<TCT>`

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

[baseUrl](./IHttpTreeParams.baseUrl.md)

</td><td>

`readonly`

</td><td>

string

</td><td>



</td></tr>
<tr><td>

[namespace](./IHttpTreeParams.namespace.md)

</td><td>

`readonly`

</td><td>

string

</td><td>



</td></tr>
<tr><td>

[autoSync](./IHttpTreeParams.autoSync.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>



</td></tr>
<tr><td>

[fetchImpl](./IHttpTreeParams.fetchImpl.md)

</td><td>

`readonly`

</td><td>

{ (input: RequestInfo | URL, init?: RequestInit): Promise&lt;Response&gt;; (input: string | Request | URL, init?: RequestInit): Promise&lt;Response&gt; }

</td><td>



</td></tr>
<tr><td>

[userId](./IHttpTreeParams.userId.md)

</td><td>

`readonly`

</td><td>

string

</td><td>



</td></tr>
<tr><td>

[logger](./IHttpTreeParams.logger.md)

</td><td>

`readonly`

</td><td>

LogReporter&lt;unknown, unknown&gt;

</td><td>



</td></tr>
<tr><td>

[prefix](./IHttpTreeParams.prefix.md)

</td><td>



</td><td>

string

</td><td>



</td></tr>
<tr><td>

[inferContentType](./IHttpTreeParams.inferContentType.md)

</td><td>



</td><td>

ContentTypeFactory&lt;TCT&gt;

</td><td>



</td></tr>
<tr><td>

[mutable](./IHttpTreeParams.mutable.md)

</td><td>



</td><td>

boolean | IFilterSpec

</td><td>

Controls mutability of the file tree.

</td></tr>
</tbody></table>
