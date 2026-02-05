[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [UserLibrary](../README.md) / IUserLibrary

# Interface: IUserLibrary

Defined in: [ts-chocolate/src/packlets/user-library/model.ts:45](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/user-library/model.ts#L45)

User-specific library data (journals, sessions, inventory).
Separate from shared library data (ingredients, recipes, etc.).

## Properties

### ingredientInventory

> `readonly` **ingredientInventory**: [`IngredientInventoryLibrary`](../../Entities/classes/IngredientInventoryLibrary.md)

Defined in: [ts-chocolate/src/packlets/user-library/model.ts:64](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/user-library/model.ts#L64)

Ingredient inventory library for tracking ingredient stock.

***

### journals

> `readonly` **journals**: [`JournalLibrary`](../../Entities/classes/JournalLibrary.md)

Defined in: [ts-chocolate/src/packlets/user-library/model.ts:49](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/user-library/model.ts#L49)

Journal library for production records.

***

### moldInventory

> `readonly` **moldInventory**: [`MoldInventoryLibrary`](../../Entities/classes/MoldInventoryLibrary.md)

Defined in: [ts-chocolate/src/packlets/user-library/model.ts:59](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/user-library/model.ts#L59)

Mold inventory library for tracking owned molds.

***

### sessions

> `readonly` **sessions**: [`SessionLibrary`](../../Entities/classes/SessionLibrary.md)

Defined in: [ts-chocolate/src/packlets/user-library/model.ts:54](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/user-library/model.ts#L54)

Session library for persisted editing sessions.
