[**@fgv/ts-extras**](../../../../README.md)

***

[@fgv/ts-extras](../../../../README.md) / [Experimental](../README.md) / ExtendedArray

# Class: ExtendedArray\<T\>

**`Beta`**

An experimental array template which extend built-in `Array` to include a handful
of predicates which return `Result<T>`.

## Extends

- `Array`\<`T`\>

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Indexable

\[`n`: `number`\]: `T`
**`Beta`**

## Constructors

### Constructor

> **new ExtendedArray**\<`T`\>(`itemDescription`, ...`items`): `ExtendedArray`\<`T`\>

**`Beta`**

Constructs an ExtendedArray.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `itemDescription` | `string` | Brief description of the type of each item in this array. |
| ...`items` | `T`[] | The initial contents of the array. |

#### Returns

`ExtendedArray`\<`T`\>

#### Overrides

`Array<T>.constructor`

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="unscopables"></a> `[unscopables]` | `readonly` | `object` | **`Beta`** Is an object whose properties have the value 'true' when they will be absent when used in a 'with' statement. |
| `[unscopables].[iterator]?` | `public` | `boolean` | - |
| `[unscopables].[unscopables]?` | `readonly` | `boolean` | Is an object whose properties have the value 'true' when they will be absent when used in a 'with' statement. |
| `[unscopables].at?` | `public` | `boolean` | - |
| `[unscopables].concat?` | `public` | `boolean` | - |
| `[unscopables].copyWithin?` | `public` | `boolean` | - |
| `[unscopables].entries?` | `public` | `boolean` | - |
| `[unscopables].every?` | `public` | `boolean` | - |
| `[unscopables].fill?` | `public` | `boolean` | - |
| `[unscopables].filter?` | `public` | `boolean` | - |
| `[unscopables].find?` | `public` | `boolean` | - |
| `[unscopables].findIndex?` | `public` | `boolean` | - |
| `[unscopables].flat?` | `public` | `boolean` | - |
| `[unscopables].flatMap?` | `public` | `boolean` | - |
| `[unscopables].forEach?` | `public` | `boolean` | - |
| `[unscopables].includes?` | `public` | `boolean` | - |
| `[unscopables].indexOf?` | `public` | `boolean` | - |
| `[unscopables].join?` | `public` | `boolean` | - |
| `[unscopables].keys?` | `public` | `boolean` | - |
| `[unscopables].lastIndexOf?` | `public` | `boolean` | - |
| `[unscopables].length?` | `public` | `boolean` | Gets or sets the length of the array. This is a number one higher than the highest index in the array. |
| `[unscopables].map?` | `public` | `boolean` | - |
| `[unscopables].pop?` | `public` | `boolean` | - |
| `[unscopables].push?` | `public` | `boolean` | - |
| `[unscopables].reduce?` | `public` | `boolean` | - |
| `[unscopables].reduceRight?` | `public` | `boolean` | - |
| `[unscopables].reverse?` | `public` | `boolean` | - |
| `[unscopables].shift?` | `public` | `boolean` | - |
| `[unscopables].slice?` | `public` | `boolean` | - |
| `[unscopables].some?` | `public` | `boolean` | - |
| `[unscopables].sort?` | `public` | `boolean` | - |
| `[unscopables].splice?` | `public` | `boolean` | - |
| `[unscopables].toLocaleString?` | `public` | `boolean` | - |
| `[unscopables].toString?` | `public` | `boolean` | - |
| `[unscopables].unshift?` | `public` | `boolean` | - |
| `[unscopables].values?` | `public` | `boolean` | - |
| <a id="itemdescription"></a> `itemDescription` | `readonly` | `string` | **`Beta`** |
| <a id="length"></a> `length` | `public` | `number` | **`Beta`** Gets or sets the length of the array. This is a number one higher than the highest index in the array. |
| <a id="species"></a> `[species]` | `readonly` | `ArrayConstructor` | **`Beta`** |

## Methods

### \[iterator\]()

> **\[iterator\]**(): `ArrayIterator`\<`T`\>

**`Beta`**

Iterator

#### Returns

`ArrayIterator`\<`T`\>

#### Inherited from

`Array.[iterator]`

***

### all()

> **all**(): `T`[]

**`Beta`**

Gets a new (non-extended) `Array` containing all of the elements from this
ExtendedArray.

#### Returns

`T`[]

A new (non-extended) `Array<T>`.

***

### at()

> **at**(`index`): `T` \| `undefined`

**`Beta`**

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `index` | `number` |

#### Returns

`T` \| `undefined`

#### Inherited from

`Array.at`

***

### atLeastOne()

> **atLeastOne**(`failMessage?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`[]\>

**`Beta`**

Returns an array containing all elements of an ExtendedArray.
Fails with an error message if the array is empty.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `failMessage?` | `string` | Optional message to be displayed in the event of failure. |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`[]\>

Returns `Success<T>` with a new (non-extended) `Array`
containing the elements of this array, or `Failure<T>` with an error message
if the array is empty.

***

### concat()

#### Call Signature

> **concat**(...`items`): `T`[]

**`Beta`**

Combines two or more arrays.
This method returns a new array without modifying any existing arrays.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| ...`items` | `ConcatArray`\<`T`\>[] | Additional arrays and/or items to add to the end of the array. |

##### Returns

`T`[]

##### Inherited from

`Array.concat`

#### Call Signature

> **concat**(...`items`): `T`[]

**`Beta`**

Combines two or more arrays.
This method returns a new array without modifying any existing arrays.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| ...`items` | (`T` \| `ConcatArray`\<`T`\>)[] | Additional arrays and/or items to add to the end of the array. |

##### Returns

`T`[]

##### Inherited from

`Array.concat`

***

### copyWithin()

> **copyWithin**(`target`, `start`, `end?`): `this`

**`Beta`**

Returns the this object after copying a section of the array identified by start and end
to the same array starting at position target

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `target` | `number` | If target is negative, it is treated as length+target where length is the length of the array. |
| `start` | `number` | If start is negative, it is treated as length+start. If end is negative, it is treated as length+end. |
| `end?` | `number` | If not specified, length of the this object is used as its default value. |

#### Returns

`this`

#### Inherited from

`Array.copyWithin`

***

### entries()

> **entries**(): `ArrayIterator`\<\[`number`, `T`\]\>

**`Beta`**

Returns an iterable of key, value pairs for every entry in the array

#### Returns

`ArrayIterator`\<\[`number`, `T`\]\>

#### Inherited from

`Array.entries`

***

### every()

#### Call Signature

> **every**\<`S`\>(`predicate`, `thisArg?`): `this is S[]`

**`Beta`**

Determines whether all the members of an array satisfy the specified test.

##### Type Parameters

| Type Parameter |
| ------ |
| `S` |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `predicate` | (`value`, `index`, `array`) => `value is S` | A function that accepts up to three arguments. The every method calls the predicate function for each element in the array until the predicate returns a value which is coercible to the Boolean value false, or until the end of the array. |
| `thisArg?` | `any` | An object to which the this keyword can refer in the predicate function. If thisArg is omitted, undefined is used as the this value. |

##### Returns

`this is S[]`

##### Inherited from

`Array.every`

#### Call Signature

> **every**(`predicate`, `thisArg?`): `boolean`

**`Beta`**

Determines whether all the members of an array satisfy the specified test.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `predicate` | (`value`, `index`, `array`) => `unknown` | A function that accepts up to three arguments. The every method calls the predicate function for each element in the array until the predicate returns a value which is coercible to the Boolean value false, or until the end of the array. |
| `thisArg?` | `any` | An object to which the this keyword can refer in the predicate function. If thisArg is omitted, undefined is used as the this value. |

##### Returns

`boolean`

##### Inherited from

`Array.every`

***

### fill()

> **fill**(`value`, `start?`, `end?`): `this`

**`Beta`**

Changes all array elements from `start` to `end` index to a static `value` and returns the modified array

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `T` | value to fill array section with |
| `start?` | `number` | index to start filling the array at. If start is negative, it is treated as length+start where length is the length of the array. |
| `end?` | `number` | index to stop filling the array at. If end is negative, it is treated as length+end. |

#### Returns

`this`

#### Inherited from

`Array.fill`

***

### filter()

#### Call Signature

> **filter**\<`S`\>(`predicate`, `thisArg?`): `S`[]

**`Beta`**

Returns the elements of an array that meet the condition specified in a callback function.

##### Type Parameters

| Type Parameter |
| ------ |
| `S` |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `predicate` | (`value`, `index`, `array`) => `value is S` | A function that accepts up to three arguments. The filter method calls the predicate function one time for each element in the array. |
| `thisArg?` | `any` | An object to which the this keyword can refer in the predicate function. If thisArg is omitted, undefined is used as the this value. |

##### Returns

`S`[]

##### Inherited from

`Array.filter`

#### Call Signature

> **filter**(`predicate`, `thisArg?`): `T`[]

**`Beta`**

Returns the elements of an array that meet the condition specified in a callback function.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `predicate` | (`value`, `index`, `array`) => `unknown` | A function that accepts up to three arguments. The filter method calls the predicate function one time for each element in the array. |
| `thisArg?` | `any` | An object to which the this keyword can refer in the predicate function. If thisArg is omitted, undefined is used as the this value. |

##### Returns

`T`[]

##### Inherited from

`Array.filter`

***

### find()

#### Call Signature

> **find**\<`S`\>(`predicate`, `thisArg?`): `S` \| `undefined`

**`Beta`**

Returns the value of the first element in the array where predicate is true, and undefined
otherwise.

##### Type Parameters

| Type Parameter |
| ------ |
| `S` |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `predicate` | (`value`, `index`, `obj`) => `value is S` | find calls predicate once for each element of the array, in ascending order, until it finds one where predicate returns true. If such an element is found, find immediately returns that element value. Otherwise, find returns undefined. |
| `thisArg?` | `any` | If provided, it will be used as the this value for each invocation of predicate. If it is not provided, undefined is used instead. |

##### Returns

`S` \| `undefined`

##### Inherited from

`Array.find`

#### Call Signature

> **find**(`predicate`, `thisArg?`): `T` \| `undefined`

**`Beta`**

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `predicate` | (`value`, `index`, `obj`) => `unknown` |
| `thisArg?` | `any` |

##### Returns

`T` \| `undefined`

##### Inherited from

`Array.find`

***

### findIndex()

> **findIndex**(`predicate`, `thisArg?`): `number`

**`Beta`**

Returns the index of the first element in the array where predicate is true, and -1
otherwise.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `predicate` | (`value`, `index`, `obj`) => `unknown` | find calls predicate once for each element of the array, in ascending order, until it finds one where predicate returns true. If such an element is found, findIndex immediately returns that element index. Otherwise, findIndex returns -1. |
| `thisArg?` | `any` | If provided, it will be used as the this value for each invocation of predicate. If it is not provided, undefined is used instead. |

#### Returns

`number`

#### Inherited from

`Array.findIndex`

***

### first()

> **first**(`failMessage?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

**`Beta`**

Returns the first element of an ExtendedArray. Fails with an
error message if the array is empty.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `failMessage?` | `string` | Optional message to be displayed in the event of failure. |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

Returns `Success<T>` with the value of the first element
in the array, or `Failure<T>` with an error message if the array is empty.

***

### flat()

> **flat**\<`A`, `D`\>(`this`, `depth?`): `FlatArray`\<`A`, `D`\>[]

**`Beta`**

Returns a new array with all sub-array elements concatenated into it recursively up to the
specified depth.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `A` | - |
| `D` *extends* `number` | `1` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `this` | `A` | - |
| `depth?` | `D` | The maximum recursion depth |

#### Returns

`FlatArray`\<`A`, `D`\>[]

#### Inherited from

`Array.flat`

***

### flatMap()

> **flatMap**\<`U`, `This`\>(`callback`, `thisArg?`): `U`[]

**`Beta`**

Calls a defined callback function on each element of an array. Then, flattens the result into
a new array.
This is identical to a map followed by flat with depth 1.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `U` | - |
| `This` | `undefined` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback` | (`this`, `value`, `index`, `array`) => `U` \| readonly `U`[] | A function that accepts up to three arguments. The flatMap method calls the callback function one time for each element in the array. |
| `thisArg?` | `This` | An object to which the this keyword can refer in the callback function. If thisArg is omitted, undefined is used as the this value. |

#### Returns

`U`[]

#### Inherited from

`Array.flatMap`

***

### forEach()

> **forEach**(`callbackfn`, `thisArg?`): `void`

**`Beta`**

Performs the specified action for each element in an array.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callbackfn` | (`value`, `index`, `array`) => `void` | A function that accepts up to three arguments. forEach calls the callbackfn function one time for each element in the array. |
| `thisArg?` | `any` | An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value. |

#### Returns

`void`

#### Inherited from

`Array.forEach`

***

### includes()

> **includes**(`searchElement`, `fromIndex?`): `boolean`

**`Beta`**

Determines whether an array includes a certain element, returning true or false as appropriate.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `searchElement` | `T` | The element to search for. |
| `fromIndex?` | `number` | The position in this array at which to begin searching for searchElement. |

#### Returns

`boolean`

#### Inherited from

`Array.includes`

***

### indexOf()

> **indexOf**(`searchElement`, `fromIndex?`): `number`

**`Beta`**

Returns the index of the first occurrence of a value in an array, or -1 if it is not present.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `searchElement` | `T` | The value to locate in the array. |
| `fromIndex?` | `number` | The array index at which to begin the search. If fromIndex is omitted, the search starts at index 0. |

#### Returns

`number`

#### Inherited from

`Array.indexOf`

***

### join()

> **join**(`separator?`): `string`

**`Beta`**

Adds all the elements of an array into a string, separated by the specified separator string.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `separator?` | `string` | A string used to separate one element of the array from the next in the resulting string. If omitted, the array elements are separated with a comma. |

#### Returns

`string`

#### Inherited from

`Array.join`

***

### keys()

> **keys**(): `ArrayIterator`\<`number`\>

**`Beta`**

Returns an iterable of keys in the array

#### Returns

`ArrayIterator`\<`number`\>

#### Inherited from

`Array.keys`

***

### lastIndexOf()

> **lastIndexOf**(`searchElement`, `fromIndex?`): `number`

**`Beta`**

Returns the index of the last occurrence of a specified value in an array, or -1 if it is not present.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `searchElement` | `T` | The value to locate in the array. |
| `fromIndex?` | `number` | The array index at which to begin searching backward. If fromIndex is omitted, the search starts at the last index in the array. |

#### Returns

`number`

#### Inherited from

`Array.lastIndexOf`

***

### map()

> **map**\<`U`\>(`callbackfn`, `thisArg?`): `U`[]

**`Beta`**

Calls a defined callback function on each element of an array, and returns an array that contains the results.

#### Type Parameters

| Type Parameter |
| ------ |
| `U` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callbackfn` | (`value`, `index`, `array`) => `U` | A function that accepts up to three arguments. The map method calls the callbackfn function one time for each element in the array. |
| `thisArg?` | `any` | An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value. |

#### Returns

`U`[]

#### Inherited from

`Array.map`

***

### pop()

> **pop**(): `T` \| `undefined`

**`Beta`**

Removes the last element from an array and returns it.
If the array is empty, undefined is returned and the array is not modified.

#### Returns

`T` \| `undefined`

#### Inherited from

`Array.pop`

***

### push()

> **push**(...`items`): `number`

**`Beta`**

Appends new elements to the end of an array, and returns the new length of the array.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| ...`items` | `T`[] | New elements to add to the array. |

#### Returns

`number`

#### Inherited from

`Array.push`

***

### reduce()

#### Call Signature

> **reduce**(`callbackfn`): `T`

**`Beta`**

Calls the specified callback function for all the elements in an array. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callbackfn` | (`previousValue`, `currentValue`, `currentIndex`, `array`) => `T` | A function that accepts up to four arguments. The reduce method calls the callbackfn function one time for each element in the array. |

##### Returns

`T`

##### Inherited from

`Array.reduce`

#### Call Signature

> **reduce**(`callbackfn`, `initialValue`): `T`

**`Beta`**

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `callbackfn` | (`previousValue`, `currentValue`, `currentIndex`, `array`) => `T` |
| `initialValue` | `T` |

##### Returns

`T`

##### Inherited from

`Array.reduce`

#### Call Signature

> **reduce**\<`U`\>(`callbackfn`, `initialValue`): `U`

**`Beta`**

Calls the specified callback function for all the elements in an array. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.

##### Type Parameters

| Type Parameter |
| ------ |
| `U` |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callbackfn` | (`previousValue`, `currentValue`, `currentIndex`, `array`) => `U` | A function that accepts up to four arguments. The reduce method calls the callbackfn function one time for each element in the array. |
| `initialValue` | `U` | If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value. |

##### Returns

`U`

##### Inherited from

`Array.reduce`

***

### reduceRight()

#### Call Signature

> **reduceRight**(`callbackfn`): `T`

**`Beta`**

Calls the specified callback function for all the elements in an array, in descending order. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callbackfn` | (`previousValue`, `currentValue`, `currentIndex`, `array`) => `T` | A function that accepts up to four arguments. The reduceRight method calls the callbackfn function one time for each element in the array. |

##### Returns

`T`

##### Inherited from

`Array.reduceRight`

#### Call Signature

> **reduceRight**(`callbackfn`, `initialValue`): `T`

**`Beta`**

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `callbackfn` | (`previousValue`, `currentValue`, `currentIndex`, `array`) => `T` |
| `initialValue` | `T` |

##### Returns

`T`

##### Inherited from

`Array.reduceRight`

#### Call Signature

> **reduceRight**\<`U`\>(`callbackfn`, `initialValue`): `U`

**`Beta`**

Calls the specified callback function for all the elements in an array, in descending order. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.

##### Type Parameters

| Type Parameter |
| ------ |
| `U` |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callbackfn` | (`previousValue`, `currentValue`, `currentIndex`, `array`) => `U` | A function that accepts up to four arguments. The reduceRight method calls the callbackfn function one time for each element in the array. |
| `initialValue` | `U` | If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value. |

##### Returns

`U`

##### Inherited from

`Array.reduceRight`

***

### reverse()

> **reverse**(): `T`[]

**`Beta`**

Reverses the elements in an array in place.
This method mutates the array and returns a reference to the same array.

#### Returns

`T`[]

#### Inherited from

`Array.reverse`

***

### shift()

> **shift**(): `T` \| `undefined`

**`Beta`**

Removes the first element from an array and returns it.
If the array is empty, undefined is returned and the array is not modified.

#### Returns

`T` \| `undefined`

#### Inherited from

`Array.shift`

***

### single()

> **single**(`predicate?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

**`Beta`**

Determines if this array contains exactly one element which matches
a supplied predicate.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `predicate?` | (`item`) => `boolean` | The predicate function to be applied. |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

Returns `Success<T>` with the single matching
result if exactly one item matches `predicate`.  Returns `Failure<T>`
with an error message if there are no matches or more than one match.

***

### slice()

> **slice**(`start?`, `end?`): `T`[]

**`Beta`**

Returns a copy of a section of an array.
For both start and end, a negative index can be used to indicate an offset from the end of the array.
For example, -2 refers to the second to last element of the array.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `start?` | `number` | The beginning index of the specified portion of the array. If start is undefined, then the slice begins at index 0. |
| `end?` | `number` | The end index of the specified portion of the array. This is exclusive of the element at the index 'end'. If end is undefined, then the slice extends to the end of the array. |

#### Returns

`T`[]

#### Inherited from

`Array.slice`

***

### some()

> **some**(`predicate`, `thisArg?`): `boolean`

**`Beta`**

Determines whether the specified callback function returns true for any element of an array.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `predicate` | (`value`, `index`, `array`) => `unknown` | A function that accepts up to three arguments. The some method calls the predicate function for each element in the array until the predicate returns a value which is coercible to the Boolean value true, or until the end of the array. |
| `thisArg?` | `any` | An object to which the this keyword can refer in the predicate function. If thisArg is omitted, undefined is used as the this value. |

#### Returns

`boolean`

#### Inherited from

`Array.some`

***

### sort()

> **sort**(`compareFn?`): `this`

**`Beta`**

Sorts an array in place.
This method mutates the array and returns a reference to the same array.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `compareFn?` | (`a`, `b`) => `number` | Function used to determine the order of the elements. It is expected to return a negative value if the first argument is less than the second argument, zero if they're equal, and a positive value otherwise. If omitted, the elements are sorted in ascending, UTF-16 code unit order. `[11,2,22,1].sort((a, b) => a - b)` |

#### Returns

`this`

#### Inherited from

`Array.sort`

***

### splice()

#### Call Signature

> **splice**(`start`, `deleteCount?`): `T`[]

**`Beta`**

Removes elements from an array and, if necessary, inserts new elements in their place, returning the deleted elements.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `start` | `number` | The zero-based location in the array from which to start removing elements. |
| `deleteCount?` | `number` | The number of elements to remove. Omitting this argument will remove all elements from the start paramater location to end of the array. If value of this argument is either a negative number, zero, undefined, or a type that cannot be converted to an integer, the function will evaluate the argument as zero and not remove any elements. |

##### Returns

`T`[]

An array containing the elements that were deleted.

##### Inherited from

`Array.splice`

#### Call Signature

> **splice**(`start`, `deleteCount`, ...`items`): `T`[]

**`Beta`**

Removes elements from an array and, if necessary, inserts new elements in their place, returning the deleted elements.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `start` | `number` | The zero-based location in the array from which to start removing elements. |
| `deleteCount` | `number` | The number of elements to remove. If value of this argument is either a negative number, zero, undefined, or a type that cannot be converted to an integer, the function will evaluate the argument as zero and not remove any elements. |
| ...`items` | `T`[] | Elements to insert into the array in place of the deleted elements. |

##### Returns

`T`[]

An array containing the elements that were deleted.

##### Inherited from

`Array.splice`

***

### toLocaleString()

#### Call Signature

> **toLocaleString**(): `string`

**`Beta`**

Returns a string representation of an array. The elements are converted to string using their toLocaleString methods.

##### Returns

`string`

##### Inherited from

`Array.toLocaleString`

#### Call Signature

> **toLocaleString**(`locales`, `options?`): `string`

**`Beta`**

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `locales` | `string` \| `string`[] |
| `options?` | `NumberFormatOptions` & `DateTimeFormatOptions` |

##### Returns

`string`

##### Inherited from

`Array.toLocaleString`

***

### toString()

> **toString**(): `string`

**`Beta`**

Returns a string representation of an array.

#### Returns

`string`

#### Inherited from

`Array.toString`

***

### unshift()

> **unshift**(...`items`): `number`

**`Beta`**

Inserts new elements at the start of an array, and returns the new length of the array.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| ...`items` | `T`[] | Elements to insert at the start of the array. |

#### Returns

`number`

#### Inherited from

`Array.unshift`

***

### values()

> **values**(): `ArrayIterator`\<`T`\>

**`Beta`**

Returns an iterable of values in the array

#### Returns

`ArrayIterator`\<`T`\>

#### Inherited from

`Array.values`

***

### from()

#### Call Signature

> `static` **from**\<`T`\>(`arrayLike`): `T`[]

**`Beta`**

Creates an array from an array-like object.

##### Type Parameters

| Type Parameter |
| ------ |
| `T` |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `arrayLike` | `ArrayLike`\<`T`\> | An array-like object to convert to an array. |

##### Returns

`T`[]

##### Inherited from

`Array.from`

#### Call Signature

> `static` **from**\<`T`, `U`\>(`arrayLike`, `mapfn`, `thisArg?`): `U`[]

**`Beta`**

Creates an array from an iterable object.

##### Type Parameters

| Type Parameter |
| ------ |
| `T` |
| `U` |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `arrayLike` | `ArrayLike`\<`T`\> | An array-like object to convert to an array. |
| `mapfn` | (`v`, `k`) => `U` | A mapping function to call on every element of the array. |
| `thisArg?` | `any` | Value of 'this' used to invoke the mapfn. |

##### Returns

`U`[]

##### Inherited from

`Array.from`

#### Call Signature

> `static` **from**\<`T`\>(`iterable`): `T`[]

**`Beta`**

Creates an array from an iterable object.

##### Type Parameters

| Type Parameter |
| ------ |
| `T` |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterable` | `Iterable`\<`T`, `any`, `any`\> \| `ArrayLike`\<`T`\> | An iterable object to convert to an array. |

##### Returns

`T`[]

##### Inherited from

`Array.from`

#### Call Signature

> `static` **from**\<`T`, `U`\>(`iterable`, `mapfn`, `thisArg?`): `U`[]

**`Beta`**

Creates an array from an iterable object.

##### Type Parameters

| Type Parameter |
| ------ |
| `T` |
| `U` |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterable` | `Iterable`\<`T`, `any`, `any`\> \| `ArrayLike`\<`T`\> | An iterable object to convert to an array. |
| `mapfn` | (`v`, `k`) => `U` | A mapping function to call on every element of the array. |
| `thisArg?` | `any` | Value of 'this' used to invoke the mapfn. |

##### Returns

`U`[]

##### Inherited from

`Array.from`

***

### isArray()

> `static` **isArray**(`arg`): `arg is any[]`

**`Beta`**

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `arg` | `any` |

#### Returns

`arg is any[]`

#### Inherited from

`Array.isArray`

***

### isExtendedArray()

> `static` **isExtendedArray**\<`T`\>(`a?`): `a is ExtendedArray<T>`

**`Beta`**

Type guard to determine if some arbitrary array is an
Experimental.ExtendedArray

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `a?` | `T`[] | The `Array` to be tested. |

#### Returns

`a is ExtendedArray<T>`

Returns `true` if `a` is an ExtendedArray,
`false` otherwise.

***

### of()

> `static` **of**\<`T`\>(...`items`): `T`[]

**`Beta`**

Returns a new array from a set of elements.

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| ...`items` | `T`[] | A set of elements to include in the new array object. |

#### Returns

`T`[]

#### Inherited from

`Array.of`
