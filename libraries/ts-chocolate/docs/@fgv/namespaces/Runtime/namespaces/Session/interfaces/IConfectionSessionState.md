[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Runtime](../../../README.md) / [Session](../README.md) / IConfectionSessionState

# Interface: IConfectionSessionState

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:397](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L397)

Read-only view of confection session state

## Properties

### chocolates

> `readonly` **chocolates**: `ReadonlyMap`\<[`ChocolateRole`](../../../../../../type-aliases/ChocolateRole.md), [`ISessionChocolate`](ISessionChocolate.md)\>

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:416](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L416)

Current chocolate selections by role

***

### coating?

> `readonly` `optional` **coating**: [`ISessionCoating`](ISessionCoating.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:431](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L431)

Current coating selection (for rolled truffles)

***

### isDirty

> `readonly` **isDirty**: `boolean`

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:436](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L436)

Whether the session has unsaved modifications

***

### isJournalingEnabled

> `readonly` **isJournalingEnabled**: `boolean`

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:441](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L441)

Whether journaling is enabled

***

### mold?

> `readonly` `optional` **mold**: [`ISessionMold`](ISessionMold.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:411](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L411)

Current mold selection (for molded bonbons)

***

### procedure?

> `readonly` `optional` **procedure**: [`ISessionProcedure`](ISessionProcedure.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:426](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L426)

Current procedure selection (if applicable)

***

### sessionId

> `readonly` **sessionId**: [`SessionSpec`](../../../../../../type-aliases/SessionSpec.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:401](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L401)

Unique session identifier

***

### sourceConfection

> `readonly` **sourceConfection**: [`IConfectionBase`](../../../../LibraryRuntime/interfaces/IConfectionBase.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:406](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L406)

Source confection being edited

***

### yield

> `readonly` **yield**: [`ISessionYield`](ISessionYield.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:421](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L421)

Current yield state
