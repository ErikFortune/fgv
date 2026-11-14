[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-json-base](../README.md) / \_JsonActivePath

# Class: \_JsonActivePath

**`Internal`**

The objects and arrays the recursive JSON converters and validators are currently inside, with
the key path that reached each. JSON cannot be cyclic, so meeting an object that is already on
the path fails at once, rather than recursing until the stack is exhausted.

## Remarks

The converters and the validators each hold one private instance, shared by their three
recursive members because those call one another. The walk is synchronous, so module-level state
is safe. When the outermost container exits, the state is cleared outright, so an exit cut short
by stack exhaustion cannot leave a stale entry behind to report a false cycle later.

The state is per walk only in the sense that one walk is in progress at a time. A recursive JSON
conversion started *during* another one — from a getter on a value being walked, say — over an
object the outer walk is still inside reports that object as circular, although neither walk
alone would. JSON values have no getters, so this needs a value that is not JSON to begin with:
for example an accessor property on the walked value whose getter itself converts an ancestor of
that value, which then fails as `circular reference at $` from inside the getter.

## Constructors

### Constructor

> **new \_JsonActivePath**(): `_JsonActivePath`

#### Returns

`_JsonActivePath`

## Accessors

### path

#### Get Signature

> **get** **path**(): `string`

The key path to the current position, as `$`, `$.name` or `$[0]`.

##### Returns

`string`

## Methods

### container()

> **container**\<`R`\>(`container`, `onCycle`, `body`): `R`

Runs `body` with `container` on the active path, or reports `circular reference at <path>`
through `onCycle` if `container` is already on it.

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-r"></a> `R` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `container` | `object` | The object or array about to be walked. |
| `onCycle` | (`message`) => `R` | Builds the failure for a circular reference from its message. |
| `body` | () => `R` | The walk. |

#### Returns

`R`

The result of `body`, or of `onCycle`.

***

### member()

> **member**\<`T`\>(`member`, `body`): `T`

Runs `body` with the path extended by one member.

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `member` | `string` \| `number` | An object key or an array index. |
| `body` | () => `T` | The walk of that member. |

#### Returns

`T`

The result of `body`.
