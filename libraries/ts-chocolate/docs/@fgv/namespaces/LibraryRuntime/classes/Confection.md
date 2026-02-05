[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / Confection

# Abstract Class: Confection

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confection.ts:63](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/confection.ts#L63)

Static factory for creating runtime confections.
This class cannot be instantiated - use create() to get the appropriate concrete type.

## Example

```typescript
const result = Confection.create(context, id, confection);
if (result.isSuccess()) {
  const confection = result.value;
  if (confection.isMoldedBonBon()) {
    console.log(confection.shellChocolate);
  }
}
```

## Methods

### create()

> `static` **create**(`context`, `id`, `confection`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`AnyConfection`](../type-aliases/AnyConfection.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confection.ts:75](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/confection.ts#L75)

Factory method that auto-detects confection type and returns appropriate concrete class.

#### Parameters

##### context

[`IConfectionContext`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-chocolate/docs)

The runtime context for navigation

##### id

[`ConfectionId`](../../../../type-aliases/ConfectionId.md)

The confection ID

##### confection

[`AnyConfectionEntity`](../../Entities/type-aliases/AnyConfectionEntity.md)

The confection data

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`AnyConfection`](../type-aliases/AnyConfection.md)\>

Success with the appropriate concrete Confection subclass, or Failure for unknown type
