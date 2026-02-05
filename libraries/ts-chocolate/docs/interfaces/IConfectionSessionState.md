[Home](../README.md) > IConfectionSessionState

# Interface: IConfectionSessionState

Read-only view of confection session state

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

[sessionId](./IConfectionSessionState.sessionId.md)

</td><td>

`readonly`

</td><td>

[SessionSpec](../type-aliases/SessionSpec.md)

</td><td>

Unique session identifier

</td></tr>
<tr><td>

[sourceConfection](./IConfectionSessionState.sourceConfection.md)

</td><td>

`readonly`

</td><td>

[IConfectionBase](IConfectionBase.md)

</td><td>

Source confection being edited

</td></tr>
<tr><td>

[mold](./IConfectionSessionState.mold.md)

</td><td>

`readonly`

</td><td>

[ISessionMold](ISessionMold.md)

</td><td>

Current mold selection (for molded bonbons)

</td></tr>
<tr><td>

[chocolates](./IConfectionSessionState.chocolates.md)

</td><td>

`readonly`

</td><td>

ReadonlyMap&lt;[ChocolateRole](../type-aliases/ChocolateRole.md), [ISessionChocolate](ISessionChocolate.md)&gt;

</td><td>

Current chocolate selections by role

</td></tr>
<tr><td>

[yield](./IConfectionSessionState.yield.md)

</td><td>

`readonly`

</td><td>

[ISessionYield](ISessionYield.md)

</td><td>

Current yield state

</td></tr>
<tr><td>

[procedure](./IConfectionSessionState.procedure.md)

</td><td>

`readonly`

</td><td>

[ISessionProcedure](ISessionProcedure.md)

</td><td>

Current procedure selection (if applicable)

</td></tr>
<tr><td>

[coating](./IConfectionSessionState.coating.md)

</td><td>

`readonly`

</td><td>

[ISessionCoating](ISessionCoating.md)

</td><td>

Current coating selection (for rolled truffles)

</td></tr>
<tr><td>

[isDirty](./IConfectionSessionState.isDirty.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether the session has unsaved modifications

</td></tr>
<tr><td>

[isJournalingEnabled](./IConfectionSessionState.isJournalingEnabled.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether journaling is enabled

</td></tr>
</tbody></table>
