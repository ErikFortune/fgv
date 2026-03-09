[**@fgv/ts-json-base**](../README.md)

***

[@fgv/ts-json-base](../README.md) / JsonArray

# Interface: JsonArray

A JsonArray is an array containing only valid [JsonValues](../type-aliases/JsonValue.md).

## Extends

- `Array`\<[`JsonValue`](../type-aliases/JsonValue.md)\>

## Indexable

\[`n`: `number`\]: [`JsonValue`](../type-aliases/JsonValue.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="unscopables"></a> `[unscopables]` | `readonly` | `object` | Is an object whose properties have the value 'true' when they will be absent when used in a 'with' statement. |
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
| <a id="length"></a> `length` | `public` | `number` | Gets or sets the length of the array. This is a number one higher than the highest index in the array. |

## Methods

### \[iterator\]()

> **\[iterator\]**(): `ArrayIterator`\<[`JsonValue`](../type-aliases/JsonValue.md)\>

Iterator

#### Returns

`ArrayIterator`\<[`JsonValue`](../type-aliases/JsonValue.md)\>

#### Inherited from

`Array.[iterator]`

***

### at()

> **at**(`index`): [`JsonValue`](../type-aliases/JsonValue.md) \| `undefined`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `index` | `number` |

#### Returns

[`JsonValue`](../type-aliases/JsonValue.md) \| `undefined`

#### Inherited from

`Array.at`

***

### concat()

#### Call Signature

> **concat**(...`items`): [`JsonValue`](../type-aliases/JsonValue.md)[]

Combines two or more arrays.
This method returns a new array without modifying any existing arrays.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| ...`items` | `ConcatArray`\<[`JsonValue`](../type-aliases/JsonValue.md)\>[] | Additional arrays and/or items to add to the end of the array. |

##### Returns

[`JsonValue`](../type-aliases/JsonValue.md)[]

##### Inherited from

`Array.concat`

#### Call Signature

> **concat**(...`items`): [`JsonValue`](../type-aliases/JsonValue.md)[]

Combines two or more arrays.
This method returns a new array without modifying any existing arrays.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| ...`items` | ([`JsonValue`](../type-aliases/JsonValue.md) \| `ConcatArray`\<[`JsonValue`](../type-aliases/JsonValue.md)\>)[] | Additional arrays and/or items to add to the end of the array. |

##### Returns

[`JsonValue`](../type-aliases/JsonValue.md)[]

##### Inherited from

`Array.concat`

***

### copyWithin()

> **copyWithin**(`target`, `start`, `end?`): `this`

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

> **entries**(): `ArrayIterator`\<\[`number`, [`JsonValue`](../type-aliases/JsonValue.md)\]\>

Returns an iterable of key, value pairs for every entry in the array

#### Returns

`ArrayIterator`\<\[`number`, [`JsonValue`](../type-aliases/JsonValue.md)\]\>

#### Inherited from

`Array.entries`

***

### every()

#### Call Signature

> **every**\<`S`\>(`predicate`, `thisArg?`): `this is S[]`

Determines whether all the members of an array satisfy the specified test.

##### Type Parameters

| Type Parameter |
| ------ |
| `S` *extends* [`JsonValue`](../type-aliases/JsonValue.md) |

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

Changes all array elements from `start` to `end` index to a static `value` and returns the modified array

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | [`JsonValue`](../type-aliases/JsonValue.md) | value to fill array section with |
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

Returns the elements of an array that meet the condition specified in a callback function.

##### Type Parameters

| Type Parameter |
| ------ |
| `S` *extends* [`JsonValue`](../type-aliases/JsonValue.md) |

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

> **filter**(`predicate`, `thisArg?`): [`JsonValue`](../type-aliases/JsonValue.md)[]

Returns the elements of an array that meet the condition specified in a callback function.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `predicate` | (`value`, `index`, `array`) => `unknown` | A function that accepts up to three arguments. The filter method calls the predicate function one time for each element in the array. |
| `thisArg?` | `any` | An object to which the this keyword can refer in the predicate function. If thisArg is omitted, undefined is used as the this value. |

##### Returns

[`JsonValue`](../type-aliases/JsonValue.md)[]

##### Inherited from

`Array.filter`

***

### find()

#### Call Signature

> **find**\<`S`\>(`predicate`, `thisArg?`): `S` \| `undefined`

Returns the value of the first element in the array where predicate is true, and undefined
otherwise.

##### Type Parameters

| Type Parameter |
| ------ |
| `S` *extends* [`JsonValue`](../type-aliases/JsonValue.md) |

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

> **find**(`predicate`, `thisArg?`): [`JsonValue`](../type-aliases/JsonValue.md) \| `undefined`

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `predicate` | (`value`, `index`, `obj`) => `unknown` |
| `thisArg?` | `any` |

##### Returns

[`JsonValue`](../type-aliases/JsonValue.md) \| `undefined`

##### Inherited from

`Array.find`

***

### findIndex()

> **findIndex**(`predicate`, `thisArg?`): `number`

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

### flat()

> **flat**\<`A`, `D`\>(`this`, `depth?`): `FlatArray`\<`A`, `D`\>[]

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

Determines whether an array includes a certain element, returning true or false as appropriate.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `searchElement` | [`JsonValue`](../type-aliases/JsonValue.md) | The element to search for. |
| `fromIndex?` | `number` | The position in this array at which to begin searching for searchElement. |

#### Returns

`boolean`

#### Inherited from

`Array.includes`

***

### indexOf()

> **indexOf**(`searchElement`, `fromIndex?`): `number`

Returns the index of the first occurrence of a value in an array, or -1 if it is not present.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `searchElement` | [`JsonValue`](../type-aliases/JsonValue.md) | The value to locate in the array. |
| `fromIndex?` | `number` | The array index at which to begin the search. If fromIndex is omitted, the search starts at index 0. |

#### Returns

`number`

#### Inherited from

`Array.indexOf`

***

### join()

> **join**(`separator?`): `string`

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

Returns an iterable of keys in the array

#### Returns

`ArrayIterator`\<`number`\>

#### Inherited from

`Array.keys`

***

### lastIndexOf()

> **lastIndexOf**(`searchElement`, `fromIndex?`): `number`

Returns the index of the last occurrence of a specified value in an array, or -1 if it is not present.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `searchElement` | [`JsonValue`](../type-aliases/JsonValue.md) | The value to locate in the array. |
| `fromIndex?` | `number` | The array index at which to begin searching backward. If fromIndex is omitted, the search starts at the last index in the array. |

#### Returns

`number`

#### Inherited from

`Array.lastIndexOf`

***

### map()

> **map**\<`U`\>(`callbackfn`, `thisArg?`): `U`[]

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

> **pop**(): [`JsonValue`](../type-aliases/JsonValue.md) \| `undefined`

Removes the last element from an array and returns it.
If the array is empty, undefined is returned and the array is not modified.

#### Returns

[`JsonValue`](../type-aliases/JsonValue.md) \| `undefined`

#### Inherited from

`Array.pop`

***

### push()

> **push**(...`items`): `number`

Appends new elements to the end of an array, and returns the new length of the array.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| ...`items` | [`JsonValue`](../type-aliases/JsonValue.md)[] | New elements to add to the array. |

#### Returns

`number`

#### Inherited from

`Array.push`

***

### reduce()

#### Call Signature

> **reduce**(`callbackfn`): [`JsonValue`](../type-aliases/JsonValue.md)

Calls the specified callback function for all the elements in an array. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callbackfn` | (`previousValue`, `currentValue`, `currentIndex`, `array`) => [`JsonValue`](../type-aliases/JsonValue.md) | A function that accepts up to four arguments. The reduce method calls the callbackfn function one time for each element in the array. |

##### Returns

[`JsonValue`](../type-aliases/JsonValue.md)

##### Inherited from

`Array.reduce`

#### Call Signature

> **reduce**(`callbackfn`, `initialValue`): [`JsonValue`](../type-aliases/JsonValue.md)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `callbackfn` | (`previousValue`, `currentValue`, `currentIndex`, `array`) => [`JsonValue`](../type-aliases/JsonValue.md) |
| `initialValue` | [`JsonValue`](../type-aliases/JsonValue.md) |

##### Returns

[`JsonValue`](../type-aliases/JsonValue.md)

##### Inherited from

`Array.reduce`

#### Call Signature

> **reduce**\<`U`\>(`callbackfn`, `initialValue`): `U`

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

> **reduceRight**(`callbackfn`): [`JsonValue`](../type-aliases/JsonValue.md)

Calls the specified callback function for all the elements in an array, in descending order. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callbackfn` | (`previousValue`, `currentValue`, `currentIndex`, `array`) => [`JsonValue`](../type-aliases/JsonValue.md) | A function that accepts up to four arguments. The reduceRight method calls the callbackfn function one time for each element in the array. |

##### Returns

[`JsonValue`](../type-aliases/JsonValue.md)

##### Inherited from

`Array.reduceRight`

#### Call Signature

> **reduceRight**(`callbackfn`, `initialValue`): [`JsonValue`](../type-aliases/JsonValue.md)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `callbackfn` | (`previousValue`, `currentValue`, `currentIndex`, `array`) => [`JsonValue`](../type-aliases/JsonValue.md) |
| `initialValue` | [`JsonValue`](../type-aliases/JsonValue.md) |

##### Returns

[`JsonValue`](../type-aliases/JsonValue.md)

##### Inherited from

`Array.reduceRight`

#### Call Signature

> **reduceRight**\<`U`\>(`callbackfn`, `initialValue`): `U`

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

> **reverse**(): [`JsonValue`](../type-aliases/JsonValue.md)[]

Reverses the elements in an array in place.
This method mutates the array and returns a reference to the same array.

#### Returns

[`JsonValue`](../type-aliases/JsonValue.md)[]

#### Inherited from

`Array.reverse`

***

### shift()

> **shift**(): [`JsonValue`](../type-aliases/JsonValue.md) \| `undefined`

Removes the first element from an array and returns it.
If the array is empty, undefined is returned and the array is not modified.

#### Returns

[`JsonValue`](../type-aliases/JsonValue.md) \| `undefined`

#### Inherited from

`Array.shift`

***

### slice()

> **slice**(`start?`, `end?`): [`JsonValue`](../type-aliases/JsonValue.md)[]

Returns a copy of a section of an array.
For both start and end, a negative index can be used to indicate an offset from the end of the array.
For example, -2 refers to the second to last element of the array.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `start?` | `number` | The beginning index of the specified portion of the array. If start is undefined, then the slice begins at index 0. |
| `end?` | `number` | The end index of the specified portion of the array. This is exclusive of the element at the index 'end'. If end is undefined, then the slice extends to the end of the array. |

#### Returns

[`JsonValue`](../type-aliases/JsonValue.md)[]

#### Inherited from

`Array.slice`

***

### some()

> **some**(`predicate`, `thisArg?`): `boolean`

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

> **splice**(`start`, `deleteCount?`): [`JsonValue`](../type-aliases/JsonValue.md)[]

Removes elements from an array and, if necessary, inserts new elements in their place, returning the deleted elements.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `start` | `number` | The zero-based location in the array from which to start removing elements. |
| `deleteCount?` | `number` | The number of elements to remove. Omitting this argument will remove all elements from the start paramater location to end of the array. If value of this argument is either a negative number, zero, undefined, or a type that cannot be converted to an integer, the function will evaluate the argument as zero and not remove any elements. |

##### Returns

[`JsonValue`](../type-aliases/JsonValue.md)[]

An array containing the elements that were deleted.

##### Inherited from

`Array.splice`

#### Call Signature

> **splice**(`start`, `deleteCount`, ...`items`): [`JsonValue`](../type-aliases/JsonValue.md)[]

Removes elements from an array and, if necessary, inserts new elements in their place, returning the deleted elements.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `start` | `number` | The zero-based location in the array from which to start removing elements. |
| `deleteCount` | `number` | The number of elements to remove. If value of this argument is either a negative number, zero, undefined, or a type that cannot be converted to an integer, the function will evaluate the argument as zero and not remove any elements. |
| ...`items` | [`JsonValue`](../type-aliases/JsonValue.md)[] | Elements to insert into the array in place of the deleted elements. |

##### Returns

[`JsonValue`](../type-aliases/JsonValue.md)[]

An array containing the elements that were deleted.

##### Inherited from

`Array.splice`

***

### toLocaleString()

#### Call Signature

> **toLocaleString**(): `string`

Returns a string representation of an array. The elements are converted to string using their toLocaleString methods.

##### Returns

`string`

##### Inherited from

`Array.toLocaleString`

#### Call Signature

> **toLocaleString**(`locales`, `options?`): `string`

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

Returns a string representation of an array.

#### Returns

`string`

#### Inherited from

`Array.toString`

***

### unshift()

> **unshift**(...`items`): `number`

Inserts new elements at the start of an array, and returns the new length of the array.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| ...`items` | [`JsonValue`](../type-aliases/JsonValue.md)[] | Elements to insert at the start of the array. |

#### Returns

`number`

#### Inherited from

`Array.unshift`

***

### values()

> **values**(): `ArrayIterator`\<[`JsonValue`](../type-aliases/JsonValue.md)\>

Returns an iterable of values in the array

#### Returns

`ArrayIterator`\<[`JsonValue`](../type-aliases/JsonValue.md)\>

#### Inherited from

`Array.values`
