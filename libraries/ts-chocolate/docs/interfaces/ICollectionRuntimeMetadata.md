[Home](../README.md) > ICollectionRuntimeMetadata

# Interface: ICollectionRuntimeMetadata

Runtime metadata for a loaded collection.
Extends ICollectionFileMetadata with `sourceName`, which is injected
at load time from the file tree source rather than read from the file.

**Extends:** [`ICollectionFileMetadata`](ICollectionFileMetadata.md)

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

[sourceName](./ICollectionRuntimeMetadata.sourceName.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Identifies which storage root loaded this collection.

</td></tr>
<tr><td>

[secretName](./ICollectionFileMetadata.secretName.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Secret name for encryption/decryption.

</td></tr>
<tr><td>

[name](./ICollectionFileMetadata.name.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Human-readable name for the collection.

</td></tr>
<tr><td>

[description](./ICollectionFileMetadata.description.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Description of the collection's purpose/contents.

</td></tr>
<tr><td>

[variation](./ICollectionFileMetadata.variation.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Variation identifier for the collection.

</td></tr>
<tr><td>

[tags](./ICollectionFileMetadata.tags.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Tags for categorization/search.

</td></tr>
</tbody></table>
