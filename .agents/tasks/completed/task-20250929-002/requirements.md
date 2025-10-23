# Requirements Analysis: Logging System Migration

## Task ID
task-20250929-002

## Business Objective
Upgrade the logging system in ts-sudoku-lib and ts-sudoku-ui to use the standardized ILogReporter interface from @fgv/ts-utils, improving consistency across the monorepo and enabling integration with the Result pattern.

## Current State Analysis

### ts-sudoku-lib
**Location**: `libraries/ts-sudoku-lib/src/packlets/common/logging.ts`

**Current Implementation**:
- Custom interface `ISudokuLoggingContext` with optional `Logging.ILogger`
- Helper function `logIfAvailable()` for safe logging
- Default no-op context
- Only 2 files using logging:
  1. `logging.ts` - interface definition
  2. `killerCombinations.ts` - no actual usage found (false positive)

**Key Characteristics**:
- Optional logger pattern (can be undefined)
- Type-safe wrapper with level-based logging (detail, info, warn, error)
- Public API exported for library consumers

### ts-sudoku-ui
**Location**: Multiple UI components

**Current Implementation**:
- Direct `console.log()` usage in components
- Found in:
  1. `CageLookupManager.ts` - constructor initialization logging
  2. `CageOverlay.tsx` - debug logging for render diagnostics

**Key Characteristics**:
- No structured logging interface
- Direct console access
- Debug-oriented logging

## Target State: ILogReporter Pattern

### From @fgv/ts-utils
**Interface**: `Logging.LogReporter<T, TD>`

**Capabilities**:
- Implements both `ILogger` and `IResultReporter<T, TD>`
- Integrates with Result pattern via `.report(reporter)` method
- Configurable value and message formatters
- Supports NoOpLogger for optional logging
- Standard log levels: detail, info, warn, error

### From ts-res-ui-components (Reference)
**Pattern**: `IObservabilityContext`

**Structure**:
```typescript
interface IObservabilityContext {
  readonly diag: Logging.LogReporter<unknown>;  // Diagnostic logging
  readonly user: IUserLogReporter;               // User-facing messages
  readonly policy?: IObservabilityPolicy;         // Behavior control
}
```

**Key Benefits**:
- Separate diagnostic vs user-facing concerns
- Policy-driven behavior (e.g., doNotUpgrade for tests)
- React Context integration
- Consistent interface across UI components

## Requirements

### R1: Library Migration (ts-sudoku-lib)
**Priority**: HIGH
**Complexity**: MEDIUM

#### R1.1: Replace ISudokuLoggingContext
- Remove custom `ISudokuLoggingContext` interface
- Replace with `ILogReporter` from @fgv/ts-utils
- Update all public API references

#### R1.2: Remove Legacy Helpers
- Remove `logIfAvailable()` helper function
- Remove `DefaultSudokuLoggingContext` constant
- Update all internal usage

#### R1.3: Update Dependencies
- Verify @fgv/ts-utils dependency (already exists)
- Export ILogReporter types from library index

#### R1.4: Migration Impact
- **Breaking Change**: YES - public API change
- **Affected Files**: Minimal (only 2 files reference logging)
- **Consumer Impact**: Any code using ISudokuLoggingContext must update

### R2: UI Migration (ts-sudoku-ui)
**Priority**: HIGH
**Complexity**: MEDIUM

#### R2.1: Implement ObservabilityContext Pattern
- Create `IObservabilityContext` interface (or import from shared package)
- Implement diagnostic and user logging separation
- Add policy support for testing scenarios

#### R2.2: Replace Console Logging
- Replace `console.log()` in CageLookupManager
- Replace `console.log()` and `console.warn()` in CageOverlay
- Maintain debug capabilities through diagnostic logger

#### R2.3: React Context Integration
- Create ObservabilityProvider component
- Add useObservability hook
- Provide default console-based implementation

#### R2.4: Component Updates
- Update CageLookupManager to accept IObservabilityContext
- Update CageOverlay to use context logging
- Maintain all existing debug information

### R3: Integration Requirements
**Priority**: HIGH
**Complexity**: LOW

#### R3.1: Result Pattern Integration
- Use `.report(reporter)` pattern for automatic logging
- Errors logged at error level automatically
- Success logged at info level (configurable)

#### R3.2: Backward Compatibility
- NO backward compatibility - direct migration
- NO shims or wrappers
- Clean break from legacy pattern

### R4: Testing Requirements
**Priority**: HIGH
**Complexity**: MEDIUM

#### R4.1: Library Tests
- Test ILogReporter usage in contexts
- Test with NoOpLogger (optional logging)
- Test Result.report() integration

#### R4.2: UI Tests
- Test ObservabilityContext creation
- Test React context integration
- Test console fallback behavior
- Test with NoOp logger for silent tests

#### R4.3: Coverage Targets
- Maintain 100% coverage requirement
- All new logging code fully tested
- Migration paths validated

## Exit Criteria

### EC1: Library Migration Complete
- [ ] ISudokuLoggingContext removed from codebase
- [ ] All files using ILogReporter from @fgv/ts-utils
- [ ] Public API exports updated
- [ ] All tests passing with 100% coverage
- [ ] No references to legacy logging interface

### EC2: UI Migration Complete
- [ ] ObservabilityContext pattern implemented
- [ ] All console.log/warn calls replaced
- [ ] React context and hooks implemented
- [ ] All components using context-based logging
- [ ] All tests passing with new pattern

### EC3: Integration Validated
- [ ] Result.report() pattern in use
- [ ] Diagnostic vs user logging clearly separated
- [ ] Policy-based behavior working (e.g., tests)
- [ ] No backward compatibility shims remain

### EC4: Quality Gates Passed
- [ ] 100% test coverage maintained
- [ ] All TypeScript types correct
- [ ] No lint violations
- [ ] Code review approved
- [ ] Documentation updated

### EC5: User Verification
- [ ] User confirms UI logging behavior acceptable
- [ ] User confirms diagnostic logging meets needs
- [ ] User confirms no breaking changes to app integration

## Technical Constraints

### TC1: NO Compatibility Wrappers
- Direct migration only
- Clean break from legacy patterns
- No shims or adapters

### TC2: Monorepo Standards
- Follow Result pattern guidelines
- Maintain 100% test coverage
- Use existing @fgv/ts-utils infrastructure
- Follow TypeScript strict typing

### TC3: UI Framework
- React Context for observability
- Hooks-based API
- Compatible with existing UI patterns

## Dependencies

### Internal Dependencies
- @fgv/ts-utils (ILogReporter, LogReporter)
- @fgv/ts-sudoku-lib (for UI integration)

### External Dependencies
- React (for context/hooks in UI)
- None (logging is internal only)

## Risk Assessment

### Low Risks
- **Limited Usage**: Only 2 files use logging in lib, 2 in UI
- **Clear Pattern**: ObservabilityContext is proven in ts-res-ui-components
- **Good Infrastructure**: ILogReporter already exists and tested

### Medium Risks
- **Breaking Changes**: Public API change in library (mitigated by limited usage)
- **UI Integration**: Need to ensure context propagates correctly (mitigated by existing pattern)

### Mitigation Strategies
- Follow proven ObservabilityContext pattern from ts-res-ui-components
- Comprehensive testing at each phase
- User verification of logging behavior before completion

## Implementation Phases

### Phase 1: Library Migration (ts-sudoku-lib)
1. Update logging.ts interface
2. Remove legacy helpers
3. Update any internal usage
4. Update tests
5. Verify 100% coverage

### Phase 2: UI Context Implementation (ts-sudoku-ui)
1. Create ObservabilityContext interface
2. Implement React context and provider
3. Create hooks
4. Add default implementations

### Phase 3: UI Component Migration
1. Update CageLookupManager
2. Update CageOverlay
3. Update any other components
4. Update tests

### Phase 4: Integration & Validation
1. Test Result.report() integration
2. Validate UI context propagation
3. User verification
4. Final review

## Success Metrics

- **Zero legacy logging interfaces remain**
- **100% test coverage maintained**
- **All console.log replaced with structured logging**
- **ObservabilityContext pattern successfully adopted**
- **No breaking changes to application integration** (UI components)

## Notes

- This is a clean migration with no backward compatibility
- Pattern is proven in ts-res-ui-components
- Limited scope reduces migration risk
- ILogReporter provides better integration with Result pattern
- Observability separation (diag vs user) improves architecture