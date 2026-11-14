[Home](../README.md) > IDownloadOptions

# Interface: IDownloadOptions

Options for customizing file downloads

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

[baseFilename](./IDownloadOptions.baseFilename.md)

</td><td>



</td><td>

string

</td><td>

Base filename (without extension).

</td></tr>
<tr><td>

[extension](./IDownloadOptions.extension.md)

</td><td>



</td><td>

string

</td><td>

File extension (without dot).

</td></tr>
<tr><td>

[includeTimestamp](./IDownloadOptions.includeTimestamp.md)

</td><td>



</td><td>

boolean

</td><td>

Include timestamp in filename.

</td></tr>
<tr><td>

[timestampFormat](./IDownloadOptions.timestampFormat.md)

</td><td>



</td><td>

string

</td><td>

Custom timestamp format.

</td></tr>
<tr><td>

[mimeType](./IDownloadOptions.mimeType.md)

</td><td>



</td><td>

string

</td><td>

MIME type for the blob.

</td></tr>
<tr><td>

[filenameTransformer](./IDownloadOptions.filenameTransformer.md)

</td><td>



</td><td>

(baseFilename: string) =&gt; string

</td><td>

Custom filename transformer function

</td></tr>
</tbody></table>
