[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskFieldBounds

# Interface: ITaskFieldBounds

Per-field maxima applied by the value converters.

## Remarks

These bound one field at a time. They are independent of the whole-repository
capacity profile ([ITaskCapacityProfile](ITaskCapacityProfile.md)), and the individual maxima are not
required to fit simultaneously — that is what the aggregate byte dimensions are for.
Construction may lower these bounds; it may not raise them.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-maxcodelength"></a> `maxCodeLength` | `readonly` | `number` | Maximum length of a short coded value — a reason code, a phase, a unit. |
| <a id="property-maxdescriptionlength"></a> `maxDescriptionLength` | `readonly` | `number` | Maximum length of a task description. |
| <a id="property-maxidlength"></a> `maxIdLength` | `readonly` | `number` | Maximum length of an identifier, in UTF-8 bytes. |
| <a id="property-maxreferences"></a> `maxReferences` | `readonly` | `number` | Maximum number of attention or artifact references in one field. |
| <a id="property-maxscopes"></a> `maxScopes` | `readonly` | `number` | Maximum number of scopes on one task. |
| <a id="property-maxsummarylength"></a> `maxSummaryLength` | `readonly` | `number` | Maximum length of a reason, outcome or progress summary. |
| <a id="property-maxtitlelength"></a> `maxTitleLength` | `readonly` | `number` | Maximum length of a task title. |
