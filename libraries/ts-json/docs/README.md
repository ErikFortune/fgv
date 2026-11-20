# @fgv/ts-json

## Namespaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[Diff](./Diff/README.md)

</td><td>



</td></tr>
<tr><td>

[Converters](./Converters/README.md)

</td><td>



</td></tr>
<tr><td>

[EditorRules](./EditorRules/README.md)

</td><td>



</td></tr>
</tbody></table>

## Classes

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[JsonEditorConverter](./classes/JsonEditorConverter.md)

</td><td>

A thin wrapper to allow an arbitrary JsonEditor | JsonEditor to be used via the

</td></tr>
<tr><td>

[JsonConverter](./classes/JsonConverter.md)

</td><td>

An @fgv/ts-utils `Converter` from `unknown` to type-safe JSON, optionally

</td></tr>
<tr><td>

[TemplatedJsonConverter](./classes/TemplatedJsonConverter.md)

</td><td>

An @fgv/ts-utils `Converter` from `unknown` to type-safe JSON

</td></tr>
<tr><td>

[ConditionalJsonConverter](./classes/ConditionalJsonConverter.md)

</td><td>

An @fgv/ts-utils `Converter` from `unknown` to type-safe JSON with mustache

</td></tr>
<tr><td>

[RichJsonConverter](./classes/RichJsonConverter.md)

</td><td>

A @fgv/ts-utils `Converter` from `unknown` to type-safe JSON with mustache

</td></tr>
<tr><td>

[CompositeJsonMap](./classes/CompositeJsonMap.md)

</td><td>

A CompositeJsonMap | CompositeJsonMap presents a composed view of one or more other

</td></tr>
<tr><td>

[JsonContextHelper](./classes/JsonContextHelper.md)

</td><td>

Helper class for working with IJsonContext | IJsonContext objects.

</td></tr>
<tr><td>

[JsonEditor](./classes/JsonEditor.md)

</td><td>

A JsonEditor | JsonEditor can be used to edit JSON objects in place or to

</td></tr>
<tr><td>

[JsonEditorRuleBase](./classes/JsonEditorRuleBase.md)

</td><td>

Default base implementation of IJsonEditorRule | IJsonEditorRule returns inapplicable for all operations so that

</td></tr>
<tr><td>

[JsonEditorState](./classes/JsonEditorState.md)

</td><td>

Represents the internal state of a JsonEditor | JsonEditor.

</td></tr>
<tr><td>

[PrefixedJsonMap](./classes/PrefixedJsonMap.md)

</td><td>

A PrefixedJsonMap | PrefixedJsonMap enforces a supplied prefix for all contained values,

</td></tr>
<tr><td>

[ReferenceMapKeyPolicy](./classes/ReferenceMapKeyPolicy.md)

</td><td>

Policy object responsible for validating or correcting

</td></tr>
<tr><td>

[SimpleJsonMap](./classes/SimpleJsonMap.md)

</td><td>

A SimpleJsonMap | SimpleJsonMap presents a view of a simple map

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

[IJsonConverterOptions](./interfaces/IJsonConverterOptions.md)

</td><td>

Conversion options for JsonConverter | JsonConverter.

</td></tr>
<tr><td>

[IJsonEditorMergeOptions](./interfaces/IJsonEditorMergeOptions.md)

</td><td>

Merge options for a JsonEditor | JsonEditor.

</td></tr>
<tr><td>

[IJsonEditorValidationOptions](./interfaces/IJsonEditorValidationOptions.md)

</td><td>

Validation options for a JsonEditor | JsonEditor.

</td></tr>
<tr><td>

[IJsonEditorOptions](./interfaces/IJsonEditorOptions.md)

</td><td>

Initialization options for a JsonEditor | JsonEditor.

</td></tr>
<tr><td>

[IJsonCloneEditor](./interfaces/IJsonCloneEditor.md)

</td><td>

A specialized JSON editor which does a deep clone of a supplied `JsonValue`.

</td></tr>
<tr><td>

[IJsonContext](./interfaces/IJsonContext.md)

</td><td>

Context used to convert or edit JSON objects.

</td></tr>
<tr><td>

[IJsonReferenceMap](./interfaces/IJsonReferenceMap.md)

</td><td>

Interface for a simple map that returns named `JsonValue` values with templating,

</td></tr>
<tr><td>

[IJsonEditorRule](./interfaces/IJsonEditorRule.md)

</td><td>

An IJsonEditorRule | IJsonEditorRule represents a single configurable

</td></tr>
<tr><td>

[IReferenceMapKeyPolicyValidateOptions](./interfaces/IReferenceMapKeyPolicyValidateOptions.md)

</td><td>

Options for creating a ReferenceMapKeyPolicy | ReferenceMapKeyPolicy object.

</td></tr>
<tr><td>

[ISimpleJsonMapOptions](./interfaces/ISimpleJsonMapOptions.md)

</td><td>

Initialization options for a SimpleJsonMap | SimpleJsonMap.

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

[TemplatedJsonConverterOptions](./type-aliases/TemplatedJsonConverterOptions.md)

</td><td>

Initialization options for a TemplatedJsonConverter | TemplatedJsonConverter.

</td></tr>
<tr><td>

[ConditionalJsonConverterOptions](./type-aliases/ConditionalJsonConverterOptions.md)

</td><td>

Options for a ConditionalJsonConverter | ConditionalJsonConverter.

</td></tr>
<tr><td>

[RichJsonConverterOptions](./type-aliases/RichJsonConverterOptions.md)

</td><td>

Initialization options for a RichJsonConverter | RichJsonConverter.

</td></tr>
<tr><td>

[JsonEditFailureReason](./type-aliases/JsonEditFailureReason.md)

</td><td>

Possible `DetailedResult` details for various editor operations.

</td></tr>
<tr><td>

[JsonPropertyEditFailureReason](./type-aliases/JsonPropertyEditFailureReason.md)

</td><td>

Possible `DetailedResult` details for property edit operations.

</td></tr>
<tr><td>

[JsonEditorValidationRules](./type-aliases/JsonEditorValidationRules.md)

</td><td>

Possible validation rules for a JsonEditor | JsonEditor.

</td></tr>
<tr><td>

[ArrayMergeBehavior](./type-aliases/ArrayMergeBehavior.md)

</td><td>

Array merge behavior options for a JsonEditor | JsonEditor.

</td></tr>
<tr><td>

[JsonReferenceMapFailureReason](./type-aliases/JsonReferenceMapFailureReason.md)

</td><td>

Failure reason for IJsonReferenceMap | IJsonReferenceMap lookup, where `'unknown'`

</td></tr>
<tr><td>

[TemplateVars](./type-aliases/TemplateVars.md)

</td><td>

Collection of variables used for template replacement in a JSON edit or

</td></tr>
<tr><td>

[TemplateVarsExtendFunction](./type-aliases/TemplateVarsExtendFunction.md)

</td><td>

Function used to create a new collection of TemplateVars | TemplateVars with

</td></tr>
<tr><td>

[VariableValue](./type-aliases/VariableValue.md)

</td><td>

Describes one value in a TemplateVars | TemplateVars collection of

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

[mergeDefaultJsonConverterOptions](./functions/mergeDefaultJsonConverterOptions.md)

</td><td>

Merges an optionally supplied partial set of IJsonConverterOptions | options with
the default converter options and taking all dynamic rules into account (e.g.

</td></tr>
<tr><td>

[contextFromConverterOptions](./functions/contextFromConverterOptions.md)

</td><td>

Creates a new IJsonContext | JSON context using values supplied in an optional partial

</td></tr>
<tr><td>

[converterOptionsToEditor](./functions/converterOptionsToEditor.md)

</td><td>

Creates a new JsonEditor | JsonEditor from an optionally supplied partial
IJsonConverterOptions | JSON converter options.

</td></tr>
<tr><td>

[defaultExtendVars](./functions/defaultExtendVars.md)

</td><td>

This default implementation of a TemplateVarsExtendFunction | TemplateVarsExtendFunction

</td></tr>
</tbody></table>
