[Home](../README.md) > ILocalStorageTreeParams

# Interface: ILocalStorageTreeParams

Configuration for LocalStorageTreeAccessors.

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

[pathToKeyMap](./ILocalStorageTreeParams.pathToKeyMap.md)

</td><td>



</td><td>

Record&lt;string, string&gt;

</td><td>

Map of directory path prefixes to localStorage keys.

</td></tr>
<tr><td>

[storage](./ILocalStorageTreeParams.storage.md)

</td><td>



</td><td>

Storage

</td><td>

Storage instance to use.

</td></tr>
<tr><td>

[autoSync](./ILocalStorageTreeParams.autoSync.md)

</td><td>



</td><td>

boolean

</td><td>

If true, automatically sync changes to localStorage on every modification.

</td></tr>
<tr><td>

[prefix](./ILocalStorageTreeParams.prefix.md)

</td><td>



</td><td>

string

</td><td>



</td></tr>
<tr><td>

[inferContentType](./ILocalStorageTreeParams.inferContentType.md)

</td><td>



</td><td>

ContentTypeFactory&lt;TCT&gt;

</td><td>



</td></tr>
<tr><td>

[mutable](./ILocalStorageTreeParams.mutable.md)

</td><td>



</td><td>

boolean | IFilterSpec

</td><td>

Controls mutability of the file tree.

</td></tr>
</tbody></table>
