[Home](../README.md) > Validators

# Namespace: Validators

## Interfaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[IJsonValidatorContext](./interfaces/IJsonValidatorContext.md)

</td><td>

Validation context for in-place JSON validators.

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

[literal](./functions/literal.md)

</td><td>

Helper to create a validator for a literal value.

</td></tr>
<tr><td>

[enumeratedValue](./functions/enumeratedValue.md)

</td><td>

Helper function to create a `Validator` which validates `unknown` to one of a set of
supplied enumerated values.

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

[jsonPrimitive](./variables/jsonPrimitive.md)

</td><td>

An in-place validator which validates that a supplied `unknown` value is

</td></tr>
<tr><td>

[jsonObject](./variables/jsonObject.md)

</td><td>

An in-place validator which validates that a supplied `unknown` value is
a valid JsonObject | JsonObject.

</td></tr>
<tr><td>

[jsonArray](./variables/jsonArray.md)

</td><td>

An in-place validator which validates that a supplied `unknown` value is
a valid JsonArray | JsonArray.

</td></tr>
<tr><td>

[jsonValue](./variables/jsonValue.md)

</td><td>

An in-place validator which validates that a supplied `unknown` value is
a valid JsonValue | JsonValue.

</td></tr>
<tr><td>

[string](./variables/string.md)

</td><td>

A `StringValidator` which validates a string in place.

</td></tr>
<tr><td>

[number](./variables/number.md)

</td><td>

A `NumberValidator` which validates a number in place.

</td></tr>
<tr><td>

[boolean](./variables/boolean.md)

</td><td>

A `BooleanValidator` which validates a boolean in place.

</td></tr>
</tbody></table>
