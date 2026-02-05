[Home](../../../README.md) > [Runtime](../../README.md) > [Session](../README.md) > ConfectionEditingSessionBase

# Class: ConfectionEditingSessionBase

Abstract base class for confection editing sessions.
Manages filling sessions and provides common editing operations.

Subclasses implement type-specific scaling logic:
- MoldedBonBonEditingSession: Frame-based yield with mold change workflow
- BarTruffleEditingSession: Linear scaling by count
- RolledTruffleEditingSession: Linear scaling by count

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

[getFillingSession(slotId)](./ConfectionEditingSessionBase.getFillingSession.md)

</td><td>



</td><td>

Gets the filling session for a specific slot.

</td></tr>
</tbody></table>
