[Home](../README.md) > IAiStreamToolEvent

# Interface: IAiStreamToolEvent

A server-side tool progress event arriving during a streaming completion.
Surfaced for providers that emit explicit tool-progress markers (OpenAI
Responses API, Anthropic). Gemini's grounding doesn't emit these.

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

[type](./IAiStreamToolEvent.type.md)

</td><td>

`readonly`

</td><td>

"tool-event"

</td><td>



</td></tr>
<tr><td>

[toolType](./IAiStreamToolEvent.toolType.md)

</td><td>

`readonly`

</td><td>

"web_search"

</td><td>

Which server-side tool this event describes.

</td></tr>
<tr><td>

[phase](./IAiStreamToolEvent.phase.md)

</td><td>

`readonly`

</td><td>

"completed" | "started"

</td><td>

Tool lifecycle phase.

</td></tr>
<tr><td>

[detail](./IAiStreamToolEvent.detail.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional provider-specific detail.

</td></tr>
</tbody></table>
