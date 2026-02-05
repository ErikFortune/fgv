[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Entities](../README.md) / IProducedFillingEntity

# Interface: IProducedFillingEntity

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:403](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L403)

Produced filling with concrete choices.
Captures what was actually made during a filling production session.

## Properties

### ingredients

> `readonly` **ingredients**: readonly [`IProducedFillingIngredientEntity`](../namespaces/Fillings/interfaces/IProducedFillingIngredientEntity.md)[]

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:411](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L411)

Resolved ingredients with concrete selections

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:415](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L415)

Optional categorized notes about production

***

### procedureId?

> `readonly` `optional` **procedureId**: [`ProcedureId`](../../../../type-aliases/ProcedureId.md)

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:413](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L413)

Resolved procedure ID if one was used

***

### scaleFactor

> `readonly` **scaleFactor**: `number`

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:407](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L407)

Scale factor applied

***

### targetWeight

> `readonly` **targetWeight**: [`Measurement`](../../../../type-aliases/Measurement.md)

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:409](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L409)

Target weight for this production

***

### versionId

> `readonly` **versionId**: [`FillingVersionId`](../../../../type-aliases/FillingVersionId.md)

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:405](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L405)

Filling version ID that was produced
