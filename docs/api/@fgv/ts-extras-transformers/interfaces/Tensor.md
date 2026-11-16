[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-transformers](../README.md) / Tensor

# Interface: Tensor

A typed multi-dimensional array.

**Example:**
```javascript
import { Tensor } from '@huggingface/transformers';
const tensor = new Tensor('float32', [1, 2, 3, 4, 5, 6], [2, 3]);
tensor.dims;    // [2, 3]
tensor.tolist(); // [[1, 2, 3], [4, 5, 6]]
```

## Properties

| Property | Type |
| ------ | ------ |
| <a id="property-ort_tensor"></a> `ort_tensor` | `Tensor` |

## Accessors

### data

#### Get Signature

> **get** **data**(): `any`

The data stored in the tensor.

##### Returns

`any`

***

### dims

#### Get Signature

> **get** **dims**(): `number`[]

Dimensions of the tensor.

##### Returns

`number`[]

#### Set Signature

> **set** **dims**(`value`): `void`

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number`[] |

##### Returns

`void`

***

### location

#### Get Signature

> **get** **location**(): `string`

The location of the tensor data.

##### Returns

`string`

***

### size

#### Get Signature

> **get** **size**(): `number`

The number of elements in the tensor.

##### Returns

`number`

***

### type

#### Get Signature

> **get** **type**(): `"string"` \| `"float32"` \| `"float16"` \| `"float64"` \| `"int8"` \| `"uint8"` \| `"int16"` \| `"uint16"` \| `"int32"` \| `"uint32"` \| `"int64"` \| `"uint64"` \| `"bool"` \| `"uint4"` \| `"int4"`

Type of the tensor.

##### Returns

`"string"` \| `"float32"` \| `"float16"` \| `"float64"` \| `"int8"` \| `"uint8"` \| `"int16"` \| `"uint16"` \| `"int32"` \| `"uint32"` \| `"int64"` \| `"uint64"` \| `"bool"` \| `"uint4"` \| `"int4"`

## Methods

### \_subarray()

> **\_subarray**(`index`, `iterSize`, `iterDims`): `Tensor`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `index` | `number` |
| `iterSize` | `number` |
| `iterDims` | `any` |

#### Returns

`Tensor`

***

### \[iterator\]()

> **\[iterator\]**(): `Iterator`\<`any`\>

Returns an iterator object for iterating over the tensor data in row-major order.
If the tensor has more than one dimension, the iterator will yield subarrays.

#### Returns

`Iterator`\<`any`\>

An iterator object for iterating over the tensor data in row-major order.

***

### add()

> **add**(`val`): `Tensor`

Return a new Tensor with every element added by a constant.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `val` | `number` | The value to add by. |

#### Returns

`Tensor`

The new tensor.

***

### add\_()

> **add\_**(`val`): `Tensor`

Add the tensor by a constant in place.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `val` | `number` | The value to add by. |

#### Returns

`Tensor`

Returns `this`.

***

### argmax()

> **argmax**(`dim?`, `keepdim?`): `Tensor`

Returns the index of the maximum value of all elements in this tensor.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `dim?` | `number` \| `null` | the dimension to reduce. Only `null` (reduce over all elements) is currently supported. |
| `keepdim?` | `boolean` | whether the output tensor has `dim` retained or not. |

#### Returns

`Tensor`

An `int64` scalar tensor containing the index of the maximum value.

#### Throws

If `dim` is not `null`.

***

### argmin()

> **argmin**(`dim?`, `keepdim?`): `Tensor`

Returns the index of the minimum value of all elements in this tensor.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `dim?` | `number` \| `null` | the dimension to reduce. Only `null` (reduce over all elements) is currently supported. |
| `keepdim?` | `boolean` | whether the output tensor has `dim` retained or not. |

#### Returns

`Tensor`

An `int64` scalar tensor containing the index of the minimum value.

#### Throws

If `dim` is not `null`.

***

### clamp()

> **clamp**(`min`, `max`): `Tensor`

Clamps all elements in input into the range [ min, max ]

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `min` | `number` | lower-bound of the range to be clamped to |
| `max` | `number` | upper-bound of the range to be clamped to |

#### Returns

`Tensor`

the output tensor.

***

### clamp\_()

> **clamp\_**(`min`, `max`): `Tensor`

Clamps all elements in input into the range [ min, max ]

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `min` | `number` | lower-bound of the range to be clamped to |
| `max` | `number` | upper-bound of the range to be clamped to |

#### Returns

`Tensor`

the output tensor.

***

### clone()

> **clone**(): `Tensor`

Creates a deep copy of the current Tensor.

#### Returns

`Tensor`

A new Tensor with the same type, data, and dimensions as the original.

***

### dispose()

> **dispose**(): `void`

Releases the underlying ONNX Runtime tensor (e.g., GPU buffers). Do not use the tensor afterwards.

#### Returns

`void`

***

### div()

> **div**(`val`): `Tensor`

Return a new Tensor with every element divided by a constant.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `val` | `number` | The value to divide by. |

#### Returns

`Tensor`

The new tensor.

***

### div\_()

> **div\_**(`val`): `Tensor`

Divide the tensor by a constant in place.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `val` | `number` | The value to divide by. |

#### Returns

`Tensor`

Returns `this`.

***

### flatten()

> **flatten**(`start_dim?`, `end_dim?`): `Tensor`

Flattens input by reshaping it into a one-dimensional tensor.
If `start_dim` or `end_dim` are passed, only dimensions starting with `start_dim`
and ending with `end_dim` are flattened. The order of elements in input is unchanged.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `start_dim?` | `number` | the first dim to flatten |
| `end_dim?` | `number` | the last dim to flatten |

#### Returns

`Tensor`

The flattened tensor.

***

### flatten\_()

> **flatten\_**(`start_dim?`, `end_dim?`): `Tensor`

In-place version of

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `start_dim?` | `number` | the first dim to flatten |
| `end_dim?` | `number` | the last dim to flatten |

#### Returns

`Tensor`

`this`, flattened along the specified dimensions.

#### See

[Tensor.flatten](#flatten)

***

### gt()

> **gt**(`val`): `Tensor`

Computes input > val element-wise.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `val` | `number` | The value to compare with. |

#### Returns

`Tensor`

A boolean tensor that is `true` where input is greater than other and `false` elsewhere.

***

### item()

> **item**(): `number` \| `bigint`

Returns the value of this tensor as a standard JavaScript Number. This only works
for tensors with one element. For other cases, see `Tensor.tolist()`.

#### Returns

`number` \| `bigint`

The value of this tensor as a standard JavaScript Number.

#### Throws

If the tensor has more than one element.

***

### lt()

> **lt**(`val`): `Tensor`

Computes input < val element-wise.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `val` | `number` | The value to compare with. |

#### Returns

`Tensor`

A boolean tensor that is `true` where input is less than other and `false` elsewhere.

***

### map()

> **map**(`callback`): `Tensor`

Return a new Tensor with a callback function applied to each element.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback` | `Function` | The function to apply to each element. It should take three arguments: the current element, its index, and the tensor's data array. |

#### Returns

`Tensor`

A new Tensor with the callback function applied to each element.

***

### map\_()

> **map\_**(`callback`): `Tensor`

Apply a callback function to each element of the tensor in place.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback` | `Function` | The function to apply to each element. It should take three arguments: the current element, its index, and the tensor's data array. |

#### Returns

`Tensor`

Returns `this`.

***

### max()

> **max**(`dim?`, `keepdim?`): `Tensor`

Returns the maximum value of each row of this tensor in the given dimension `dim`.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `dim?` | `number` \| `null` | the dimension to reduce. If `null`, the maximum of all elements is computed. |
| `keepdim?` | `boolean` | whether the output tensor has `dim` retained or not. |

#### Returns

`Tensor`

A new tensor with maximum values taken along the specified dimension.

***

### mean()

> **mean**(`dim?`, `keepdim?`): `Tensor`

Returns the mean value of each row of this tensor in the given dimension `dim`.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `dim?` | `number` \| `null` | the dimension to reduce. If `null`, the mean of all elements is computed. |
| `keepdim?` | `boolean` | whether the output tensor has `dim` retained or not. |

#### Returns

`Tensor`

A new tensor with means taken along the specified dimension.

***

### min()

> **min**(`dim?`, `keepdim?`): `Tensor`

Returns the minimum value of each row of this tensor in the given dimension `dim`.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `dim?` | `number` \| `null` | the dimension to reduce. If `null`, the minimum of all elements is computed. |
| `keepdim?` | `boolean` | whether the output tensor has `dim` retained or not. |

#### Returns

`Tensor`

A new tensor with minimum values taken along the specified dimension.

***

### mul()

> **mul**(`val`): `Tensor`

Return a new Tensor with every element multiplied by a constant.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `val` | `number` | The value to multiply by. |

#### Returns

`Tensor`

The new tensor.

***

### mul\_()

> **mul\_**(`val`): `Tensor`

Multiply the tensor by a constant in place.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `val` | `number` | The value to multiply by. |

#### Returns

`Tensor`

Returns `this`.

***

### neg()

> **neg**(): `Tensor`

Returns a new tensor with the negative of the elements of this tensor.

#### Returns

`Tensor`

the output tensor.

***

### neg\_()

> **neg\_**(): `Tensor`

In-place version of

#### Returns

`Tensor`

`this`, with every element negated.

#### See

[Tensor.neg](#neg)

***

### norm()

> **norm**(`p?`, `dim?`, `keepdim?`): `Tensor`

Returns the matrix norm or vector norm of a given tensor.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `p?` | `string` \| `number` | The order of norm |
| `dim?` | `number` \| `null` | Specifies which dimension of the tensor to calculate the norm across. If dim is None, the norm will be calculated across all dimensions of input. |
| `keepdim?` | `boolean` | Whether the output tensors have dim retained or not. |

#### Returns

`Tensor`

The norm of the tensor.

***

### normalize()

> **normalize**(`p?`, `dim?`): `Tensor`

Performs `L_p` normalization of inputs over specified dimension.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `p?` | `number` | The exponent value in the norm formulation |
| `dim?` | `number` | The dimension to reduce |

#### Returns

`Tensor`

The normalized tensor.

***

### normalize\_()

> **normalize\_**(`p?`, `dim?`): `Tensor`

Performs `L_p` normalization of inputs over specified dimension. Operates in place.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `p?` | `number` | The exponent value in the norm formulation |
| `dim?` | `number` | The dimension to reduce |

#### Returns

`Tensor`

`this` for operation chaining.

***

### permute()

> **permute**(...`dims`): `Tensor`

Return a permuted version of this Tensor, according to the provided dimensions.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| ...`dims` | `number`[] | Dimensions to permute. |

#### Returns

`Tensor`

The permuted tensor.

***

### remainder()

> **remainder**(`val`): `Tensor`

Return a new Tensor with the element-wise remainder of division by a constant.
Uses Python-style modulo signs (e.g. `-1 mod 2 = 1`) while preserving the tensor's dtype.
Negative divisors are unsupported for unsigned and boolean tensors.
This operation does not implement PyTorch's dtype promotion or scalar casting rules.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `val` | `number` \| `bigint` | The divisor. |

#### Returns

`Tensor`

The new tensor.

***

### remainder\_()

> **remainder\_**(`val`): `Tensor`

In-place version of

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `val` | `number` \| `bigint` | The divisor. |

#### Returns

`Tensor`

Returns `this`.

#### See

[Tensor.remainder](#remainder)

***

### repeat()

> **repeat**(...`repeats`): `Tensor`

Repeats this tensor along the specified dimensions.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| ...`repeats` | `number`[] | The number of times to repeat this tensor along each dimension. |

#### Returns

`Tensor`

The repeated tensor.

#### Throws

If the number of repeats is less than the number of dimensions.

***

### round()

> **round**(): `Tensor`

Rounds elements of input to the nearest integer.

#### Returns

`Tensor`

the output tensor.

***

### round\_()

> **round\_**(): `this`

In-place version of

#### Returns

`this`

#### See

[Tensor.round](#round)

***

### sigmoid()

> **sigmoid**(): `Tensor`

Return a new Tensor with the sigmoid function applied to each element.

#### Returns

`Tensor`

The tensor with the sigmoid function applied.

***

### sigmoid\_()

> **sigmoid\_**(): `Tensor`

Applies the sigmoid function to the tensor in place.

#### Returns

`Tensor`

Returns `this`.

***

### slice()

> **slice**(...`slices`): `Tensor`

Performs a slice operation on the Tensor along specified dimensions.

Consider a Tensor that has a dimension of [4, 7]:
```
[ 1,  2,  3,  4,  5,  6,  7]
[ 8,  9, 10, 11, 12, 13, 14]
[15, 16, 17, 18, 19, 20, 21]
[22, 23, 24, 25, 26, 27, 28]
```
We can slice against the two dims of row and column, for instance in this
case we can start at the second element, and return to the second last,
like this:
```
tensor.slice([1, -1], [1, -1]);
```
which would return:
```
[  9, 10, 11, 12, 13 ]
[ 16, 17, 18, 19, 20 ]
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| ...`slices` | (`number` \| `number`[] \| `null`)[] | The slice specifications for each dimension. - If a number is given, then a single element is selected. - If an array of two numbers is given, then a range of elements [start, end (exclusive)] is selected. - If null is given, then the entire dimension is selected. |

#### Returns

`Tensor`

A new Tensor containing the selected elements.

#### Throws

If the slice input is invalid.

***

### squeeze()

> **squeeze**(`dim?`): `Tensor`

Returns a tensor with all specified dimensions of input of size 1 removed.

NOTE: The returned tensor shares the storage with the input tensor, so changing the contents of one will change the contents of the other.
If you would like a copy, use `tensor.clone()` before squeezing.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `dim?` | `number` \| `number`[] \| `null` | If given, the input will be squeezed only in the specified dimensions. |

#### Returns

`Tensor`

The squeezed tensor

***

### squeeze\_()

> **squeeze\_**(`dim?`): `Tensor`

In-place version of

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `dim?` | `number` \| `number`[] \| `null` | If given, the input will be squeezed only in the specified dimensions. |

#### Returns

`Tensor`

`this`, with the specified dimensions of size 1 removed.

#### See

[Tensor.squeeze](#squeeze)

***

### stride()

> **stride**(): `number`[]

Compute and return the stride of this tensor.
Stride is the jump necessary to go from one element to the next one in the specified dimension dim.

#### Returns

`number`[]

The stride of this tensor.

***

### sub()

> **sub**(`val`): `Tensor`

Return a new Tensor with every element subtracted by a constant.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `val` | `number` | The value to subtract by. |

#### Returns

`Tensor`

The new tensor.

***

### sub\_()

> **sub\_**(`val`): `Tensor`

Subtract the tensor by a constant in place.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `val` | `number` | The value to subtract by. |

#### Returns

`Tensor`

Returns `this`.

***

### sum()

> **sum**(`dim?`, `keepdim?`): `Tensor`

Returns the sum of each row of the input tensor in the given dimension dim.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `dim?` | `number` \| `null` | The dimension or dimensions to reduce. If `null`, all dimensions are reduced. |
| `keepdim?` | `boolean` | Whether the output tensor has `dim` retained or not. |

#### Returns

`Tensor`

The summed tensor

***

### tile()

> **tile**(...`dims`): `Tensor`

Constructs a tensor by repeating the elements of input. The dims argument specifies the number of repetitions in each dimension.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| ...`dims` | `number`[] | The number of repetitions per dimension. |

#### Returns

`Tensor`

The tiled tensor.

***

### to()

> **to**(`type`): `Tensor`

Performs Tensor dtype conversion.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `type` | `"string"` \| `"float32"` \| `"float16"` \| `"float64"` \| `"int8"` \| `"uint8"` \| `"int16"` \| `"uint16"` \| `"int32"` \| `"uint32"` \| `"int64"` \| `"uint64"` \| `"bool"` \| `"uint4"` \| `"int4"` | The desired data type. |

#### Returns

`Tensor`

The converted tensor.

***

### tolist()

> **tolist**(): `any`[]

Convert tensor data to a n-dimensional JS list

#### Returns

`any`[]

***

### transpose()

> **transpose**(...`dims`): `Tensor`

Return a permuted version of this Tensor, according to the provided dimensions.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| ...`dims` | `number`[] | Dimensions to permute. |

#### Returns

`Tensor`

The permuted tensor.

***

### unsqueeze()

> **unsqueeze**(`dim`): `Tensor`

Returns a new tensor with a dimension of size one inserted at the specified position.

NOTE: The returned tensor shares the same underlying data with this tensor.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `dim` | `number` | The index at which to insert the singleton dimension |

#### Returns

`Tensor`

The unsqueezed tensor

***

### unsqueeze\_()

> **unsqueeze\_**(`dim`): `Tensor`

Returns a new tensor with a dimension of size one inserted at the specified position.

NOTE: The returned tensor shares the same underlying data with this tensor.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `dim` | `number` | The index at which to insert the singleton dimension |

#### Returns

`Tensor`

The unsqueezed tensor

***

### view()

> **view**(...`dims`): `Tensor`

Returns a new tensor with the same data as the `self` tensor but of a different `shape`.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| ...`dims` | `number`[] | the desired size |

#### Returns

`Tensor`

The tensor with the same data but different shape
