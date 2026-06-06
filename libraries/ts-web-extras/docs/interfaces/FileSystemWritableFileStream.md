[Home](../README.md) > FileSystemWritableFileStream

# Interface: FileSystemWritableFileStream

Writable file stream interface

**Extends:** `WritableStream`

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

[locked](./FileSystemWritableFileStream.locked.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

The **`locked`** read-only property of the WritableStream interface returns a boolean indicating whether the `WritableStream` is locked to a writer.

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

[write(data)](./FileSystemWritableFileStream.write.md)

</td><td>



</td><td>



</td></tr>
<tr><td>

[seek(position)](./FileSystemWritableFileStream.seek.md)

</td><td>



</td><td>



</td></tr>
<tr><td>

[truncate(size)](./FileSystemWritableFileStream.truncate.md)

</td><td>



</td><td>



</td></tr>
<tr><td>

[abort(reason)](./FileSystemWritableFileStream.abort.md)

</td><td>



</td><td>

The **`abort()`** method of the WritableStream interface aborts the stream, signaling that the producer can no longer successfully write to the stream and it is to be immediately moved to an error state, with any queued writes discarded.

</td></tr>
<tr><td>

[close()](./FileSystemWritableFileStream.close.md)

</td><td>



</td><td>

The **`close()`** method of the WritableStream interface closes the associated stream.

</td></tr>
<tr><td>

[getWriter()](./FileSystemWritableFileStream.getWriter.md)

</td><td>



</td><td>

The **`getWriter()`** method of the WritableStream interface returns a new instance of WritableStreamDefaultWriter and locks the stream to that instance.

</td></tr>
</tbody></table>
