[Home](../README.md) > ConfectionEditingSessionBase

# Class: ConfectionEditingSessionBase

Abstract base class for confection editing sessions.
Manages filling sessions and provides common editing operations.

Subclasses implement type-specific scaling logic:
- MoldedBonBonEditingSession: Frame-based yield with mold change workflow
- BarTruffleEditingSession: Linear scaling by count
- RolledTruffleEditingSession: Linear scaling by count

**Implements:** [`IMaterializedSessionBase`](../interfaces/IMaterializedSessionBase.md)

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

[IFillingSessionMap](../type-aliases/IFillingSessionMap.md)

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
<tr><td>

[baseId](./ConfectionEditingSessionBase.baseId.md)

</td><td>

`readonly`

</td><td>

[BaseSessionId](../type-aliases/BaseSessionId.md)

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

[PersistedSessionStatus](../type-aliases/PersistedSessionStatus.md)

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

[GroupName](../type-aliases/GroupName.md) | undefined

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

readonly [ICategorizedNote](../interfaces/ICategorizedNote.md)[] | undefined

</td><td>

Optional categorized notes.

</td></tr>
<tr><td>

[sourceVariationId](./ConfectionEditingSessionBase.sourceVariationId.md)

</td><td>

`readonly`

</td><td>

[ConfectionRecipeVariationId](../type-aliases/ConfectionRecipeVariationId.md)

</td><td>

Source confection variation ID for this session.

</td></tr>
<tr><td>

[confectionType](./ConfectionEditingSessionBase.confectionType.md)

</td><td>

`readonly`

</td><td>

[ConfectionType](../type-aliases/ConfectionType.md)

</td><td>

Confection type discriminator.

</td></tr>
<tr><td>

[execution](./ConfectionEditingSessionBase.execution.md)

</td><td>

`readonly`

</td><td>

[IExecutionState](../interfaces/IExecutionState.md) | undefined

</td><td>

Execution state for production tracking.

</td></tr>
<tr><td>

[entity](./ConfectionEditingSessionBase.entity.md)

</td><td>

`readonly`

</td><td>

[IConfectionSessionEntity](../interfaces/IConfectionSessionEntity.md)

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

[_computeSlotTargetWeight(slotId)](./ConfectionEditingSessionBase._computeSlotTargetWeight.md)

</td><td>



</td><td>

Computes target weight for a specific filling slot based on current yield.

</td></tr>
<tr><td>

[scaleToYield(yieldSpec)](./ConfectionEditingSessionBase.scaleToYield.md)

</td><td>



</td><td>

Scales to a new yield specification.

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

[toProductionJournalEntry(notes)](./ConfectionEditingSessionBase.toProductionJournalEntry.md)

</td><td>



</td><td>

Creates a production journal entry from this confection session.

</td></tr>
<tr><td>

[analyzeSaveOptions()](./ConfectionEditingSessionBase.analyzeSaveOptions.md)

</td><td>



</td><td>

Analyzes current changes and recommends save options.

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
