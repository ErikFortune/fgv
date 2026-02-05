[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [UserLibrary](../README.md) / UserLibrary

# Class: UserLibrary

Defined in: [ts-chocolate/src/packlets/user-library/userLibrary.ts:50](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/user-library/userLibrary.ts#L50)

Aggregates user-specific data libraries.

Unlike ChocolateLibrary (shared data), UserLibrary contains only
user/installation-specific data with no built-in collections.

## Implements

- [`IUserLibrary`](../interfaces/IUserLibrary.md)

## Properties

### logger

> `readonly` **logger**: [`LogReporter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`unknown`\>

Defined in: [ts-chocolate/src/packlets/user-library/userLibrary.ts:59](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/user-library/userLibrary.ts#L59)

Logger used by this library and its sub-libraries.

## Accessors

### ingredientInventory

#### Get Signature

> **get** **ingredientInventory**(): [`IngredientInventoryLibrary`](../../Entities/classes/IngredientInventoryLibrary.md)

Defined in: [ts-chocolate/src/packlets/user-library/userLibrary.ts:187](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/user-library/userLibrary.ts#L187)

Ingredient inventory library for tracking ingredient stock.

##### Returns

[`IngredientInventoryLibrary`](../../Entities/classes/IngredientInventoryLibrary.md)

Ingredient inventory library for tracking ingredient stock.

#### Implementation of

[`IUserLibrary`](../interfaces/IUserLibrary.md).[`ingredientInventory`](../interfaces/IUserLibrary.md#ingredientinventory)

***

### journals

#### Get Signature

> **get** **journals**(): [`JournalLibrary`](../../Entities/classes/JournalLibrary.md)

Defined in: [ts-chocolate/src/packlets/user-library/userLibrary.ts:166](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/user-library/userLibrary.ts#L166)

Journal library for production records.

##### Returns

[`JournalLibrary`](../../Entities/classes/JournalLibrary.md)

Journal library for production records.

#### Implementation of

[`IUserLibrary`](../interfaces/IUserLibrary.md).[`journals`](../interfaces/IUserLibrary.md#journals)

***

### moldInventory

#### Get Signature

> **get** **moldInventory**(): [`MoldInventoryLibrary`](../../Entities/classes/MoldInventoryLibrary.md)

Defined in: [ts-chocolate/src/packlets/user-library/userLibrary.ts:180](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/user-library/userLibrary.ts#L180)

Mold inventory library for tracking owned molds.

##### Returns

[`MoldInventoryLibrary`](../../Entities/classes/MoldInventoryLibrary.md)

Mold inventory library for tracking owned molds.

#### Implementation of

[`IUserLibrary`](../interfaces/IUserLibrary.md).[`moldInventory`](../interfaces/IUserLibrary.md#moldinventory)

***

### sessions

#### Get Signature

> **get** **sessions**(): [`SessionLibrary`](../../Entities/classes/SessionLibrary.md)

Defined in: [ts-chocolate/src/packlets/user-library/userLibrary.ts:173](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/user-library/userLibrary.ts#L173)

Session library for persisted editing sessions.

##### Returns

[`SessionLibrary`](../../Entities/classes/SessionLibrary.md)

Session library for persisted editing sessions.

#### Implementation of

[`IUserLibrary`](../interfaces/IUserLibrary.md).[`sessions`](../interfaces/IUserLibrary.md#sessions)

## Methods

### create()

> `static` **create**(`params?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`UserLibrary`\>

Defined in: [ts-chocolate/src/packlets/user-library/userLibrary.ts:81](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/user-library/userLibrary.ts#L81)

Creates a new UserLibrary instance.

#### Parameters

##### params?

[`IUserLibraryCreateParams`](../interfaces/IUserLibraryCreateParams.md)

Optional [creation parameters](../interfaces/IUserLibraryCreateParams.md)

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`UserLibrary`\>

`Success` with new instance, or `Failure` with error message
