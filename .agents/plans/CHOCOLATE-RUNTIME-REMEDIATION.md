# Chocolate Runtime Layer Remediation Plan

## Executive Summary

This plan addresses three interconnected issues discovered during the audit:
1. **Architecture**: Business logic in data layer classes (Procedure, Task, Mold)
2. **Type Safety**: `unknown` type workarounds hiding circular dependencies
3. **Test Quality**: Tests validating placeholder/incorrect behavior

**Approach**: Surgical fixes - create missing runtime wrappers without directory restructure.

---

## Phase 1: RuntimeTask Creation

### 1.1 Create RuntimeTask Class

**File**: `libraries/ts-chocolate/src/packlets/runtime/runtimeTask.ts`

**Purpose**: Move template parsing, parameter validation, and rendering from Task to RuntimeTask.

**Current Violations in Task** (`tasks/task.ts`):
- Constructor parses Mustache templates (line 93)
- `validateParams()` method (lines 152-182)
- `render()` method (lines 190-192)

**RuntimeTask Design**:
```typescript
export class RuntimeTask {
  private constructor(
    private readonly _task: Task,
    private readonly _library: RuntimeLibrary
  ) {}

  public static create(task: Task, library: RuntimeLibrary): Result<RuntimeTask>;

  // Business logic moved from Task
  public get parsedTemplate(): MustacheTemplate;
  public validateParams(params: TaskParams): Result<true>;
  public render(context: ITaskRenderContext): Result<string>;

  // Delegated properties
  public get id(): TaskId;
  public get name(): string;
  public get description(): string;
  public get parameterDefinitions(): ReadonlyArray<ITaskParameterDefinition>;
}
```

**Changes to Task class**:
- Remove `_parsedTemplate` field
- Remove `validateParams()` method
- Remove `render()` method
- Keep only: factory methods, ID, name, description, parameterDefinitions

### 1.2 Create ITaskRenderContext Interface

**File**: `libraries/ts-chocolate/src/packlets/runtime/taskRenderContext.ts`

```typescript
export interface ITaskRenderContext {
  readonly task: RuntimeTask;
  readonly library: RuntimeLibrary;
  readonly params: TaskParams;
}
```

### 1.3 Update Exports

**File**: `libraries/ts-chocolate/src/packlets/runtime/index.ts`
- Export RuntimeTask
- Export ITaskRenderContext

---

## Phase 2: RuntimeProcedure Creation

### 2.1 Create RuntimeProcedure Class

**File**: `libraries/ts-chocolate/src/packlets/runtime/runtimeProcedure.ts`

**Purpose**: Move rendering logic from Procedure to RuntimeProcedure with proper library access.

**Current Violations in Procedure** (`procedures/procedure.ts`):
- `render()` method (line 157+)
- `_renderStep()` method (line 168+) - contains placeholder logic
- Computed time properties

**RuntimeProcedure Design**:
```typescript
export class RuntimeProcedure {
  private constructor(
    private readonly _procedure: Procedure,
    private readonly _library: RuntimeLibrary
  ) {}

  public static create(procedure: Procedure, library: RuntimeLibrary): Result<RuntimeProcedure>;

  // Business logic moved from Procedure
  public render(context: IProcedureRenderContext): Result<IRenderedProcedure>;
  private _renderStep(step: IProcedureStep, context: IProcedureRenderContext): Result<IRenderedStep>;

  // Computed properties with library access
  public get totalTime(): Duration;
  public get activeTime(): Duration;

  // Delegated properties
  public get id(): ProcedureId;
  public get name(): string;
  public get steps(): ReadonlyArray<IProcedureStep>;
}
```

### 2.2 Fix IProcedureRenderContext

**File**: `libraries/ts-chocolate/src/packlets/runtime/procedureRenderContext.ts`

**Current Issue** (line 44): `readonly library: unknown;`

**Fix**:
```typescript
export interface IProcedureRenderContext {
  readonly procedure: RuntimeProcedure;
  readonly library: RuntimeLibrary;  // Properly typed!
  readonly variables: ITemplateVariables;
}
```

### 2.3 Implement Proper Task Resolution

**Current Placeholder** (procedure.ts line 168-173):
```typescript
if (isTaskRef(invocation)) {
  return succeed({
    ...step,
    renderedDescription: `[Task: ${invocation.taskId}]`  // PLACEHOLDER
  });
}
```

**Proper Implementation**:
```typescript
if (isTaskRef(invocation)) {
  return this._library.getTask(invocation.taskId)
    .onSuccess((runtimeTask) => {
      return runtimeTask.render({
        task: runtimeTask,
        library: this._library,
        params: invocation.params
      });
    })
    .onSuccess((renderedTask) => succeed({
      ...step,
      renderedDescription: renderedTask
    }));
}
```

### 2.4 Update Procedure Class

**Changes to Procedure class**:
- Remove `render()` method
- Remove `_renderStep()` method
- Remove computed time properties (or keep as simple pass-through)
- Keep only: factory methods, ID, name, steps (raw data)

---

## Phase 3: RuntimeMold Creation

### 3.1 Create RuntimeMold Class

**File**: `libraries/ts-chocolate/src/packlets/runtime/runtimeMold.ts`

**Current Violations in Mold**:
- `displayName` computed property
- `totalCapacity` computed property

**RuntimeMold Design**:
```typescript
export class RuntimeMold {
  private constructor(
    private readonly _mold: Mold,
    private readonly _library: RuntimeLibrary
  ) {}

  public static create(mold: Mold, library: RuntimeLibrary): Result<RuntimeMold>;

  // Computed properties
  public get displayName(): string;
  public get totalCapacity(): number;

  // Delegated properties
  public get id(): MoldId;
  public get name(): string;
  public get cavities(): ReadonlyArray<ICavity>;
}
```

### 3.2 Update Mold Class

**Changes to Mold class**:
- Remove `displayName` property (or keep as simple field access)
- Remove `totalCapacity` computed property
- Keep only: factory methods, ID, name, cavities (raw data)

---

## Phase 4: RuntimeLibrary Integration

### 4.1 Add Runtime Accessors to RuntimeLibrary

**File**: `libraries/ts-chocolate/src/packlets/runtime/runtimeLibrary.ts`

Add methods:
```typescript
// New runtime accessors
public getTask(id: TaskId): Result<RuntimeTask>;
public getProcedure(id: ProcedureId): Result<RuntimeProcedure>;
public getMold(id: MoldId): Result<RuntimeMold>;

// Internal caching
private readonly _runtimeTasks: Map<TaskId, RuntimeTask>;
private readonly _runtimeProcedures: Map<ProcedureId, RuntimeProcedure>;
private readonly _runtimeMolds: Map<MoldId, RuntimeMold>;
```

### 4.2 Lazy Instantiation Pattern

```typescript
public getTask(id: TaskId): Result<RuntimeTask> {
  const cached = this._runtimeTasks.get(id);
  if (cached) {
    return succeed(cached);
  }

  return this._tasks.get(id)
    .onSuccess((task) => RuntimeTask.create(task, this))
    .onSuccess((runtimeTask) => {
      this._runtimeTasks.set(id, runtimeTask);
      return succeed(runtimeTask);
    });
}
```

---

## Phase 5: Test Remediation

### 5.1 Delete Bad Tests

**File**: `libraries/ts-chocolate/src/test/unit/procedures/procedure.test.ts`

Delete tests that validate placeholder behavior:
```typescript
// DELETE: This validates incorrect behavior
expect(rendered.steps[0].renderedDescription).toBe('[Task: common.melt-chocolate]');
```

### 5.2 Create New RuntimeProcedure Tests

**File**: `libraries/ts-chocolate/src/test/unit/runtime/runtimeProcedure.test.ts`

```typescript
describe('RuntimeProcedure', () => {
  describe('render', () => {
    test('should resolve task references to actual task content', () => {
      // Create library with task
      // Create procedure with task reference
      // Verify rendered output contains actual task description, not placeholder
    });

    test('should render inline tasks directly', () => {
      // ...
    });

    test('should fail gracefully for unknown task references', () => {
      // ...
    });
  });
});
```

### 5.3 Create New RuntimeTask Tests

**File**: `libraries/ts-chocolate/src/test/unit/runtime/runtimeTask.test.ts`

```typescript
describe('RuntimeTask', () => {
  describe('validateParams', () => {
    test('should succeed with valid params matching definitions', () => {});
    test('should fail with missing required params', () => {});
    test('should fail with invalid param types', () => {});
  });

  describe('render', () => {
    test('should substitute params into template', () => {});
    test('should handle missing optional params', () => {});
  });
});
```

### 5.4 Create New RuntimeMold Tests

**File**: `libraries/ts-chocolate/src/test/unit/runtime/runtimeMold.test.ts`

```typescript
describe('RuntimeMold', () => {
  describe('totalCapacity', () => {
    test('should calculate total from all cavities', () => {});
  });

  describe('displayName', () => {
    test('should format name correctly', () => {});
  });
});
```

---

## Phase 6: Minor Fixes (Deferred)

### 6.1 Task Params Converter

**File**: `libraries/ts-chocolate/src/packlets/tasks/converters.ts` (lines 48-55)

**Current**: Manual validation anti-pattern
**Fix**: Use `Converters.record()` from @fgv/ts-utils

---

## Implementation Order

1. **RuntimeTask** - Foundation for task resolution
2. **RuntimeProcedure** - Depends on RuntimeTask for task resolution
3. **RuntimeMold** - Independent, can be done in parallel with above
4. **RuntimeLibrary Integration** - Wire up all runtime accessors
5. **Test Remediation** - Delete bad tests, write correct tests
6. **Minor Fixes** - Task params converter cleanup

---

## Breaking Changes

This remediation introduces breaking changes:

1. `Procedure.render()` removed - use `RuntimeProcedure.render()`
2. `Task.validateParams()` removed - use `RuntimeTask.validateParams()`
3. `Task.render()` removed - use `RuntimeTask.render()`
4. `Mold.displayName` behavior may change
5. `Mold.totalCapacity` behavior may change
6. `IProcedureRenderContext.library` type changes from `unknown` to `RuntimeLibrary`

**Migration**: Consumers must use RuntimeLibrary to get Runtime* wrappers instead of using data classes directly for business operations.

---

## Success Criteria

1. ✅ No business logic in Procedure, Task, or Mold data classes
2. ✅ `IProcedureRenderContext.library` properly typed as `RuntimeLibrary`
3. ✅ Task references in procedures actually resolve to task content
4. ✅ No tests validating placeholder/incorrect behavior
5. ✅ All new runtime classes have comprehensive test coverage
6. ✅ All tests pass
7. ✅ Build succeeds across all projects in ecosystem
