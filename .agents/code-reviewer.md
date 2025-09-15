# Code Reviewer Agent Guidelines

This document provides specific guidelines for the code-reviewer agent when reviewing code in the FGV monorepo.

## Priority 1 - CRITICAL Issues (Must Block PR)

### 🚨 Manual Type Checking with Unsafe Casts

**This is the #1 anti-pattern that MUST be fixed in all code reviews.**

#### Detection Patterns

Look for these specific patterns and flag them as CRITICAL issues:

1. **Manual type checking in `Converters.generic`**:
```typescript
// 🚨 CRITICAL: Manual type checking pattern
Converters.generic<unknown, SomeType>((from: unknown) => {
  if (typeof from !== 'object' || from === null) {
    return fail('...');
  }
  const obj = from as Record<string, unknown>;
  if (typeof obj.someField !== 'string') {
    return fail('...');
  }
  // More manual checks...
  return succeed(obj as SomeType); // Unsafe cast!
});
```

2. **Double casting patterns**:
```typescript
// 🚨 CRITICAL: Double cast pattern
someValue as Record<string, unknown> as TargetType
obj.field as unknown as BrandedType
```

3. **Manual property existence checks with unsafe casts**:
```typescript
// 🚨 CRITICAL: Manual checking with unsafe cast
if ('property' in obj && typeof obj.property === 'string') {
  return succeed(obj as TypeWithProperty); // Unsafe!
}
```

4. **typeof checks followed by casts**:
```typescript
// 🚨 CRITICAL: typeof with cast
if (typeof value === 'object' && value !== null) {
  const typed = value as MyType; // Unsafe!
}
```

#### Required Fix

**ALWAYS require refactoring to use proper Converters or Validators:**

```typescript
// ✅ REQUIRED: Use Converters.object
const converter = Converters.object<MyType>({
  field1: Converters.string,
  field2: Converters.number,
  optionalField: Converters.optionalField(Converters.boolean)
});

// ✅ REQUIRED: Use Validators for complex objects
const validator = Validators.object<ComplexType>({
  instance: Validators.isA((v): v is MyClass => v instanceof MyClass),
  collection: Validators.arrayOf(itemValidator)
});
```

### Why This Is Critical

1. **Type Safety**: Manual checks don't guarantee type safety at runtime
2. **Maintainability**: Changes to types aren't reflected in manual checks
3. **Error Messages**: Manual checks provide poor error messages
4. **Security**: Type confusion can lead to security vulnerabilities
5. **Repository Standards**: Violates established patterns in the codebase

## Priority 2 - Major Issues

### Result Pattern Violations
- Not using Result<T> for fallible operations
- Throwing errors instead of returning Result
- Using try/catch without captureResult

### Any Type Usage
- Any use of `any` type (will fail linting anyway)
- Should use `unknown` with proper type guards

## Priority 3 - Standard Issues

### Code Organization
- Incorrect packlet structure
- Missing or incorrect exports
- Import organization issues

### Testing
- Missing test coverage
- Incorrect use of Result matchers in tests
- Using orThrow() in test assertions instead of matchers

## Review Process

### Step 1: Scan for Critical Anti-Patterns
First pass should ALWAYS check for manual type checking patterns:
- Search for `Converters.generic` with `typeof` checks
- Look for double casting patterns
- Check for manual property checking

### Step 2: Require Immediate Fix
If found, mark as **MUST FIX** with specific examples:
```
🚨 CRITICAL ISSUE: Manual type checking anti-pattern detected

Lines 248-275: This uses manual type checking with unsafe casts.

REQUIRED FIX: Replace with Converters.object():
```typescript
this._configConverter = Converters.object<QualifierTypes.Config.IAnyQualifierTypeConfig>({
  name: Converters.string,
  systemType: Converters.string,
  configuration: Converters.optionalField(Converters.jsonObject)
});
```

This pattern defeats TypeScript's type safety and must be fixed before merge.
```

### Step 3: Review Other Issues
Only after critical issues are addressed, review for other patterns.

## Example Review Comments

### For Manual Type Checking:
```
❌ CRITICAL: Lines 248-275 use manual type checking with unsafe casts

This anti-pattern:
- Defeats TypeScript's type safety
- Provides poor error messages
- Doesn't update with type changes

MUST be replaced with:
const converter = Converters.object<ConfigType>({
  // field definitions
});

See CLAUDE.md section "Type-Safe Validation Guidelines" for details.
```

### For Double Casting:
```
❌ CRITICAL: Line 271 uses double casting

`obj.configuration as Record<string, unknown> as JsonObject`

This unsafe pattern must be replaced with proper validation:
configuration: Converters.optionalField(Converters.jsonObject)
```

## Enforcement

**These patterns are BLOCKERS for PR approval:**
1. Manual type checking in converters
2. Double casting patterns
3. Manual property checks with unsafe casts

**No exceptions** - these must be fixed even if:
- The code "works"
- It's in test files
- It's "temporary"
- It matches existing patterns (existing patterns need fixing too)

## References

- Main guidelines: `/CLAUDE.md` - Type-Safe Validation Guidelines
- Monorepo patterns: `/.agents/MONOREPO_GUIDELINES.md`
- Result pattern: `/.agents/RESULT_PATTERN_GUIDE.md`