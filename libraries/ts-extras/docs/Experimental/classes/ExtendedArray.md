[Home](../../README.md) > [Experimental](../README.md) > ExtendedArray

# Class: ExtendedArray

An experimental array template which extend built-in `Array` to include a handful
of predicates which return `Result<T>`.

**Extends:** `Array<T>`

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

`constructor(itemDescription, items)`

</td><td>



</td><td>

Constructs an Experimental.ExtendedArray | ExtendedArray.

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

[[species]](./ExtendedArray._species_.md)

</td><td>

`readonly` `static`

</td><td>

ArrayConstructor

</td><td>



</td></tr>
<tr><td>

[itemDescription](./ExtendedArray.itemDescription.md)

</td><td>

`readonly`

</td><td>

string

</td><td>



</td></tr>
<tr><td>

[length](./ExtendedArray.length.md)

</td><td>



</td><td>

number

</td><td>

Gets or sets the length of the array.

</td></tr>
<tr><td>

[[unscopables]](./ExtendedArray._unscopables_.md)

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

[isExtendedArray(a)](./ExtendedArray.isExtendedArray.md)

</td><td>

`static`

</td><td>

Type guard to determine if some arbitrary array is an

</td></tr>
<tr><td>

[isArray(arg)](./ExtendedArray.isArray.md)

</td><td>

`static`

</td><td>



</td></tr>
<tr><td>

[from(arrayLike)](./ExtendedArray.from.md)

</td><td>

`static`

</td><td>

Creates an array from an array-like object.

</td></tr>
<tr><td>

[of(items)](./ExtendedArray.of.md)

</td><td>

`static`

</td><td>

Returns a new array from a set of elements.

</td></tr>
<tr><td>

[single(predicate)](./ExtendedArray.single.md)

</td><td>



</td><td>

Determines if this array contains exactly one element which matches

</td></tr>
<tr><td>

[first(failMessage)](./ExtendedArray.first.md)

</td><td>



</td><td>

Returns the first element of an Experimental.ExtendedArray | ExtendedArray.

</td></tr>
<tr><td>

[atLeastOne(failMessage)](./ExtendedArray.atLeastOne.md)

</td><td>



</td><td>

Returns an array containing all elements of an Experimental.ExtendedArray | ExtendedArray.

</td></tr>
<tr><td>

[all()](./ExtendedArray.all.md)

</td><td>



</td><td>

Gets a new (non-extended) `Array` containing all of the elements from this

</td></tr>
<tr><td>

[toString()](./ExtendedArray.toString.md)

</td><td>



</td><td>

Returns a string representation of an array.

</td></tr>
<tr><td>

[toLocaleString()](./ExtendedArray.toLocaleString.md)

</td><td>



</td><td>

Returns a string representation of an array.

</td></tr>
<tr><td>

[pop()](./ExtendedArray.pop.md)

</td><td>



</td><td>

Removes the last element from an array and returns it.

</td></tr>
<tr><td>

[push(items)](./ExtendedArray.push.md)

</td><td>



</td><td>

Appends new elements to the end of an array, and returns the new length of the array.

</td></tr>
<tr><td>

[concat(items)](./ExtendedArray.concat.md)

</td><td>



</td><td>

Combines two or more arrays.

</td></tr>
<tr><td>

[join(separator)](./ExtendedArray.join.md)

</td><td>



</td><td>

Adds all the elements of an array into a string, separated by the specified separator string.

</td></tr>
<tr><td>

[reverse()](./ExtendedArray.reverse.md)

</td><td>



</td><td>

Reverses the elements in an array in place.

</td></tr>
<tr><td>

[shift()](./ExtendedArray.shift.md)

</td><td>



</td><td>

Removes the first element from an array and returns it.

</td></tr>
<tr><td>

[slice(start, end)](./ExtendedArray.slice.md)

</td><td>



</td><td>

Returns a copy of a section of an array.

</td></tr>
<tr><td>

[sort(compareFn)](./ExtendedArray.sort.md)

</td><td>



</td><td>

Sorts an array in place.

</td></tr>
<tr><td>

[splice(start, deleteCount)](./ExtendedArray.splice.md)

</td><td>



</td><td>

Removes elements from an array and, if necessary, inserts new elements in their place, returning the deleted elements.

</td></tr>
<tr><td>

[unshift(items)](./ExtendedArray.unshift.md)

</td><td>



</td><td>

Inserts new elements at the start of an array, and returns the new length of the array.

</td></tr>
<tr><td>

[indexOf(searchElement, fromIndex)](./ExtendedArray.indexOf.md)

</td><td>



</td><td>

Returns the index of the first occurrence of a value in an array, or -1 if it is not present.

</td></tr>
<tr><td>

[lastIndexOf(searchElement, fromIndex)](./ExtendedArray.lastIndexOf.md)

</td><td>



</td><td>

Returns the index of the last occurrence of a specified value in an array, or -1 if it is not present.

</td></tr>
<tr><td>

[every(predicate, thisArg)](./ExtendedArray.every.md)

</td><td>



</td><td>

Determines whether all the members of an array satisfy the specified test.

</td></tr>
<tr><td>

[some(predicate, thisArg)](./ExtendedArray.some.md)

</td><td>



</td><td>

Determines whether the specified callback function returns true for any element of an array.

</td></tr>
<tr><td>

[forEach(callbackfn, thisArg)](./ExtendedArray.forEach.md)

</td><td>



</td><td>

Performs the specified action for each element in an array.

</td></tr>
<tr><td>

[map(callbackfn, thisArg)](./ExtendedArray.map.md)

</td><td>



</td><td>

Calls a defined callback function on each element of an array, and returns an array that contains the results.

</td></tr>
<tr><td>

[filter(predicate, thisArg)](./ExtendedArray.filter.md)

</td><td>



</td><td>

Returns the elements of an array that meet the condition specified in a callback function.

</td></tr>
<tr><td>

[reduce(callbackfn)](./ExtendedArray.reduce.md)

</td><td>



</td><td>

Calls the specified callback function for all the elements in an array.

</td></tr>
<tr><td>

[reduceRight(callbackfn)](./ExtendedArray.reduceRight.md)

</td><td>



</td><td>

Calls the specified callback function for all the elements in an array, in descending order.

</td></tr>
<tr><td>

[find(predicate, thisArg)](./ExtendedArray.find.md)

</td><td>



</td><td>

Returns the value of the first element in the array where predicate is true, and undefined

</td></tr>
<tr><td>

[findIndex(predicate, thisArg)](./ExtendedArray.findIndex.md)

</td><td>



</td><td>

Returns the index of the first element in the array where predicate is true, and -1

</td></tr>
<tr><td>

[fill(value, start, end)](./ExtendedArray.fill.md)

</td><td>



</td><td>

Changes all array elements from `start` to `end` index to a static `value` and returns the modified array

</td></tr>
<tr><td>

[copyWithin(target, start, end)](./ExtendedArray.copyWithin.md)

</td><td>



</td><td>

Returns the this object after copying a section of the array identified by start and end

</td></tr>
<tr><td>

[entries()](./ExtendedArray.entries.md)

</td><td>



</td><td>

Returns an iterable of key, value pairs for every entry in the array

</td></tr>
<tr><td>

[keys()](./ExtendedArray.keys.md)

</td><td>



</td><td>

Returns an iterable of keys in the array

</td></tr>
<tr><td>

[values()](./ExtendedArray.values.md)

</td><td>



</td><td>

Returns an iterable of values in the array

</td></tr>
<tr><td>

[includes(searchElement, fromIndex)](./ExtendedArray.includes.md)

</td><td>



</td><td>

Determines whether an array includes a certain element, returning true or false as appropriate.

</td></tr>
<tr><td>

[flatMap(callback, thisArg)](./ExtendedArray.flatMap.md)

</td><td>



</td><td>

Calls a defined callback function on each element of an array.

</td></tr>
<tr><td>

[flat(this, depth)](./ExtendedArray.flat.md)

</td><td>



</td><td>

Returns a new array with all sub-array elements concatenated into it recursively up to the

</td></tr>
<tr><td>

[[iterator]()](./ExtendedArray._iterator_.md)

</td><td>



</td><td>

Iterator

</td></tr>
<tr><td>

[at(index)](./ExtendedArray.at.md)

</td><td>



</td><td>



</td></tr>
</tbody></table>
