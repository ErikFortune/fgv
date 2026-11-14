---
name: type-safe-validation
description: Use when writing or reviewing code that converts unknown data into typed values — Converters, Validators, type guards, or any code that takes `unknown` and returns a typed Result. Covers when to use Converters.object vs Validators.object vs Converters.generic, the manual-type-check anti-pattern (CI-blocking), and how to write custom converters safely. Load this skill before authoring a new converter, before refactoring legacy `if (typeof x === 'string')` code, or when reviewing Priority-1 type-safety violations.
---

# Type-Safe Validation

> Source: `<repo>/.claude/skills/type-safe-validation/SKILL.md` in
> the source corpus. Toolset binding: `@fgv/ts-utils`.

Converters and Validators from `@fgv/ts-utils` give you type safety
without unsafe casts. The patterns below are **mandatory** — manual
type checking with `as` casts is a Priority-1 review block.

## Anti-patterns (will be rejected in review)

```typescript
// ANTI-PATTERN 1 — manual checks then unsafe cast
Converters.generic<unknown, MyType>((from: unknown) => {
  if (typeof from !== 'object' || from === null) return fail('…');
  const obj = from as Record<string, unknown>;
  if (typeof obj.field !== 'string') return fail('…');
  return succeed(obj as MyType); // UNSAFE
});

// ANTI-PATTERN 2 — property check then cast
if ('id' in obj && 'name' in obj) {
  return succeed(obj as IUser); // properties could have wrong types
}

// ANTI-PATTERN 3 — double cast through Record
const value = someValue as Record<string, unknown> as TargetType; // never
```

## Converters — for plain data structures

Use `Converters.object` when transforming JSON-shaped data into typed
structures:

```typescript
import { Converters } from '@fgv/ts-utils';

const configConverter = Converters.object<IConfig>({
  name: Converters.string,
  port: Converters.number,
  options: Converters.jsonObject.optional()    // <- per-field .optional()
});

return configConverter.convert(input); // Result<IConfig>
```

Converters compose: `Converters.arrayOf`, `Converters.recordOf`,
`Converters.oneOf`, plus the `.optional()` method on any converter.

### Optional fields — `.optional()`, not `optionalFields:`

`Converters.object` accepts a legacy `optionalFields: ['name', ...]`
config parameter that flags fields as optional in a separate location
from their type definition. **Don't use it.** The convention is
`.optional()` on the property converter:

```typescript
// GOOD — optionality lives in the type system at declaration
Converters.object<IConfig>({
  name: Converters.string,
  bio: Converters.string.optional()
});

// BAD — optionality split into a separate config param
Converters.object<IConfig>({
  name: Converters.string,
  bio: Converters.string
}, { optionalFields: ['bio'] });
```

Both forms work at runtime; `.optional()` is strongly preferred
because **it surfaces optionality to the type system;
`optionalFields:` does not.**

Concrete failure mode the type-system path catches and the legacy
path doesn't — using `strictObject` with a type that has a *required*
field:

```typescript
interface IFoo { requiredString: string; }

// GOOD — TS error: 'requiredString' is required on IFoo but the converter
// is producing string | undefined. Caught at compile time.
const fooConverter = Converters.strictObject<IFoo>({
  requiredString: Converters.string.optional()  // mismatch with IFoo
});

// BAD — compiles fine. Type system thinks the converter satisfies IFoo
// because the converter for requiredString is just `Converters.string`;
// the optionalFields flag is invisible to TS. Runtime allows missing
// requiredString; production hit comes from a parsed-but-incomplete object.
const fooConverter = Converters.strictObject<IFoo>({
  requiredString: Converters.string
}, { optionalFields: ['requiredString'] });
```

So the preference is not just stylistic — `optionalFields:` is a
**type-safety hole**: it lets you silently mark a required field as
optional and the type system has no way to flag it. The `.optional()`
form encodes optionality where the compiler can see it.

PR-review reflex: `optionalFields:` in new code is a real finding,
not a stylistic nit — it's bypassing a type-safety check.

## Validators — for objects with class instances or runtime guarantees

Use `Validators.object` when fields include class instances, branded
types, or other runtime-guaranteed values that converters can't
reconstruct:

```typescript
import { Validators } from '@fgv/ts-utils';

const resourceValidator = Validators.object<IResource>({
  id: Convert.resourceId,
  type: Validators.isA((v): v is ResourceType => v instanceof ResourceType),
  items: Validators.arrayOf(itemValidator)
});

return resourceValidator.validate(from); // Result<IResource>
```

## Custom logic — `Converters.generic`, *without* manual type checks

`Converters.generic` is fine when you genuinely need custom
conversion logic — but only if the inner work itself uses converters
or trusted typed APIs, not manual `typeof` checks:

```typescript
const customConverter = Converters.generic<SourceShape, TargetShape>((from) => {
  // `from` is already typed as SourceShape — don't re-check
  return innerConverter.convert(from.field).onSuccess((v) => succeed(transform(v)));
});
```

If you find yourself writing `if (typeof from !== 'object' …) return
fail(…)` inside `Converters.generic`, you should be using
`Converters.object` instead.

## Decision matrix

| Shape | Use |
|-------|-----|
| Plain object / JSON-shaped data | `Converters.object` |
| Object containing class instances or branded values | `Validators.object` |
| Array of items | `Converters.arrayOf` / `Validators.arrayOf` |
| `Record<string, T>` | `Converters.recordOf` / `Validators.recordOf` |
| Discriminated union | `Converters.discriminatedObject` |
| Genuinely custom transform with no manual type checks | `Converters.generic` |

## Branded type assertions

For branded types (where the runtime value is just a string/number
but the type is branded), assert through `unknown`:

```typescript
const id = 'user-123' as unknown as UserId;

// Test data with intentionally invalid types
const corrupted = {
  id: 'invalid' as unknown as ValidId,
  type: 999 as unknown as TypeIndex
};
```

Never `as Record<string, unknown> as TargetType` — that's a double
cast and is rejected in review.

## When in doubt

If a piece of validation code has more than one `if (typeof …)`
branch followed by an `as`, it's almost certainly the wrong
approach. Stop and pick the right tool from the table above.
