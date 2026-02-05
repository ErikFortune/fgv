[Home](../README.md) > Helpers

# Namespace: Helpers

Helper functions for composite IDs and serialization

## Interfaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[ISerializationOptions](./interfaces/ISerializationOptions.md)

</td><td>

Options for serialization operations.

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

[createIngredientId](./functions/createIngredientId.md)

</td><td>

Creates a composite IngredientId from collection ID and base ID

</td></tr>
<tr><td>

[parseIngredientId](./functions/parseIngredientId.md)

</td><td>

Parses a composite IngredientId into its component parts

</td></tr>
<tr><td>

[getIngredientCollectionId](./functions/getIngredientCollectionId.md)

</td><td>

Gets the collection ID from a composite IngredientId

</td></tr>
<tr><td>

[getIngredientBaseId](./functions/getIngredientBaseId.md)

</td><td>

Gets the base ID from a composite IngredientId

</td></tr>
<tr><td>

[createFillingId](./functions/createFillingId.md)

</td><td>

Creates a composite FillingId from collection ID and base ID

</td></tr>
<tr><td>

[parseFillingId](./functions/parseFillingId.md)

</td><td>

Parses a composite FillingId into its component parts

</td></tr>
<tr><td>

[getFillingCollectionId](./functions/getFillingCollectionId.md)

</td><td>

Gets the collection ID from a composite FillingId

</td></tr>
<tr><td>

[getFillingBaseId](./functions/getFillingBaseId.md)

</td><td>

Gets the base ID from a composite FillingId

</td></tr>
<tr><td>

[createJournalId](./functions/createJournalId.md)

</td><td>

Creates a composite JournalId from collection ID and base journal ID

</td></tr>
<tr><td>

[parseJournalId](./functions/parseJournalId.md)

</td><td>

Parses a composite JournalId into its component parts

</td></tr>
<tr><td>

[getJournalCollectionId](./functions/getJournalCollectionId.md)

</td><td>

Gets the collection ID from a composite JournalId

</td></tr>
<tr><td>

[getJournalBaseId](./functions/getJournalBaseId.md)

</td><td>

Gets the base ID from a composite JournalId

</td></tr>
<tr><td>

[createSessionId](./functions/createSessionId.md)

</td><td>

Creates a composite SessionId | SessionId from CollectionId | collection ID and

</td></tr>
<tr><td>

[parseSessionId](./functions/parseSessionId.md)

</td><td>

Parses a composite SessionId | SessionId into its component parts

</td></tr>
<tr><td>

[getSessionCollectionId](./functions/getSessionCollectionId.md)

</td><td>

Gets the collection ID from a composite SessionId | SessionId.

</td></tr>
<tr><td>

[getSessionBaseId](./functions/getSessionBaseId.md)

</td><td>

Gets the base ID from a composite SessionId | SessionId.

</td></tr>
<tr><td>

[createFillingVersionId](./functions/createFillingVersionId.md)

</td><td>

Creates a composite FillingVersionId from filling ID and version spec

</td></tr>
<tr><td>

[parseFillingVersionId](./functions/parseFillingVersionId.md)

</td><td>

Parses a composite FillingVersionId into its component parts

</td></tr>
<tr><td>

[getFillingVersionFillingId](./functions/getFillingVersionFillingId.md)

</td><td>

Gets the filling ID from a composite FillingVersionId

</td></tr>
<tr><td>

[getFillingVersionSpec](./functions/getFillingVersionSpec.md)

</td><td>

Gets the version spec from a composite FillingVersionId

</td></tr>
<tr><td>

[createConfectionVersionId](./functions/createConfectionVersionId.md)

</td><td>

Creates and validates a confection version ID from component parts.

</td></tr>
<tr><td>

[parseConfectionVersionId](./functions/parseConfectionVersionId.md)

</td><td>

Parses a composite ConfectionVersionId into its component parts

</td></tr>
<tr><td>

[createFillingVersionIdValidated](./functions/createFillingVersionIdValidated.md)

</td><td>

Creates and validates a filling version ID from component parts.

</td></tr>
<tr><td>

[getPreferred](./functions/getPreferred.md)

</td><td>

Gets the preferred option from a collection, if one is specified and exists.

</td></tr>
<tr><td>

[getPreferredOrFirst](./functions/getPreferredOrFirst.md)

</td><td>

Gets the preferred option from a collection, falling back to the first option.

</td></tr>
<tr><td>

[getPreferredId](./functions/getPreferredId.md)

</td><td>

Gets the preferred ID from a simple ID collection, if specified and valid.

</td></tr>
<tr><td>

[getPreferredIdOrFirst](./functions/getPreferredIdOrFirst.md)

</td><td>

Gets the preferred ID from a simple ID collection, falling back to the first ID.

</td></tr>
<tr><td>

[toKebabCase](./functions/toKebabCase.md)

</td><td>

Convert a string to kebab-case.

</td></tr>
<tr><td>

[nameToBaseId](./functions/nameToBaseId.md)

</td><td>

Convert a name to a valid base ID.

</td></tr>
<tr><td>

[generateUniqueBaseId](./functions/generateUniqueBaseId.md)

</td><td>

Generate a unique base ID by appending a counter if needed.

</td></tr>
<tr><td>

[generateUniqueBaseIdFromName](./functions/generateUniqueBaseIdFromName.md)

</td><td>

Generate a unique base ID from a name.

</td></tr>
<tr><td>

[serializeToYaml](./functions/serializeToYaml.md)

</td><td>

Serialize an object to YAML string.

</td></tr>
<tr><td>

[serializeToJson](./functions/serializeToJson.md)

</td><td>

Serialize an object to JSON string.

</td></tr>
</tbody></table>
