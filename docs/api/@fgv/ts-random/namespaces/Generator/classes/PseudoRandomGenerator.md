[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-random](../../../README.md) / [Generator](../README.md) / PseudoRandomGenerator

# Class: PseudoRandomGenerator

A pseudo-random number generator that can be used to generate random values
of various shapes.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-rng"></a> `rng` | `public readonly` | [`SeededRandomSource`](SeededRandomSource.md) | The underlying random number generator. |

## Methods

### clone()

> **clone**(): `PseudoRandomGenerator`

Creates a clone of this generator.

#### Returns

`PseudoRandomGenerator`

A new generator with the same state.

***

### createChild()

> **createChild**(`label`): `PseudoRandomGenerator`

Creates a child generator with the given label.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `label` | `string` | The label for the child generator. |

#### Returns

`PseudoRandomGenerator`

A new generator with the given label.

***

### nextBoolean()

> **nextBoolean**(`trueProbability?`): `boolean`

Generates a random boolean value.

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `trueProbability?` | `number` | `0.5` | The probability of returning true (default is 0.5). |

#### Returns

`boolean`

A random boolean value.

***

### nextFloat()

> **nextFloat**(): `number`

Generates a random float between 0 and 1.

#### Returns

`number`

A random float between 0 and 1.

***

### nextInRange()

> **nextInRange**(`min`, `max`): `number`

Generates a random integer between the specified minimum and maximum values.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `min` | `number` \| `undefined` | The minimum value (inclusive). |
| `max` | `number` \| `undefined` | The maximum value (inclusive). |

#### Returns

`number`

A random integer between the specified minimum and maximum values.

#### Remarks

If min is greater than max, the values are swapped.

***

### nextInt()

> **nextInt**(`extent?`): `number`

Generates a random integer between 0 and the specified extent (positive or negative).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `extent?` | `number` | The maximum (or minimum) value (exclusive). |

#### Returns

`number`

A random integer between 0 and the specified extent.

***

### nextString()

> **nextString**(`length`, `chars?`): `string`

Generates a random string of the specified length using the given characters.

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `length` | `number` | `undefined` | The length of the string to generate. |
| `chars?` | `string` | `'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'` | The characters to use for the string (default is alphanumeric). |

#### Returns

`string`

A random string of the specified length.

***

### pickNext()

> **pickNext**\<`T`\>(`items?`): `T` \| `undefined`

Generates a random item from the given array.

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `items?` | readonly `T`[] | The array to select from. |

#### Returns

`T` \| `undefined`

A random item from the array or undefined if the array is empty.

***

### pickRandom()

> **pickRandom**\<`T`\>(`params`): readonly `T`[]

Generates a sequence of values by randomly selecting from the supplied
dictionaries in random order.

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t-1"></a> `T` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IRandomSequencePickParams`](../interfaces/IRandomSequencePickParams.md)\<`T`\> | The parameters for generating the sequence. |

#### Returns

readonly `T`[]

A sequence of values.

***

### pickSequence()

> **pickSequence**\<`T`\>(`params`): readonly `T`[]

Generates a sequence of values by randomly selecting from the given candidates.

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t-2"></a> `T` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`SequencePickParams`](../type-aliases/SequencePickParams.md)\<`T`\> | The parameters for generating the sequence. |

#### Returns

readonly `T`[]

A sequence of values.

***

### pickSequential()

> **pickSequential**\<`T`\>(`params`): readonly `T`[]

Generates a sequence of values by randomly selecting from the given candidate
dictionaries in order.

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t-3"></a> `T` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`ISequentialPickParams`](../interfaces/ISequentialPickParams.md)\<`T`\> | The parameters for generating the sequence. |

#### Returns

readonly `T`[]

A sequence of values.

***

### pickWeighted()

> **pickWeighted**\<`T`\>(`candidates`): `T` \| `undefined`

Chooses one candidate with probability proportional to its weight, drawing
the selecting unit float from this generator.

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t-4"></a> `T` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `candidates` | readonly [`IWeightedCandidate`](../interfaces/IWeightedCandidate.md)\<`T`\>[] | The weighted candidates, in the order to walk them. |

#### Returns

`T` \| `undefined`

The chosen item, or `undefined` if no candidate is eligible.

#### Remarks

Delegates to [pickWeightedAt](../functions/pickWeightedAt.md) with
`this.nextFloat()`, so every edge rule is the same:
- only candidates whose weight is finite and greater than `0` are eligible;
  zero, negative, `NaN` and `±Infinity` weights are never chosen;
- with no eligible candidate (including an empty list) it returns `undefined`;
- eligible candidates are walked in input order with `point < cumulative`, and
  the last eligible candidate wins by elimination;
- weights whose sum overflows are rescaled by the largest eligible weight.

It always consumes exactly one draw, even when it returns `undefined`.

***

### create()

> `static` **create**(`params?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`PseudoRandomGenerator`\>

Creates a new pseudo-random number generator.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params?` | [`IPseudoRandomGeneratorCreateParams`](../interfaces/IPseudoRandomGeneratorCreateParams.md) | The parameters for creating the generator. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`PseudoRandomGenerator`\>

A result containing the new generator or an error.

***

### ensureRng()

> `static` **ensureRng**(`rng?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`PseudoRandomGenerator`\>

Ensures a random number generator is available, using the global generator if available
or creating a new one if not.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `rng?` | `PseudoRandomGenerator` | The random number generator to use, or undefined to use the global one. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`PseudoRandomGenerator`\>

A random number generator.

***

### getGlobalRng()

> `static` **getGlobalRng**(): `PseudoRandomGenerator` \| `undefined`

Gets the global random number generator.

#### Returns

`PseudoRandomGenerator` \| `undefined`

The global random number generator or undefined if not set.

***

### setGlobalRng()

> `static` **setGlobalRng**(`rng?`): `PseudoRandomGenerator` \| `undefined`

Sets this generator as the global random number generator.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `rng?` | `PseudoRandomGenerator` |

#### Returns

`PseudoRandomGenerator` \| `undefined`

A result containing this generator or an error.
