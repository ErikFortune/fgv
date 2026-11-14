[Home](../README.md) > JsonEditorState

# Class: JsonEditorState

Represents the internal state of a JsonEditor | JsonEditor.

## Constructors

<table><thead><tr><th>

Constructor

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

`constructor(editor, baseOptions, runtimeContext)`

</td><td>



</td><td>

Constructs a new JsonEditorState | JsonEditorState.

</td></tr>
</tbody></table>

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

[editor](./JsonEditorState.editor.md)

</td><td>

`readonly`

</td><td>

[IJsonCloneEditor](../interfaces/IJsonCloneEditor.md)

</td><td>

The IJsonCloneEditor | editor for which this state applies.

</td></tr>
<tr><td>

[options](./JsonEditorState.options.md)

</td><td>

`readonly`

</td><td>

[IJsonEditorOptions](../interfaces/IJsonEditorOptions.md)

</td><td>

Fully resolved IJsonEditorOptions | editor options that apply

</td></tr>
<tr><td>

[context](./JsonEditorState.context.md)

</td><td>

`readonly`

</td><td>

[IJsonContext](../interfaces/IJsonContext.md) | undefined

</td><td>

The optional IJsonContext | JSON context for this state.

</td></tr>
<tr><td>

[deferred](./JsonEditorState.deferred.md)

</td><td>

`readonly`

</td><td>

JsonObject[]

</td><td>

An array of JSON objects that were deferred for merge during

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

[defer(obj)](./JsonEditorState.defer.md)

</td><td>



</td><td>

Adds a supplied `JsonObject` to the deferred list.

</td></tr>
<tr><td>

[getVars(defaultContext)](./JsonEditorState.getVars.md)

</td><td>



</td><td>

Gets a TemplateVars | TemplateVars from the context of this JsonEditorState | JsonEditorState,

</td></tr>
<tr><td>

[getRefs(defaultContext)](./JsonEditorState.getRefs.md)

</td><td>



</td><td>

Gets an IJsonReferenceMap | reference map containing any other values

</td></tr>
<tr><td>

[getContext(defaultContext)](./JsonEditorState.getContext.md)

</td><td>



</td><td>

Gets the context of this JsonEditorState | JsonEditorState or an optionally

</td></tr>
<tr><td>

[extendContext(baseContext, add)](./JsonEditorState.extendContext.md)

</td><td>



</td><td>

Constructs a new IJsonContext | IJsonContext by merging supplied variables

</td></tr>
<tr><td>

[failValidation(rule, message, validation)](./JsonEditorState.failValidation.md)

</td><td>



</td><td>

Helper method to constructs  `DetailedFailure` with appropriate details and messaging

</td></tr>
</tbody></table>
