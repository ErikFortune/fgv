[Home](../README.md) > IAiStreamDone

# Interface: IAiStreamDone

Terminal success event for a streaming completion. Carries the aggregated
full text and truncation status for callers that want both the progressive
UI and the complete result.

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

[type](./IAiStreamDone.type.md)

</td><td>

`readonly`

</td><td>

"done"

</td><td>



</td></tr>
<tr><td>

[truncated](./IAiStreamDone.truncated.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether the response was truncated due to token limits.

</td></tr>
<tr><td>

[fullText](./IAiStreamDone.fullText.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The full concatenated text from all `text-delta` events.

</td></tr>
<tr><td>

[incompleteReason](./IAiStreamDone.incompleteReason.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Provider-reported reason a truncated response was cut short (e.g.

</td></tr>
</tbody></table>
