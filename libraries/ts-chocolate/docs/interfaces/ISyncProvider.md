[Home](../README.md) > ISyncProvider

# Interface: ISyncProvider

Provider for flushing in-memory FileTree changes to the filesystem.

In the web app, this wraps `reactiveWorkspace.syncAllToDisk()`.
In the CLI or tests, this can be a no-op or custom implementation.

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

[syncToDisk()](./ISyncProvider.syncToDisk.md)

</td><td>



</td><td>

Flush all dirty FileTree changes to the filesystem.

</td></tr>
</tbody></table>
