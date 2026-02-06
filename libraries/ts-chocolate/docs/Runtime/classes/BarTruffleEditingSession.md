[Home](../../README.md) > [Runtime](../README.md) > BarTruffleEditingSession

# Class: BarTruffleEditingSession

Editing session for bar truffle confections.
Supports linear count-based scaling with proportional filling adjustment.

**Extends:** [`ConfectionEditingSessionBase<IProducedBarTruffleEntity, BarTruffleRecipe>`](../../classes/ConfectionEditingSessionBase.md)

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

[fillingSessions](./ConfectionEditingSessionBase.fillingSessions.md)

</td><td>

`readonly`

</td><td>

[IFillingSessionMap](../../type-aliases/IFillingSessionMap.md)

</td><td>

Gets all filling sessions.

</td></tr>
<tr><td>

[context](./ConfectionEditingSessionBase.context.md)

</td><td>

`readonly`

</td><td>

[ISessionContext](../../interfaces/ISessionContext.md)

</td><td>

Gets the runtime context.

</td></tr>
<tr><td>

[sessionId](./ConfectionEditingSessionBase.sessionId.md)

</td><td>

`readonly`

</td><td>

[SessionSpec](../../type-aliases/SessionSpec.md)

</td><td>

Gets the session ID.

</td></tr>
<tr><td>

[produced](./ConfectionEditingSessionBase.produced.md)

</td><td>

`readonly`

</td><td>

[ProducedConfectionBase](../../classes/ProducedConfectionBase.md)&lt;T&gt;

</td><td>

Gets the produced confection wrapper.

</td></tr>
<tr><td>

[baseConfection](./ConfectionEditingSessionBase.baseConfection.md)

</td><td>

`readonly`

</td><td>

TRuntime

</td><td>

Gets the base confection.

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

[create(baseConfection, context, params)](./BarTruffleEditingSession.create.md)

</td><td>

`static`

</td><td>

Factory method for creating a BarTruffleEditingSession.

</td></tr>
<tr><td>

[fromPersistedState(baseConfection, history, context, params)](./BarTruffleEditingSession.fromPersistedState.md)

</td><td>

`static`

</td><td>

Restores a BarTruffleEditingSession from persisted state.

</td></tr>
<tr><td>

[scaleToYield(yieldSpec)](./BarTruffleEditingSession.scaleToYield.md)

</td><td>



</td><td>

Scales to new yield specification using linear count-based scaling.

</td></tr>
<tr><td>

[setFillingSlot(slotId, choice)](./ConfectionEditingSessionBase.setFillingSlot.md)

</td><td>



</td><td>

Sets or updates a filling slot.

</td></tr>
<tr><td>

[removeFillingSlot(slotId)](./ConfectionEditingSessionBase.removeFillingSlot.md)

</td><td>



</td><td>

Removes a filling slot.

</td></tr>
<tr><td>

[getFillingSession(slotId)](./ConfectionEditingSessionBase.getFillingSession.md)

</td><td>



</td><td>

Gets the filling session for a specific slot.

</td></tr>
</tbody></table>
