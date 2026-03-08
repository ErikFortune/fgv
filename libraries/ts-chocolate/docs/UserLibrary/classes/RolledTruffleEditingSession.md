[Home](../../README.md) > [UserLibrary](../README.md) > RolledTruffleEditingSession

# Class: RolledTruffleEditingSession

Editing session for rolled truffle confections.
Supports linear count-based scaling with proportional filling adjustment.

**Extends:** [`ConfectionEditingSessionBase<IProducedRolledTruffleEntity, TRecipe>`](../../classes/ConfectionEditingSessionBase.md)

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

[produced](./RolledTruffleEditingSession.produced.md)

</td><td>

`readonly`

</td><td>

[ProducedRolledTruffle](../../classes/ProducedRolledTruffle.md)

</td><td>

Narrows the produced getter to return the rolled-truffle-specific wrapper.

</td></tr>
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

[hasChanges](./ConfectionEditingSessionBase.hasChanges.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether the session or any embedded child session has unsaved changes.

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

[BaseSessionId](../../type-aliases/BaseSessionId.md)

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

[PersistedSessionStatus](../../type-aliases/PersistedSessionStatus.md)

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

[GroupName](../../type-aliases/GroupName.md) | undefined

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

readonly [ICategorizedNote](../../interfaces/ICategorizedNote.md)[] | undefined

</td><td>

Optional categorized notes.

</td></tr>
<tr><td>

[sourceVariationId](./ConfectionEditingSessionBase.sourceVariationId.md)

</td><td>

`readonly`

</td><td>

[ConfectionRecipeVariationId](../../type-aliases/ConfectionRecipeVariationId.md)

</td><td>

Source confection variation ID for this session.

</td></tr>
<tr><td>

[confectionType](./ConfectionEditingSessionBase.confectionType.md)

</td><td>

`readonly`

</td><td>

[ConfectionType](../../type-aliases/ConfectionType.md)

</td><td>

Confection type discriminator.

</td></tr>
<tr><td>

[execution](./ConfectionEditingSessionBase.execution.md)

</td><td>

`readonly`

</td><td>

[IExecutionState](../../interfaces/IExecutionState.md) | undefined

</td><td>

Execution state for production tracking.

</td></tr>
<tr><td>

[entity](./ConfectionEditingSessionBase.entity.md)

</td><td>

`readonly`

</td><td>

[IConfectionSessionEntity](../../interfaces/IConfectionSessionEntity.md)

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

[create(baseConfection, context, params)](./RolledTruffleEditingSession.create.md)

</td><td>

`static`

</td><td>

Factory method for creating a RolledTruffleEditingSession.

</td></tr>
<tr><td>

[fromPersistedState(baseConfection, persistedEntity, context, params)](./RolledTruffleEditingSession.fromPersistedState.md)

</td><td>

`static`

</td><td>

Restores a RolledTruffleEditingSession from persisted state.

</td></tr>
<tr><td>

[scaleToYield(yieldSpec)](./RolledTruffleEditingSession.scaleToYield.md)

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
