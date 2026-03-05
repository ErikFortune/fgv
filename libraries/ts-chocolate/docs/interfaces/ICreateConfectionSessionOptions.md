[Home](../README.md) > ICreateConfectionSessionOptions

# Interface: ICreateConfectionSessionOptions

Options for creating a new persisted confection session.

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

[collectionId](./ICreateConfectionSessionOptions.collectionId.md)

</td><td>

`readonly`

</td><td>

[CollectionId](../type-aliases/CollectionId.md)

</td><td>

Target collection for the persisted session

</td></tr>
<tr><td>

[status](./ICreateConfectionSessionOptions.status.md)

</td><td>

`readonly`

</td><td>

[PersistedSessionStatus](../type-aliases/PersistedSessionStatus.md)

</td><td>

Initial session status (default: 'planning')

</td></tr>
<tr><td>

[label](./ICreateConfectionSessionOptions.label.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional user-provided label

</td></tr>
<tr><td>

[slug](./ICreateConfectionSessionOptions.slug.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional slug appended to the generated session ID as kebab-case

</td></tr>
<tr><td>

[params](./ICreateConfectionSessionOptions.params.md)

</td><td>

`readonly`

</td><td>

[IConfectionEditingSessionParams](IConfectionEditingSessionParams.md)

</td><td>

Optional confection editing session parameters (yield, sessionId)

</td></tr>
</tbody></table>
