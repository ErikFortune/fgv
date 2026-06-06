# Testing Guidelines

This document defines testing standards for this repository. All code must have 100% test coverage.

## Table of Contents
- [Testing Philosophy](#testing-philosophy)
- [Result Pattern Matchers](#result-pattern-matchers)
- [Test Structure](#test-structure)
- [Coverage Requirements](#coverage-requirements)
- [Coverage Gap Resolution](#coverage-gap-resolution)

---

## Testing Philosophy

### Function-First, Coverage-Second

**Primary**: Write tests that make sense functionally, based on the component's intended behavior:

1. **Success Cases**: Test main functionality with valid inputs
2. **Error Cases**: Test expected error conditions and validation failures
3. **Edge Cases**: Test boundary conditions, empty inputs, corner cases
4. **Integration**: Test component interactions

**Secondary**: Use coverage analysis to identify missed paths only after functional tests are complete.

### Never Paper Over Failures

**CRITICAL**: If tests fail because functionality is broken, DO NOT work around it.

```typescript
// ❌ NEVER hide broken functionality
// TODO: Add test when method is fixed
expect(typeof brokenMethod.convert).toBe('function');

// ❌ NEVER mock to hide real failures
jest.mock('./brokenModule', () => ({
  brokenMethod: jest.fn().mockReturnValue(mockResult)
}));

// ✅ CORRECT: Report the failure to the user
// "The parse() method throws an error when it should return a Result.
//  This appears to be a bug in the implementation."
```

When tests reveal bugs:
1. Analyze the failure - is it a real bug?
2. Report legitimate bugs immediately with exact error messages
3. Fix the underlying issue before proceeding
4. Never use mocking or workarounds to bypass legitimate failures

---

## Result Pattern Matchers

Use custom Jest matchers from `@fgv/ts-utils-jest`:

### Basic Matchers

```typescript
import '@fgv/ts-utils-jest';

// Simple success/failure checks
expect(operation()).toSucceed();
expect(operation()).toFail();

// Value matching
expect(converter.convert('input')).toSucceedWith('expected');
expect(operation()).toFailWith(/error pattern/i);
```

### Complex Assertions

```typescript
// Use toSucceedAndSatisfy for complex objects
expect(SomeClass.create(params)).toSucceedAndSatisfy((instance) => {
  expect(instance.property).toBe(expectedValue);
  expect(instance.method()).toSucceed();

  // Nested result testing
  expect(instance.getChild('id')).toSucceedAndSatisfy((child) => {
    expect(child.value).toBe(42);
  });
});
```

### When to Use Each Matcher

| Matcher | Use When |
|---------|----------|
| `toSucceed()` | Only care that operation succeeded |
| `toFail()` | Only care that operation failed |
| `toSucceedWith(value)` | Testing simple value equality |
| `toFailWith(pattern)` | Testing error messages (use regex) |
| `toSucceedAndSatisfy(fn)` | Testing complex objects or multiple properties |

---

## Test Structure

### Setup vs Test Assertions

```typescript
describe('MyClass', () => {
  let instance: MyClass;

  // ✅ GOOD - Use orThrow() in setup
  beforeEach(() => {
    instance = MyClass.create(testParams).orThrow();

    // Chain setup operations
    instance = MyClass.create(testParams)
      .onSuccess((inst) => {
        inst.initialize(config).orThrow();
        return inst;
      })
      .orThrow();
  });

  // ✅ GOOD - Use matchers in actual tests
  test('should handle operations', () => {
    expect(instance.operation()).toSucceedAndSatisfy((result) => {
      expect(result.value).toBe(expected);
    });
    expect(instance.failingOp()).toFailWith(/expected error/i);
  });
});

// ❌ BAD - Don't use matchers in setup
beforeEach(() => {
  expect(MyClass.create(params)).toSucceedAndSatisfy((instance) => {
    testInstance = instance; // Wrong place for matchers
  });
});
```

### Error Testing

```typescript
// ✅ GOOD - Use regex for flexible matching
expect(operation()).toFailWith(/invalid.*parameter/i);

// ✅ GOOD - Test specific error conditions
expect(parser.parse('')).toFailWith(/empty input/i);
expect(parser.parse('{')).toFailWith(/syntax error/i);

// ❌ AVOID - Brittle exact string matching
expect(operation()).toFailWith('Invalid parameter: expected string');
```

### TypeScript in Tests

Never use `any` type, even in tests:

```typescript
// ✅ GOOD - Proper type assertion for test data
const corruptedData = {
  id: 'invalid' as unknown as SomeId,
  type: 999 as unknown as SomeTypeIndex
};

// ❌ BAD - Will fail linting
const corruptedData = {
  id: 'invalid' as any,
  type: 999 as any
};
```

---

## Coverage Requirements

**100% coverage is required** for all metrics:
- Statements: 100%
- Branches: 100%
- Functions: 100%
- Lines: 100%

### Running Coverage

```bash
# Single project
cd libraries/project-name && rushx coverage

# Check specific file
rushx test --test-path-pattern=filename.test
```

---

## Coverage Gap Resolution

### Run `code-reviewer` BEFORE chasing 100% measured coverage (load-bearing)

When you have scenario-driven tests in place (positive, negative, edge cases) and you're about to start the final pass that closes the remaining coverage gaps to hit 100%, **stop and run the `code-reviewer` agent on the current diff first**. Only then run `rushx coverage` and resolve the remaining gaps.

The sequence within layer 1 (pre-PR prep) is:

1. **Scenario-driven tests** — positive, negative, edge cases derived from the component's intended behavior. Do not chase line coverage at this stage.
2. **`code-reviewer` agent on the current diff** — surfaces missed Result-chaining opportunities, imperative test patterns that should be declarative, and design simplifications that eliminate the lines that would otherwise need coverage closure.
3. **Coverage-gap analysis** — `rushx coverage`, categorize, resolve per the Systematic Process below.

**Why this order matters.** Chasing 100% measured coverage first creates artifacts that the code-reviewer would have eliminated upstream:

- **Imperative tests where Result-chain tests would do.** Coverage-gap closure often produces tests that drive each branch with `if (result.isFailure())` / `expect(...).toBe(...)` rather than `expect(...).toSucceedAndSatisfy(...)` / `expect(...).toFailWith(...)`. The Result-pattern matchers from `@fgv/ts-utils-jest` are declarative and read against the intent; imperative shapes mask the intent. Code-reviewer catches this class of finding readily, but only if the imperative tests haven't already been written, reviewed locally, and committed.
- **`c8 ignore` directives that mask refactor opportunities.** A `c8 ignore` on a branch that "only fires under live conditions" is sometimes legitimate (defensive code, external-runtime-only paths) and sometimes evidence that the implementation has a branch the design didn't need — a `?? undefined` where chaining would have eliminated the need, a `try/catch` that should have been a `captureResult`, an `if` that's redundant because the caller's type already excluded the case. Code-reviewer flags these as design simplifications; once applied, the gap that needed `c8 ignore` is gone.
- **Surface complexity that should have been simplified.** When the test writer asks "how do I cover this branch?" the implicit assumption is the branch is intentional. Code-reviewer asks "should this branch exist?" — and the answer is sometimes no. Eliminating a branch eliminates the test for it and the directive that would have masked it.

**Trigger:** the moment you're about to run `rushx coverage` with the intent to identify and close gaps to reach 100%, do `code-reviewer` first. This applies whether the trigger comes mid-stream (end of a sub-phase) or at the layer-1 final-prep pass — coverage-chasing is the trigger, not the stream cadence.

**Concrete failure mode this prevents.** The Phase C (`ai-assist-client-tools`) C4 work landed `c8 ignore` directives on the `rawTail` branch in `chatRequestBuilders.ts` because that branch "is only exercised by live continuation scenarios" — the implementer reasonably concluded the branch was untestable in unit scope and added the directive to hit 100%. A `code-reviewer` pass before the coverage closure would likely have surfaced one of: (a) the branch could be exercised by a fixture-based test, (b) the `rawTail` design could have absorbed the empty-array case at the builder layer so the branch became unreachable rather than untested, or (c) the directive is genuinely warranted but with a sharper justification ("live continuation scenarios verify wire correctness; unit-level signature validation is the server's gate, not the builder's"). All three outcomes are useful; the post-coverage placement loses the option entirely.

**Sharper failure mode from the same run (the canonical reference observation).** The same Phase C work also reported a "live testbed run reported success" in its exit artifact, but a retroactive `code-reviewer` pass found that `executeClientToolTurn` never merged client tools into the request `tools` array, and the three `call*Stream` adapter signatures (`callAnthropicStream` / `callOpenAiResponsesStream` / `callGeminiStream`) had never been widened from `ReadonlyArray<AiServerToolConfig>` to `ReadonlyArray<AiToolConfig>`. The model was never told about client tools and could not have called them. The 100%-measured-coverage achievement was on lines that mocked the SSE response side; **no test verified the request body actually contained client tool definitions** — and because the coverage tool only sees the lines it sees, that absence was invisible to the gate. The coverage metric was 100% on a test architecture that never exercised the brief's central requirement.

This is the load-bearing tell: coverage-chasing-first doesn't just lock in imperative tests and `c8 ignore` directives. It locks in a test architecture where unmeasured concerns stay structurally unmeasured. Coverage tools measure *the lines you have*; they cannot flag *the test class you should have*. The `code-reviewer` pass reads against intent ("does the brief's requirement actually flow end-to-end?") rather than against measured coverage, and would have surfaced "no test verifies the request body" as a P2 finding. The implementer would have added the test; the test would have failed; the structural gap would have been caught BEFORE the coverage gate signed off and BEFORE the exit artifact claimed live success.

The amplification cost of the reversal: commission a fix agent (3–5 hours), address the three P1s + six P2s, re-run the testbed against the live API, run a second `code-reviewer` pass to verify the fixes didn't introduce regressions, then the originally-intended single Copilot loop. The 30 minutes the implementer "saved" by going to coverage closure first cost a multi-hour fix cycle plus the orchestrator overhead of catching the suspect-live-success claim retroactively. The economics of layer-1 sequencing are heavily one-sided: the early `code-reviewer` pass is the cheaper move even when it finds nothing.

### Systematic Process

1. **Code-reviewer pass complete** (per the sequence above) — the diff being analyzed for coverage is the post-review diff, not the pre-review diff.
2. **Analyze**: Run `rushx coverage` to identify uncovered lines.
3. **Categorize** each gap:
   - **Business Logic** (HIGH): Core functionality - must test
   - **Validation Logic** (MEDIUM): Input validation - usually testable
   - **Defensive Coding** (LOW): Internal consistency checks - may need directive
4. **Resolve** in priority order:
   - Test business logic gaps first
   - Test validation logic gaps second
   - Add `c8 ignore` for truly unreachable defensive code

### Coverage Directive Detection

Before adding directives, verify they're needed:

```bash
# 1. Test the specific file in isolation
rushx test --test-path-pattern=filename.test

# 2. If individual file shows 100% but full suite shows gaps:
#    - Code is functionally tested
#    - Coverage tool has timing issues
#    - Directives are appropriate
```

### Using Coverage Directives

```typescript
// Format: /* c8 ignore next <n> - <reason> */

/* c8 ignore next 2 - defensive coding: internal consistency check */
if (this.internalState.isCorrupted()) {
  throw new Error('Internal state corrupted');
}

/* c8 ignore next 1 - coverage intermittently missed in full suite */
} catch (error) {
  return fail(error);
}
```

**Always get approval before adding coverage directives.**

### Examples of Defensive Code (Candidates for Ignore)

- Internal collector creation failures (would indicate library bugs)
- Index validation for internally managed collections
- Consistency checks between related data structures
- Error paths in well-tested internal operations
- Unreachable code due to TypeScript type guarantees

---

## Testing Principles

### Core Guidelines

1. **Don't change production code for tests** - Test code should not drive API changes
2. **Test via exported functionality** - Use public APIs, not internal modules
3. **Test interfaces via implementations** - Use real classes to test interface contracts
4. **Don't add exports for testing** - Import internal modules directly when needed

### Testing Internal Code

```typescript
// ✅ GOOD - Test through public APIs
expect(SomeLibrary.Runtime.validator.validate(data)).toSucceed();

// ✅ GOOD - Import internal module when necessary
// eslint-disable-next-line import/no-internal-modules
import { InternalClass } from '../../../packlets/internal/module';

// ❌ AVOID - Adding exports just for testing
export { InternalValidator }; // Don't add this

// ❌ AVOID - Excessive mocking
const mockValidator = jest.fn(); // Use real validator when possible
```

### Test Organization

Tests mirror source structure:
```
src/
├── packlets/
│   └── feature/
│       └── component.ts
└── test/
    └── unit/
        └── packlets/
            └── feature/
                └── component.test.ts
```
