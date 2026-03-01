[Home](../README.md) > Model

# Namespace: Model

Branded types and enumerations for the chocolate library

## Namespaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[Enums](./Enums/README.md)

</td><td>



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

[IMeasurementUnitOption](./interfaces/IMeasurementUnitOption.md)

</td><td>

Option wrapper for measurement units (for use with IOptionsWithPreferred).

</td></tr>
<tr><td>

[ICategorizedNote](./interfaces/ICategorizedNote.md)

</td><td>

A categorized note associated with an entity.

</td></tr>
<tr><td>

[ICategorizedUrl](./interfaces/ICategorizedUrl.md)

</td><td>

A categorized URL for linking to external resources.

</td></tr>
<tr><td>

[IHasId](./interfaces/IHasId.md)

</td><td>

Base interface that option types must extend for use with IOptionsWithPreferred.

</td></tr>
<tr><td>

[IOptionsWithPreferred](./interfaces/IOptionsWithPreferred.md)

</td><td>

Collection of options (objects with IDs) with a preferred selection.

</td></tr>
<tr><td>

[IIdsWithPreferred](./interfaces/IIdsWithPreferred.md)

</td><td>

Collection of simple IDs with a preferred selection.

</td></tr>
<tr><td>

[IRefWithNotes](./interfaces/IRefWithNotes.md)

</td><td>

Generic reference type with an ID and optional categorized notes.

</td></tr>
</tbody></table>

## Variables

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[ID_SEPARATOR](./variables/ID_SEPARATOR.md)

</td><td>

Separator character used in composite IDs

</td></tr>
<tr><td>

[BASE_ID_PATTERN](./variables/BASE_ID_PATTERN.md)

</td><td>

Pattern for valid base IDs (no dots allowed)

</td></tr>
<tr><td>

[COMPOSITE_ID_PATTERN](./variables/COMPOSITE_ID_PATTERN.md)

</td><td>

Pattern for valid composite IDs (exactly one dot)

</td></tr>
<tr><td>

[FILLING_RECIPE_VARIATION_SPEC_PATTERN](./variables/FILLING_RECIPE_VARIATION_SPEC_PATTERN.md)

</td><td>

Pattern for valid filling variation specs

</td></tr>
<tr><td>

[VARIATION_ID_SEPARATOR](./variables/VARIATION_ID_SEPARATOR.md)

</td><td>

Separator character used in filling variation IDs (between FillingId and FillingVariationSpec)

</td></tr>
<tr><td>

[FILLING_RECIPE_VARIATION_ID_PATTERN](./variables/FILLING_RECIPE_VARIATION_ID_PATTERN.md)

</td><td>

Pattern for valid filling variation IDs

</td></tr>
<tr><td>

[SESSION_SPEC_PATTERN](./variables/SESSION_SPEC_PATTERN.md)

</td><td>

Pattern for valid session specs

</td></tr>
<tr><td>

[BASE_SESSION_ID_PATTERN](./variables/BASE_SESSION_ID_PATTERN.md)

</td><td>

Pattern for valid base session IDs (within a collection)
Format: YYYY-MM-DD-HHMMSS-slug where slug is a kebab-case identifier
(defaults to an 8-char hex hash when auto-generated).

</td></tr>
<tr><td>

[SESSION_ID_PATTERN](./variables/SESSION_ID_PATTERN.md)

</td><td>

Pattern for valid composite session IDs

</td></tr>
<tr><td>

[BASE_JOURNAL_ID_PATTERN](./variables/BASE_JOURNAL_ID_PATTERN.md)

</td><td>

Pattern for valid journal base IDs (within a collection)

</td></tr>
<tr><td>

[JOURNAL_ID_PATTERN](./variables/JOURNAL_ID_PATTERN.md)

</td><td>

Pattern for valid composite journal IDs

</td></tr>
<tr><td>

[CONFECTION_RECIPE_VARIATION_SPEC_PATTERN](./variables/CONFECTION_RECIPE_VARIATION_SPEC_PATTERN.md)

</td><td>

Pattern for valid confection variation specs

</td></tr>
<tr><td>

[CONFECTION_RECIPE_VARIATION_ID_PATTERN](./variables/CONFECTION_RECIPE_VARIATION_ID_PATTERN.md)

</td><td>

Pattern for valid confection variation IDs

</td></tr>
</tbody></table>
