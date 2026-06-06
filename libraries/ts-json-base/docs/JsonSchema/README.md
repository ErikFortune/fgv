[Home](../README.md) > JsonSchema

# Namespace: JsonSchema

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

[IObjectSchemaOptions](./interfaces/IObjectSchemaOptions.md)

</td><td>

Options for the `object` factory.

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
</tbody></table>

## Functions

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
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

Creates a schema node for a JSON `object` with a fixed set of typed properties.

</td></tr>
<tr><td>

[fromJson](./functions/fromJson.md)

</td><td>

Parses a raw JSON Schema object (e.g.

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
</tbody></table>
