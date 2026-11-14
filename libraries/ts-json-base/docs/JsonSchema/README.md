[Home](../README.md) > JsonSchema

# Namespace: JsonSchema

## Classes

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[ValidatedSchemaOptions](./classes/ValidatedSchemaOptions.md)

</td><td>

Options whose annotations `schemaOptions` has checked: `default`

</td></tr>
<tr><td>

[ValidatedNumberOptions](./classes/ValidatedNumberOptions.md)

</td><td>

Options that `numberOptions` or

</td></tr>
<tr><td>

[ValidatedIntegerOptions](./classes/ValidatedIntegerOptions.md)

</td><td>

Options that `integerOptions` has found coherent for an
integer node — in particular, its range holds at least one integer.

</td></tr>
<tr><td>

[ValidatedStringOptions](./classes/ValidatedStringOptions.md)

</td><td>

Options that `stringOptions` has found coherent, which the
`string` factory accepts.

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

[ISchemaValidator](./interfaces/ISchemaValidator.md)

</td><td>

A typed JSON Schema node for the LLM-tool subset.

</td></tr>
<tr><td>

[ISchemaOptions](./interfaces/ISchemaOptions.md)

</td><td>

Common options accepted by every schema factory.

</td></tr>
<tr><td>

[INumberSchemaOptions](./interfaces/INumberSchemaOptions.md)

</td><td>

Options for the `number` and `integer` factories.

</td></tr>
<tr><td>

[IStringSchemaOptions](./interfaces/IStringSchemaOptions.md)

</td><td>

Options for the `string` factory.

</td></tr>
<tr><td>

[IObjectSchemaOptions](./interfaces/IObjectSchemaOptions.md)

</td><td>

Options for the `object` factory.

</td></tr>
<tr><td>

[IFromJsonOptions](./interfaces/IFromJsonOptions.md)

</td><td>

Options for `fromJson`.

</td></tr>
<tr><td>

[ISchemaShapeCapabilities](./interfaces/ISchemaShapeCapabilities.md)

</td><td>

What a wire format does with the two schema shapes whose support varies independently of any

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

[SchemaNodeType](./type-aliases/SchemaNodeType.md)

</td><td>

Discriminant tag carried by every schema node.

</td></tr>
<tr><td>

[Static](./type-aliases/Static.md)

</td><td>

Recover the derived static type `T` from a schema value.

</td></tr>
<tr><td>

[ILlmProperties](./type-aliases/ILlmProperties.md)

</td><td>

A record of property schemas, as accepted by the `object` factory.

</td></tr>
<tr><td>

[OptionalKeys](./type-aliases/OptionalKeys.md)

</td><td>

The keys of `P` whose schemas are optional (wrapped with the `optional` modifier).

</td></tr>
<tr><td>

[RequiredKeys](./type-aliases/RequiredKeys.md)

</td><td>

The keys of `P` whose schemas are required (i.e.

</td></tr>
<tr><td>

[OptionalPropertyStatic](./type-aliases/OptionalPropertyStatic.md)

</td><td>

The static value type carried by an optional property (the inner schema's static type,

</td></tr>
<tr><td>

[Simplify](./type-aliases/Simplify.md)

</td><td>

Flattens an intersection of object types into a single object type for readable derived types.

</td></tr>
<tr><td>

[ObjectStatic](./type-aliases/ObjectStatic.md)

</td><td>

The derived static type for an object built from properties `P`: required keys carry their

</td></tr>
<tr><td>

[OpenObjectStatic](./type-aliases/OpenObjectStatic.md)

</td><td>

The derived static type for an **open** object — one built with
`additionalProperties: true`.

</td></tr>
<tr><td>

[ILlmSchema](./type-aliases/ILlmSchema.md)

</td><td>



</td></tr>
<tr><td>

[ILlmStringSchema](./type-aliases/ILlmStringSchema.md)

</td><td>

Schema node for a JSON `string`.

</td></tr>
<tr><td>

[ILlmNumberSchema](./type-aliases/ILlmNumberSchema.md)

</td><td>

Schema node for a JSON `number` or `integer`.

</td></tr>
<tr><td>

[ILlmBooleanSchema](./type-aliases/ILlmBooleanSchema.md)

</td><td>

Schema node for a JSON `boolean`.

</td></tr>
<tr><td>

[ILlmEnumSchema](./type-aliases/ILlmEnumSchema.md)

</td><td>

Schema node for a closed set of string literals (`enum`).

</td></tr>
<tr><td>

[ILlmOptional](./type-aliases/ILlmOptional.md)

</td><td>

Wrapper marking a property as optional within an object schema.

</td></tr>
<tr><td>

[ILlmArraySchema](./type-aliases/ILlmArraySchema.md)

</td><td>

Schema node for a JSON `array`.

</td></tr>
<tr><td>

[ILlmObjectSchema](./type-aliases/ILlmObjectSchema.md)

</td><td>

Schema node for a JSON `object`.

</td></tr>
<tr><td>

[IAnySchemaOptions](./type-aliases/IAnySchemaOptions.md)

</td><td>

Options for the `anyValue` factory: the annotations only.

</td></tr>
<tr><td>

[PlainSchemaOptions](./type-aliases/PlainSchemaOptions.md)

</td><td>

The options a factory accepts as a plain object literal: the ones that cannot be wrong —

</td></tr>
<tr><td>

[PlainNumberSchemaOptions](./type-aliases/PlainNumberSchemaOptions.md)

</td><td>

The `number` / `integer` options accepted as a plain object literal: the
`plain annotations` and `strict`.

</td></tr>
<tr><td>

[PlainStringSchemaOptions](./type-aliases/PlainStringSchemaOptions.md)

</td><td>

The `string` options accepted as a plain object literal: the
`plain annotations` and `format`, which is an annotation
and cannot be incoherent.

</td></tr>
<tr><td>

[PlainObjectSchemaOptions](./type-aliases/PlainObjectSchemaOptions.md)

</td><td>

The `object` options accepted as a plain object literal: the

</td></tr>
<tr><td>

[PlainAnySchemaOptions](./type-aliases/PlainAnySchemaOptions.md)

</td><td>

The `anyValue` options accepted as a plain object literal: `description` and `title`.

</td></tr>
<tr><td>

[SchemaPatternPredicate](./type-aliases/SchemaPatternPredicate.md)

</td><td>

A compiled pattern: whether a string matches it.

</td></tr>
<tr><td>

[SchemaPatternValidator](./type-aliases/SchemaPatternValidator.md)

</td><td>

Compiles a server-supplied `pattern` for `fromJson`, or refuses it.

</td></tr>
<tr><td>

[SchemaValidatingKeyword](./type-aliases/SchemaValidatingKeyword.md)

</td><td>

A validating keyword: enforced by the validator.

</td></tr>
<tr><td>

[SchemaAnnotationKeyword](./type-aliases/SchemaAnnotationKeyword.md)

</td><td>

An annotation keyword: emitted, never enforced.

</td></tr>
<tr><td>

[SchemaConstraintKeyword](./type-aliases/SchemaConstraintKeyword.md)

</td><td>

A constraint or annotation keyword a schema node can carry beyond its structure.

</td></tr>
<tr><td>

[SchemaKeywordTranslator](./type-aliases/SchemaKeywordTranslator.md)

</td><td>

Rewrites a node to express one keyword in a provider's dialect.

</td></tr>
<tr><td>

[SchemaKeywordRule](./type-aliases/SchemaKeywordRule.md)

</td><td>

What one wire format does with one keyword.

</td></tr>
<tr><td>

[SchemaAnnotationRule](./type-aliases/SchemaAnnotationRule.md)

</td><td>

What one wire format does with one annotation: any `SchemaKeywordRule`, or `'drop'` — removed

</td></tr>
<tr><td>

[SchemaUntypedRule](./type-aliases/SchemaUntypedRule.md)

</td><td>

What a wire format does with a schema that states no `type` — see

</td></tr>
<tr><td>

[SchemaKeywordCapabilities](./type-aliases/SchemaKeywordCapabilities.md)

</td><td>

A wire format's keyword-capability table: a rule for **every** keyword.

</td></tr>
<tr><td>

[SchemaFoldedKeyword](./type-aliases/SchemaFoldedKeyword.md)

</td><td>

A keyword the fold can state in a description: a constraint or annotation keyword, or a

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

[isSchemaValidator](./functions/isSchemaValidator.md)

</td><td>

Whether `value` is an `ISchemaValidator` — i.e.

</td></tr>
<tr><td>

[schemaOptions](./functions/schemaOptions.md)

</td><td>

Checks the annotations every node carries and returns them as

</td></tr>
<tr><td>

[numberOptions](./functions/numberOptions.md)

</td><td>

Checks `number` options for coherence and returns them as

</td></tr>
<tr><td>

[integerOptions](./functions/integerOptions.md)

</td><td>

Checks `integer` options for coherence and returns them as

</td></tr>
<tr><td>

[stringOptions](./functions/stringOptions.md)

</td><td>

Checks `string` options for coherence and returns them as

</td></tr>
<tr><td>

[string](./functions/string.md)

</td><td>

Creates a schema node for a JSON `string`.

</td></tr>
<tr><td>

[number](./functions/number.md)

</td><td>

Creates a schema node for a JSON `number`.

</td></tr>
<tr><td>

[integer](./functions/integer.md)

</td><td>

Creates a schema node for a JSON `integer`.

</td></tr>
<tr><td>

[boolean](./functions/boolean.md)

</td><td>

Creates a schema node for a JSON `boolean`.

</td></tr>
<tr><td>

[enumOf](./functions/enumOf.md)

</td><td>

Creates a schema node for a closed set of string literals.

</td></tr>
<tr><td>

[numberEnumOf](./functions/numberEnumOf.md)

</td><td>

Creates a schema node for a closed set of numbers (pydantic `Literal[1.5, 2]`).

</td></tr>
<tr><td>

[integerEnumOf](./functions/integerEnumOf.md)

</td><td>

Creates a schema node for a closed set of integers (pydantic `Literal[1, 2]`).

</td></tr>
<tr><td>

[booleanEnumOf](./functions/booleanEnumOf.md)

</td><td>

Creates a schema node for a closed set of booleans (a boolean `const`).

</td></tr>
<tr><td>

[anyValue](./functions/anyValue.md)

</td><td>

Creates a schema node that accepts any JSON value — JSON Schema's `{}`, pydantic's `Any`.

</td></tr>
<tr><td>

[optional](./functions/optional.md)

</td><td>

Marks a property schema as optional within an `object` schema.

</td></tr>
<tr><td>

[array](./functions/array.md)

</td><td>

Creates a schema node for a JSON `array` whose elements all match `items`.

</td></tr>
<tr><td>

[object](./functions/object.md)

</td><td>

Creates a schema node for an **open** JSON `object`: typed declared properties, plus any

</td></tr>
<tr><td>

[record](./functions/record.md)

</td><td>

Creates a schema node for a JSON object used as a map: any keys, each value matching `values`

</td></tr>
<tr><td>

[fromJson](./functions/fromJson.md)

</td><td>

Parses a raw JSON Schema object (e.g.

</td></tr>
<tr><td>

[foldedKeywordsText](./functions/foldedKeywordsText.md)

</td><td>

The text that states folded keywords in a description: the validating keywords as one

</td></tr>
<tr><td>

[adaptSchemaKeywords](./functions/adaptSchemaKeywords.md)

</td><td>

Adapts a wire schema's constraint and annotation keywords, and its non-string enums and untyped

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

[jsonSchemaConverter](./variables/jsonSchemaConverter.md)

</td><td>

The main converter.

</td></tr>
<tr><td>

[schemaNumberConstraintKeywords](./variables/schemaNumberConstraintKeywords.md)

</td><td>

The numeric constraint keywords of a `number` / `integer` node, in the order they are checked,

</td></tr>
<tr><td>

[schemaLengthConstraintKeywords](./variables/schemaLengthConstraintKeywords.md)

</td><td>

The length constraint keywords of a `string` node, in the order they are checked, emitted and

</td></tr>
<tr><td>

[schemaPatternConstraintKeywords](./variables/schemaPatternConstraintKeywords.md)

</td><td>

The regular-expression constraint keyword of a `string` node, in the order it is checked, emitted

</td></tr>
<tr><td>

[schemaAnnotationKeywords](./variables/schemaAnnotationKeywords.md)

</td><td>

The annotation keywords — emitted, never enforced — in the order they are folded.

</td></tr>
<tr><td>

[schemaConstraintKeywords](./variables/schemaConstraintKeywords.md)

</td><td>

Every keyword whose provider support varies, and which `adaptSchemaKeywords` adapts: the

</td></tr>
<tr><td>

[unverifiedWireSchemaKeywords](./variables/unverifiedWireSchemaKeywords.md)

</td><td>

The conservative table, for a wire whose support is undocumented: every keyword folds, except
`title` and `default`, which are dropped.

</td></tr>
</tbody></table>
