---
name: result-tests
description: Use when writing, reviewing, or refactoring Jest tests in projects using the FGV toolset. Covers the Result-pattern matchers from @fgv/ts-utils-jest (toSucceed, toFail, toSucceedWith, toFailWith, toSucceedAndSatisfy), test structure (orThrow in setup, matchers in assertions), the never-paper-over-failures rule, TypeScript-in-tests rules, and coverage-gap resolution. Load this skill before writing a new test file, before adding tests to an existing file, or when reviewing tests that use jest matchers.
---

# Result-Pattern Tests

> Source: `<repo>/.claude/skills/result-tests/SKILL.md` in the source
> corpus. Toolset binding: `@fgv/ts-utils-jest`.

Tests in projects using the FGV toolset use Jest with custom Result
matchers from `@fgv/ts-utils-jest`. These let you assert on
`Result<T>` directly without manually unwrapping.

## Always import the matchers

```typescript
import '@fgv/ts-utils-jest';
```

This registers the matchers on Jest's `expect`. Forget this and
`toSucceed()` won't exist.

## Matcher reference

| Matcher | Use when |
|---------|---------|
| `toSucceed()` | Only care that the operation succeeded |
| `toFail()` | Only care that the operation failed |
| `toSucceedWith(value)` | Testing simple value equality on success |
| `toFailWith(/pattern/i)` | Testing error messages — use a **regex**, not a string |
| `toSucceedAndSatisfy((v) => …)` | Complex objects, multiple property checks, nested Results |

## Test structure — `orThrow` in setup, matchers in assertions

The convention is `test()`, not `it()`. Both are jest aliases for the
same function; **always use `test()`** to match the broader
fgv-and-this-corpus convention. New test files use `test()`; existing
`it()` clusters get converted opportunistically when the file is
touched.

```typescript
describe('MyClass', () => {
  let instance: MyClass;

  // GOOD — orThrow in setup
  beforeEach(() => {
    instance = MyClass.create(testParams).orThrow();
  });

  // GOOD — matchers in assertions
  test('handles operations', () => {
    expect(instance.operation()).toSucceedAndSatisfy((result) => {
      expect(result.value).toBe(expected);
    });
    expect(instance.failingOp()).toFailWith(/expected error/i);
  });
});
```

```typescript
// BAD — don't use matchers in setup
beforeEach(() => {
  expect(MyClass.create(params)).toSucceedAndSatisfy((instance) => {
    testInstance = instance; // wrong place for matchers
  });
});
```

## Error testing — regex over exact strings

```typescript
// GOOD — flexible regex
expect(parser.parse('')).toFailWith(/empty input/i);
expect(parser.parse('{')).toFailWith(/syntax error/i);

// AVOID — brittle exact match
expect(parser.parse('')).toFailWith('Empty input');
```

## Complex assertions with `toSucceedAndSatisfy`

```typescript
expect(SomeClass.create(params)).toSucceedAndSatisfy((instance) => {
  expect(instance.property).toBe(expectedValue);
  expect(instance.method()).toSucceed();

  // Nested Result assertions are fine
  expect(instance.getChild('id')).toSucceedAndSatisfy((child) => {
    expect(child.value).toBe(42);
  });
});
```

## TypeScript in tests — no `any`, ever

```typescript
// GOOD — proper assertion through unknown
const corruptedData = {
  id: 'invalid' as unknown as SomeId,
  type: 999 as unknown as SomeTypeIndex
};

// BAD — fails lint
const corruptedData = {
  id: 'invalid' as any,
  type: 999 as any
};

// ALSO BAD — `as never` is convention drift, not the rule
const corruptedData = {
  id: 'invalid' as never,        // works, but doesn't name the brand
  type: 999 as never
};
```

The `any`-type ban applies in test code too. Branded-type assertions
go through `as unknown as <BrandedType>` — naming the target brand is
the load-bearing property (the assertion documents *which* brand is
being constructed for the test). `as never` works at the type-checker
level but loses that signal; the convention is the explicit form.

## Never paper over real failures

If a test fails because functionality is broken, **report the bug —
don't hide it**.

```typescript
// NEVER hide broken functionality
// TODO: Add test when method is fixed
expect(typeof brokenMethod.convert).toBe('function');

// NEVER mock to bypass real failures
jest.mock('./brokenModule', () => ({
  brokenMethod: jest.fn().mockReturnValue(mockResult)
}));
```

When tests reveal bugs:
1. Confirm it's a real bug (not a test issue).
2. Stop and report the failure to the user with the exact error.
3. Fix the underlying code before continuing.
4. Never mock around it.

## Test through public APIs

```typescript
// GOOD — public API
expect(SomeLibrary.Runtime.validator.validate(data)).toSucceed();

// OK when needed — direct internal import
// eslint-disable-next-line import/no-internal-modules
import { InternalClass } from '../../../packlets/internal/module';

// AVOID — don't add exports just for testing
// AVOID — don't change production APIs to make tests easier
```

## Coverage gaps

Aim for 100% coverage. Gap-resolution process:

1. Run the project's coverage command and identify uncovered lines.
2. Categorize each gap:
   - **Business logic** — must test.
   - **Validation logic** — usually testable.
   - **Defensive coding** — may need `c8 ignore` directive.
3. Resolve in priority order; only add `c8 ignore` for genuinely
   unreachable defensive code, with a comment explaining why.

```typescript
/* c8 ignore next 2 - defensive coding: internal consistency check */
if (this.internalState.isCorrupted()) {
  throw new Error('Internal state corrupted');
}
```

**Get user approval before adding `c8 ignore` directives.**

For the imperative-`isFailure` flavor of coverage gap, see
`skill.toolset.fgv.result-pattern § Coverage-gap smell` — refactor to
chain shape first; suppress only after determining the imperative
form is genuinely correct.

## Test file location

Tests mirror source structure under `src/test/unit/`:

```
src/
├── packlets/feature/component.ts
└── test/unit/packlets/feature/component.test.ts
```
