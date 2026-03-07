[Home](../README.md) > Session

# Namespace: Session

## Classes

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[EditingSession](./classes/EditingSession.md)

</td><td>

A mutable editing session for modifying filling recipe variations.

</td></tr>
<tr><td>

[ExecutionRuntime](./classes/ExecutionRuntime.md)

</td><td>

Materializes execution state by combining persisted data with procedure
step definitions to derive production-relevant properties.

</td></tr>
<tr><td>

[ConfectionEditingSession](./classes/ConfectionEditingSession.md)

</td><td>

Factory for creating type-specific confection editing sessions.

</td></tr>
<tr><td>

[ConfectionEditingSessionBase](./classes/ConfectionEditingSessionBase.md)

</td><td>

Abstract base class for confection editing sessions.

</td></tr>
<tr><td>

[MoldedBonBonEditingSession](./classes/MoldedBonBonEditingSession.md)

</td><td>

Editing session for molded bonbon confections.

</td></tr>
<tr><td>

[BarTruffleEditingSession](./classes/BarTruffleEditingSession.md)

</td><td>

Editing session for bar truffle confections.

</td></tr>
<tr><td>

[RolledTruffleEditingSession](./classes/RolledTruffleEditingSession.md)

</td><td>

Editing session for rolled truffle confections.

</td></tr>
<tr><td>

[EditingSessionValidator](./classes/EditingSessionValidator.md)

</td><td>

A wrapper for EditingSession that validates and converts weakly-typed inputs
to strongly-typed branded types before delegating to the underlying session.

</td></tr>
</tbody></table>

## Interfaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[ISaveAnalysis](./interfaces/ISaveAnalysis.md)

</td><td>

Analysis of save options and recommendations based on session changes.

</td></tr>
<tr><td>

[ISaveVariationOptions](./interfaces/ISaveVariationOptions.md)

</td><td>

Options for saving as a new variation of the original recipe.

</td></tr>
<tr><td>

[ISaveAlternativesOptions](./interfaces/ISaveAlternativesOptions.md)

</td><td>

Options for saving by adding ingredients as alternatives.

</td></tr>
<tr><td>

[ISaveNewRecipeOptions](./interfaces/ISaveNewRecipeOptions.md)

</td><td>

Options for saving as an entirely new recipe.

</td></tr>
<tr><td>

[ISaveConfectionVariationOptions](./interfaces/ISaveConfectionVariationOptions.md)

</td><td>

Options for saving confection as a new variation.

</td></tr>
<tr><td>

[ISaveNewConfectionOptions](./interfaces/ISaveNewConfectionOptions.md)

</td><td>

Options for saving confection as entirely new.

</td></tr>
<tr><td>

[ISaveOptions](./interfaces/ISaveOptions.md)

</td><td>

Options for saving an editing session

</td></tr>
<tr><td>

[ISaveResult](./interfaces/ISaveResult.md)

</td><td>

Result of saving an editing session

</td></tr>
<tr><td>

[ISessionMold](./interfaces/ISessionMold.md)

</td><td>

Tracks the selected mold for a confection session

</td></tr>
<tr><td>

[ISessionChocolate](./interfaces/ISessionChocolate.md)

</td><td>

Tracks a chocolate selection by role for a confection session

</td></tr>
<tr><td>

[ISessionYield](./interfaces/ISessionYield.md)

</td><td>

Tracks yield modifications for a confection session

</td></tr>
<tr><td>

[ISessionProcedure](./interfaces/ISessionProcedure.md)

</td><td>

Tracks the selected procedure for a confection session

</td></tr>
<tr><td>

[ISessionCoating](./interfaces/ISessionCoating.md)

</td><td>

Tracks a coating selection for rolled truffles

</td></tr>
<tr><td>

[IConfectionEditingSessionParams](./interfaces/IConfectionEditingSessionParams.md)

</td><td>

Parameters for creating a confection editing session

</td></tr>
<tr><td>

[IConfectionSessionState](./interfaces/IConfectionSessionState.md)

</td><td>

Read-only view of confection session state

</td></tr>
<tr><td>

[IConfectionSaveOptions](./interfaces/IConfectionSaveOptions.md)

</td><td>

Options for saving a confection editing session

</td></tr>
<tr><td>

[IConfectionSaveResult](./interfaces/IConfectionSaveResult.md)

</td><td>

Result of saving a confection editing session

</td></tr>
<tr><td>

[IEmbeddableFillingSession](./interfaces/IEmbeddableFillingSession.md)

</td><td>

Identity-free contract for filling editing sessions.

</td></tr>
<tr><td>

[IMoldChangeAnalysis](./interfaces/IMoldChangeAnalysis.md)

</td><td>

Analysis of mold change impact on a molded bonbon confection.

</td></tr>
<tr><td>

[IStepSummary](./interfaces/IStepSummary.md)

</td><td>

Materialized summary of a procedure step's execution state.

</td></tr>
<tr><td>

[IEditingSessionValidator](./interfaces/IEditingSessionValidator.md)

</td><td>

Full interface for EditingSessionValidator.

</td></tr>
<tr><td>

[IReadOnlyEditingSessionValidator](./interfaces/IReadOnlyEditingSessionValidator.md)

</td><td>

Read-only interface for EditingSessionValidator.

</td></tr>
</tbody></table>

## Type Aliases

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[ConfectionSelectionStatus](./type-aliases/ConfectionSelectionStatus.md)

</td><td>

Status of a confection session selection

</td></tr>
<tr><td>

[IFillingSessionMap](./type-aliases/IFillingSessionMap.md)

</td><td>

Map of filling editing sessions keyed by slot ID.

</td></tr>
<tr><td>

[AnyConfectionEditingSession](./type-aliases/AnyConfectionEditingSession.md)

</td><td>

Union type of all confection editing session types.

</td></tr>
</tbody></table>

## Functions

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[generateJournalId](./functions/generateJournalId.md)

</td><td>

Generates a JournalBaseId in the format YYYY-MM-DD-HHMMSS-xxxxxxxx

</td></tr>
<tr><td>

[generateSessionId](./functions/generateSessionId.md)

</td><td>

Generates a SessionId in the format YYYY-MM-DD-HHMMSS-xxxxxxxx

</td></tr>
<tr><td>

[generateSessionBaseId](./functions/generateSessionBaseId.md)

</td><td>

Generates a SessionBaseId in the format YYYY-MM-DD-HHMMSS-slug.

</td></tr>
<tr><td>

[toSessionSlug](./functions/toSessionSlug.md)

</td><td>

Normalizes a string to a kebab-case slug suitable for use in a session ID.

</td></tr>
<tr><td>

[getCurrentDateString](./functions/getCurrentDateString.md)

</td><td>

Gets the current date as an ISO 8601 date string (YYYY-MM-DD)

</td></tr>
<tr><td>

[getCurrentTimestamp](./functions/getCurrentTimestamp.md)

</td><td>

Gets the current timestamp as an ISO 8601 timestamp string

</td></tr>
</tbody></table>
