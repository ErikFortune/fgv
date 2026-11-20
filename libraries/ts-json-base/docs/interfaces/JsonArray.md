[Home](../README.md) > JsonArray

# Interface: JsonArray

A JsonArray | JsonArray is an array containing only valid JsonValue | JsonValues.

**Extends:** `Array<JsonValue>`

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

[length](./JsonArray.length.md)

</td><td>



</td><td>

number

</td><td>

Gets or sets the length of the array.

</td></tr>
<tr><td>

[[unscopables]](./JsonArray._unscopables_.md)

</td><td>

`readonly`

</td><td>

{ length?: boolean; toString?: boolean; toLocaleString?: boolean; pop?: boolean; push?: boolean; concat?: boolean; join?: boolean; reverse?: boolean; shift?: boolean; slice?: boolean; sort?: boolean; splice?: boolean; unshift?: boolean; indexOf?: boolean; lastIndexOf?: boolean; every?: boolean; some?: boolean; forEach?: boolean; map?: boolean; filter?: boolean; reduce?: boolean; reduceRight?: boolean; find?: boolean; findIndex?: boolean; fill?: boolean; copyWithin?: boolean; entries?: boolean; keys?: boolean; values?: boolean; includes?: boolean; flatMap?: boolean; flat?: boolean; [iterator]?: boolean; [unscopables]?: boolean; at?: boolean; [key: number]: boolean | undefined }

</td><td>

Is an object whose properties have the value 'true'

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

[toString()](./JsonArray.toString.md)

</td><td>



</td><td>

Returns a string representation of an array.

</td></tr>
<tr><td>

[toLocaleString()](./JsonArray.toLocaleString.md)

</td><td>



</td><td>

Returns a string representation of an array.

</td></tr>
<tr><td>

[pop()](./JsonArray.pop.md)

</td><td>



</td><td>

Removes the last element from an array and returns it.

</td></tr>
<tr><td>

[push(items)](./JsonArray.push.md)

</td><td>



</td><td>

Appends new elements to the end of an array, and returns the new length of the array.

</td></tr>
<tr><td>

[concat(items)](./JsonArray.concat.md)

</td><td>



</td><td>

Combines two or more arrays.

</td></tr>
<tr><td>

[join(separator)](./JsonArray.join.md)

</td><td>



</td><td>

Adds all the elements of an array into a string, separated by the specified separator string.

</td></tr>
<tr><td>

[reverse()](./JsonArray.reverse.md)

</td><td>



</td><td>

Reverses the elements in an array in place.

</td></tr>
<tr><td>

[shift()](./JsonArray.shift.md)

</td><td>



</td><td>

Removes the first element from an array and returns it.

</td></tr>
<tr><td>

[slice(start, end)](./JsonArray.slice.md)

</td><td>



</td><td>

Returns a copy of a section of an array.

</td></tr>
<tr><td>

[sort(compareFn)](./JsonArray.sort.md)

</td><td>



</td><td>

Sorts an array in place.

</td></tr>
<tr><td>

[splice(start, deleteCount)](./JsonArray.splice.md)

</td><td>



</td><td>

Removes elements from an array and, if necessary, inserts new elements in their place, returning the deleted elements.

</td></tr>
<tr><td>

[unshift(items)](./JsonArray.unshift.md)

</td><td>



</td><td>

Inserts new elements at the start of an array, and returns the new length of the array.

</td></tr>
<tr><td>

[indexOf(searchElement, fromIndex)](./JsonArray.indexOf.md)

</td><td>



</td><td>

Returns the index of the first occurrence of a value in an array, or -1 if it is not present.

</td></tr>
<tr><td>

[lastIndexOf(searchElement, fromIndex)](./JsonArray.lastIndexOf.md)

</td><td>



</td><td>

Returns the index of the last occurrence of a specified value in an array, or -1 if it is not present.

</td></tr>
<tr><td>

[every(predicate, thisArg)](./JsonArray.every.md)

</td><td>



</td><td>

Determines whether all the members of an array satisfy the specified test.

</td></tr>
<tr><td>

[some(predicate, thisArg)](./JsonArray.some.md)

</td><td>



</td><td>

Determines whether the specified callback function returns true for any element of an array.

</td></tr>
<tr><td>

[forEach(callbackfn, thisArg)](./JsonArray.forEach.md)

</td><td>



</td><td>

Performs the specified action for each element in an array.

</td></tr>
<tr><td>

[map(callbackfn, thisArg)](./JsonArray.map.md)

</td><td>



</td><td>

Calls a defined callback function on each element of an array, and returns an array that contains the results.

</td></tr>
<tr><td>

[filter(predicate, thisArg)](./JsonArray.filter.md)

</td><td>



</td><td>

Returns the elements of an array that meet the condition specified in a callback function.

</td></tr>
<tr><td>

[reduce(callbackfn)](./JsonArray.reduce.md)

</td><td>



</td><td>

Calls the specified callback function for all the elements in an array.

</td></tr>
<tr><td>

[reduceRight(callbackfn)](./JsonArray.reduceRight.md)

</td><td>



</td><td>

Calls the specified callback function for all the elements in an array, in descending order.

</td></tr>
<tr><td>

[find(predicate, thisArg)](./JsonArray.find.md)

</td><td>



</td><td>

Returns the value of the first element in the array where predicate is true, and undefined

</td></tr>
<tr><td>

[findIndex(predicate, thisArg)](./JsonArray.findIndex.md)

</td><td>



</td><td>

Returns the index of the first element in the array where predicate is true, and -1

</td></tr>
<tr><td>

[fill(value, start, end)](./JsonArray.fill.md)

</td><td>



</td><td>

Changes all array elements from `start` to `end` index to a static `value` and returns the modified array

</td></tr>
<tr><td>

[copyWithin(target, start, end)](./JsonArray.copyWithin.md)

</td><td>



</td><td>

Returns the this object after copying a section of the array identified by start and end

</td></tr>
<tr><td>

[entries()](./JsonArray.entries.md)

</td><td>



</td><td>

Returns an iterable of key, value pairs for every entry in the array

</td></tr>
<tr><td>

[keys()](./JsonArray.keys.md)

</td><td>



</td><td>

Returns an iterable of keys in the array

</td></tr>
<tr><td>

[values()](./JsonArray.values.md)

</td><td>



</td><td>

Returns an iterable of values in the array

</td></tr>
<tr><td>

[includes(searchElement, fromIndex)](./JsonArray.includes.md)

</td><td>



</td><td>

Determines whether an array includes a certain element, returning true or false as appropriate.

</td></tr>
<tr><td>

[flatMap(callback, thisArg)](./JsonArray.flatMap.md)

</td><td>



</td><td>

Calls a defined callback function on each element of an array.

</td></tr>
<tr><td>

[flat(this, depth)](./JsonArray.flat.md)

</td><td>



</td><td>

Returns a new array with all sub-array elements concatenated into it recursively up to the

</td></tr>
<tr><td>

[[iterator]()](./JsonArray._iterator_.md)

</td><td>



</td><td>

Iterator

</td></tr>
<tr><td>

[at(index)](./JsonArray.at.md)

</td><td>



</td><td>



</td></tr>
</tbody></table>
