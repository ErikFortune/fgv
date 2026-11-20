[Home](../README.md) > ReferenceMapKeyPolicy

# Class: ReferenceMapKeyPolicy

Policy object responsible for validating or correcting
keys in a IJsonReferenceMap | reference map.

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

`constructor(options, isValid)`

</td><td>



</td><td>

Constructs a new ReferenceMapKeyPolicy | ReferenceMapKeyPolicy.

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

[defaultKeyPredicate(key)](./ReferenceMapKeyPolicy.defaultKeyPredicate.md)

</td><td>

`static`

</td><td>

The static default key name validation predicate rejects keys that contain

</td></tr>
<tr><td>

[isValid(key, item)](./ReferenceMapKeyPolicy.isValid.md)

</td><td>



</td><td>

Determines if a supplied key and item are valid according to the current policy.

</td></tr>
<tr><td>

[validate(key, item, __options)](./ReferenceMapKeyPolicy.validate.md)

</td><td>



</td><td>

Determines if a supplied key and item are valid according to the current policy.

</td></tr>
<tr><td>

[validateItems(items, options)](./ReferenceMapKeyPolicy.validateItems.md)

</td><td>



</td><td>

Validates an array of entries using the validation rules for this policy.

</td></tr>
<tr><td>

[validateMap(map, options)](./ReferenceMapKeyPolicy.validateMap.md)

</td><td>



</td><td>

Validates a `Map\<string, T\>` using the validation rules for this policy.

</td></tr>
</tbody></table>
