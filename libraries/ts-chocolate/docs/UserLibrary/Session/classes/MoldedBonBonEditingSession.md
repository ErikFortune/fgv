[Home](../../../README.md) > [UserLibrary](../../README.md) > [Session](../README.md) > MoldedBonBonEditingSession

# Class: MoldedBonBonEditingSession

Editing session for molded bonbon confections.
Supports frame-based yield specification and mold change workflow.

**Extends:** [`ConfectionEditingSessionBase<IProducedMoldedBonBonEntity, TRecipe>`](../../../classes/ConfectionEditingSessionBase.md)

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

[IMoldChangeAnalysis](../../../interfaces/IMoldChangeAnalysis.md) | undefined

</td><td>

Gets pending mold change analysis, if any.

</td></tr>
<tr><td>

[currentMold](./MoldedBonBonEditingSession.currentMold.md)

</td><td>

`readonly`

</td><td>

[IMold](../../../interfaces/IMold.md)

</td><td>

Gets the current mold.

</td></tr>
<tr><td>

[fillingSessions](./ConfectionEditingSessionBase.fillingSessions.md)

</td><td>

`readonly`

</td><td>

[IFillingSessionMap](../../../type-aliases/IFillingSessionMap.md)

</td><td>

Gets all filling sessions.

</td></tr>
<tr><td>

[context](./ConfectionEditingSessionBase.context.md)

</td><td>

`readonly`

</td><td>

[ISessionContext](../../../interfaces/ISessionContext.md)

</td><td>

Gets the runtime context.

</td></tr>
<tr><td>

[sessionId](./ConfectionEditingSessionBase.sessionId.md)

</td><td>

`readonly`

</td><td>

[SessionSpec](../../../type-aliases/SessionSpec.md)

</td><td>

Gets the session ID.

</td></tr>
<tr><td>

[produced](./ConfectionEditingSessionBase.produced.md)

</td><td>

`readonly`

</td><td>

[ProducedConfectionBase](../../../classes/ProducedConfectionBase.md)&lt;T&gt;

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
<tr><td>

[baseId](./ConfectionEditingSessionBase.baseId.md)

</td><td>

`readonly`

</td><td>

[BaseSessionId](../../../type-aliases/BaseSessionId.md)

</td><td>

Base identifier within the collection (no collection prefix).

</td></tr>
<tr><td>

[sessionType](./ConfectionEditingSessionBase.sessionType.md)

</td><td>

`readonly`

</td><td>

"confection"

</td><td>

Session type discriminator - always 'confection' for confection sessions.

</td></tr>
<tr><td>

[status](./ConfectionEditingSessionBase.status.md)

</td><td>

`readonly`

</td><td>

[PersistedSessionStatus](../../../type-aliases/PersistedSessionStatus.md)

</td><td>

Current lifecycle status.

</td></tr>
<tr><td>

[label](./ConfectionEditingSessionBase.label.md)

</td><td>

`readonly`

</td><td>

string | undefined

</td><td>

User-provided label for the session.

</td></tr>
<tr><td>

[group](./ConfectionEditingSessionBase.group.md)

</td><td>

`readonly`

</td><td>

[GroupName](../../../type-aliases/GroupName.md) | undefined

</td><td>

Optional group identifier for organizing related sessions.

</td></tr>
<tr><td>

[createdAt](./ConfectionEditingSessionBase.createdAt.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

ISO 8601 timestamp when session was created.

</td></tr>
<tr><td>

[updatedAt](./ConfectionEditingSessionBase.updatedAt.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

ISO 8601 timestamp when session was last updated.

</td></tr>
<tr><td>

[notes](./ConfectionEditingSessionBase.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](../../../interfaces/ICategorizedNote.md)[] | undefined

</td><td>

Optional categorized notes.

</td></tr>
<tr><td>

[sourceVariationId](./ConfectionEditingSessionBase.sourceVariationId.md)

</td><td>

`readonly`

</td><td>

[ConfectionRecipeVariationId](../../../type-aliases/ConfectionRecipeVariationId.md)

</td><td>

Source confection variation ID for this session.

</td></tr>
<tr><td>

[confectionType](./ConfectionEditingSessionBase.confectionType.md)

</td><td>

`readonly`

</td><td>

[ConfectionType](../../../type-aliases/ConfectionType.md)

</td><td>

Confection type discriminator.

</td></tr>
<tr><td>

[entity](./ConfectionEditingSessionBase.entity.md)

</td><td>

`readonly`

</td><td>

[IConfectionSessionEntity](../../../interfaces/IConfectionSessionEntity.md)

</td><td>

The underlying persisted entity.

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

[fromPersistedState(baseConfection, persistedEntity, context, params)](./MoldedBonBonEditingSession.fromPersistedState.md)

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

[toPersistedState(options)](./ConfectionEditingSessionBase.toPersistedState.md)

</td><td>



</td><td>

Creates a persisted session state from this confection editing session.

</td></tr>
<tr><td>

[getFillingSession(slotId)](./ConfectionEditingSessionBase.getFillingSession.md)

</td><td>



</td><td>

Gets the filling session for a specific slot.

</td></tr>
<tr><td>

[markSaved()](./ConfectionEditingSessionBase.markSaved.md)

</td><td>



</td><td>

Resets the change-detection baseline to the current produced state.

</td></tr>
</tbody></table>
