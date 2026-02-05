[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Entities](../README.md) / IRenderOptions

# Interface: IRenderOptions

Defined in: [ts-chocolate/src/packlets/entities/tasks/model.ts:233](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/tasks/model.ts#L233)

Options for rendering procedure steps.

## Properties

### additionalContext?

> `readonly` `optional` **additionalContext**: `Record`\<`string`, `unknown`\>

Defined in: [ts-chocolate/src/packlets/entities/tasks/model.ts:256](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/tasks/model.ts#L256)

Additional context values available to all templates
(e.g., recipe data, ingredient info from render context)

***

### onInvalidTaskRef?

> `readonly` `optional` **onInvalidTaskRef**: [`ValidationBehavior`](../namespaces/Tasks/type-aliases/ValidationBehavior.md)

Defined in: [ts-chocolate/src/packlets/entities/tasks/model.ts:241](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/tasks/model.ts#L241)

How to handle steps with invalid task references
- 'ignore': Skip rendering, use empty or placeholder description
- 'warn': Log warning, render with placeholder
- 'fail': Return Failure result
Default: 'warn'

***

### onMissingVariables?

> `readonly` `optional` **onMissingVariables**: [`ValidationBehavior`](../namespaces/Tasks/type-aliases/ValidationBehavior.md)

Defined in: [ts-chocolate/src/packlets/entities/tasks/model.ts:250](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/tasks/model.ts#L250)

How to handle missing variables during template rendering
- 'ignore': Render with empty values for missing variables
- 'warn': Log warning, render with empty values
- 'fail': Return Failure result
Default: 'warn'
