# Code Review Checklist

Use this checklist when reviewing code. Issues are categorized by priority - all Priority 1 issues must be fixed before approval.

## Priority 1 - CRITICAL (Blocking)

These issues **must be fixed** before code can be merged.

### Type Safety Violations

- [ ] **No `any` type usage** - Will fail CI
  ```typescript
  // ❌ REJECT
  const data: any = input;
  function process(x: any): any { }

  // ✅ REQUIRE
  const data: unknown = input;
  function process(x: unknown): Result<Output> { }
  ```

- [ ] **No manual type checking with unsafe casts**
  ```typescript
  // ❌ REJECT - Manual checking followed by cast
  if (typeof obj.name === 'string' && typeof obj.id === 'number') {
    return succeed(obj as IUser); // Unsafe!
  }

  // ✅ REQUIRE - Use Converters
  const converter = Converters.object<IUser>({
    name: Converters.string,
    id: Converters.number
  });
  return converter.convert(obj);
  ```

- [ ] **No double casting**
  ```typescript
  // ❌ REJECT
  const value = x as Record<string, unknown> as TargetType;

  // ✅ REQUIRE - Single cast through unknown or use Converter
  const value = x as unknown as TargetType; // For branded types only
  ```

### Result Pattern Violations

- [ ] **Fallible operations return Result<T>**
  ```typescript
  // ❌ REJECT - Throwing in business logic
  function parse(input: string): Data {
    if (!valid) throw new Error('Invalid');
    return data;
  }

  // ✅ REQUIRE
  function parse(input: string): Result<Data> {
    if (!valid) return fail('Invalid');
    return succeed(data);
  }
  ```

- [ ] **orThrow() only in setup/initialization**
  ```typescript
  // ❌ REJECT - orThrow in business logic
  function processOrder(id: string): Order {
    const order = loadOrder(id).orThrow();
    return transform(order);
  }

  // ✅ REQUIRE - Return Result in business logic
  function processOrder(id: string): Result<Order> {
    return loadOrder(id).onSuccess(transform);
  }
  ```

### Security Issues

- [ ] **No hardcoded secrets or credentials**
- [ ] **Input validation at system boundaries**
- [ ] **No SQL injection, XSS, or command injection vulnerabilities**

---

## Priority 2 - MAJOR (Should Fix)

These issues should be fixed unless there's a documented reason.

### Result Pattern Quality

- [ ] **Prefer chaining over intermediate variables** (when clearer)
  ```typescript
  // ❌ AVOID - Unnecessary variables
  const step1 = parse(input);
  if (step1.isFailure()) return step1;
  const step2 = validate(step1.value);
  if (step2.isFailure()) return step2;
  return transform(step2.value);

  // ✅ PREFER - Chaining
  return parse(input)
    .onSuccess(validate)
    .onSuccess(transform);
  ```

- [ ] **Use MessageAggregator for error collection**
  ```typescript
  // ❌ AVOID - Manual error accumulation
  const errors: string[] = [];
  result1.onFailure(e => errors.push(e));

  // ✅ PREFER
  const aggregator = new MessageAggregator();
  result1.aggregateError(aggregator);
  ```

- [ ] **Use mapResults() for array processing**
  ```typescript
  // ✅ REQUIRE when processing arrays of Results
  const results = items.map(item => processItem(item));
  return mapResults(results);
  ```

### Error Messages

- [ ] **Include context in error messages**
  ```typescript
  // ❌ AVOID
  return fail('Invalid index');

  // ✅ REQUIRE
  return fail(`Index ${index} out of bounds for array of length ${arr.length}`);
  ```

### Code Quality

- [ ] **Factory pattern for classes that can fail construction**
  ```typescript
  // ✅ REQUIRE for fallible constructors
  class MyClass {
    private constructor(config: Config) { /* may throw */ }
    public static create(params: Params): Result<MyClass> {
      return captureResult(() => new MyClass(validated));
    }
  }
  ```

- [ ] **No duplicate/boilerplate code that could be extracted**
- [ ] **Follows existing patterns in the codebase**

---

## Priority 3 - MINOR (Advisory)

Note these for improvement but don't block on them.

### Style & Consistency

- [ ] **Use `??` instead of `||` for nullish coalescing**
  ```typescript
  // ✅ PREFER
  const value = input ?? 'default';

  // ❌ AVOID when 0 or '' are valid
  const value = input || 'default';
  ```

- [ ] **Consistent naming with rest of codebase**
- [ ] **Appropriate comments (not excessive, not missing)**

### Testing Considerations

- [ ] **New code has corresponding tests**
- [ ] **Tests use Result matchers appropriately**
- [ ] **No test antipatterns (over-mocking, implementation testing)**

---

## Quick Detection Patterns

Use these searches to quickly find issues:

### Find `any` Usage
```bash
grep -r ": any" src/ --include="*.ts"
grep -r "as any" src/ --include="*.ts"
```

### Find Manual Type Checking
```bash
grep -r "typeof.*===" src/ --include="*.ts" | grep -v "test"
grep -r "as Record<string, unknown>" src/ --include="*.ts"
```

### Find Throwing in Business Logic
```bash
grep -r "throw new Error" src/ --include="*.ts" | grep -v "test"
```

---

## Review Output Format

When reporting review findings:

```markdown
## Code Review Results

### Priority 1 - CRITICAL
- **[file.ts:42]** Using `any` type - use `unknown` instead
- **[service.ts:156]** Manual type checking with unsafe cast - use Converter

### Priority 2 - MAJOR
- **[parser.ts:89]** Could use Result chaining instead of intermediate variables

### Priority 3 - MINOR
- **[utils.ts:23]** Consider using `??` instead of `||`

### Recommendation
[ ] **Approved** - No blocking issues
[x] **Requires Changes** - Fix Priority 1 issues before merge
[ ] **Rejected** - Major architectural concerns
```

---

## Special Cases

### Test Files
- Type assertions like `as unknown as BrandedType` are acceptable for test data
- Mock data can use looser typing when intentionally testing error paths
- Still no `any` type usage

### Migration/Legacy Code
- Document technical debt for future cleanup
- Don't block if code improves on existing patterns
- Note areas for follow-up work
