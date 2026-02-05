[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Entities](../README.md) / IFillingRating

# Interface: IFillingRating

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:139](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L139)

Rating for a specific category of a filling recipe version

## Properties

### category

> `readonly` **category**: [`RatingCategory`](../namespaces/Fillings/type-aliases/RatingCategory.md)

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:143](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L143)

The category being rated

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:153](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L153)

Optional categorized notes about the rating

***

### score

> `readonly` **score**: [`RatingScore`](../../../../type-aliases/RatingScore.md)

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:148](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L148)

Score from 1-5
