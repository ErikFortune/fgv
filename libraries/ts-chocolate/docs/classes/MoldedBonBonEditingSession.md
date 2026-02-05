[Home](../README.md) > MoldedBonBonEditingSession

# Class: MoldedBonBonEditingSession

Editing session for molded bonbon confections.
Supports frame-based yield specification and mold change workflow.

**Extends:** [`ConfectionEditingSessionBase<IProducedMoldedBonBonEntity, MoldedBonBon>`](ConfectionEditingSessionBase.md)

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

[pendingMoldChange](./MoldedBonBonEditingSession.pendingMoldChange.md)

</td><td>

`readonly`

</td><td>

[IMoldChangeAnalysis](../interfaces/IMoldChangeAnalysis.md) | undefined

</td><td>

Gets pending mold change analysis, if any.

</td></tr>
<tr><td>

[currentMold](./MoldedBonBonEditingSession.currentMold.md)

</td><td>

`readonly`

</td><td>

[IMold](../interfaces/IMold.md)

</td><td>

Gets the current mold.

</td></tr>
<tr><td>

[fillingSessions](./ConfectionEditingSessionBase.fillingSessions.md)

</td><td>

`readonly`

</td><td>

[IFillingSessionMap](../type-aliases/IFillingSessionMap.md)

</td><td>

Gets all filling sessions.

</td></tr>
<tr><td>

[context](./ConfectionEditingSessionBase.context.md)

</td><td>

`readonly`

</td><td>

[ISessionContext](../interfaces/ISessionContext.md)

</td><td>

Gets the runtime context.

</td></tr>
<tr><td>

[sessionId](./ConfectionEditingSessionBase.sessionId.md)

</td><td>

`readonly`

</td><td>

[SessionSpec](../type-aliases/SessionSpec.md)

</td><td>

Gets the session ID.

</td></tr>
<tr><td>

[produced](./ConfectionEditingSessionBase.produced.md)

</td><td>

`readonly`

</td><td>

[ProducedConfectionBase](ProducedConfectionBase.md)&lt;T&gt;

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

[create(baseConfection, context, params)](./MoldedBonBonEditingSession.create.md)

</td><td>

`static`

</td><td>

Factory method for creating a MoldedBonBonEditingSession.

</td></tr>
<tr><td>

[fromPersistedState(baseConfection, history, context, params)](./MoldedBonBonEditingSession.fromPersistedState.md)

</td><td>

`static`

</td><td>

Restores a MoldedBonBonEditingSession from persisted state.

</td></tr>
<tr><td>

[setFrames(frames, bufferPercentage)](./MoldedBonBonEditingSession.setFrames.md)

</td><td>



</td><td>

Sets frames and buffer percentage for yield calculation.

</td></tr>
<tr><td>

[scaleToYield(yieldSpec)](./MoldedBonBonEditingSession.scaleToYield.md)

</td><td>



</td><td>

Scales to new yield specification.

</td></tr>
<tr><td>

[analyzeMoldChange(moldId)](./MoldedBonBonEditingSession.analyzeMoldChange.md)

</td><td>



</td><td>

Analyzes impact of changing to a new mold.

</td></tr>
<tr><td>

[confirmMoldChange()](./MoldedBonBonEditingSession.confirmMoldChange.md)

</td><td>



</td><td>

Confirms pending mold change and rescales fillings.

</td></tr>
<tr><td>

[cancelMoldChange()](./MoldedBonBonEditingSession.cancelMoldChange.md)

</td><td>



</td><td>

Cancels pending mold change.

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
