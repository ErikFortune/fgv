# Observability Infrastructure Implementation Plan

## Overview
Implement comprehensive observability infrastructure in the ts-res library to provide systematic debugging and user feedback capabilities throughout the resource processing pipeline.

## Architecture Design

### Core Interfaces
```typescript
// Base diagnostic logger for developer debugging
interface ILogger {
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

// User-facing logger extends diagnostic logger with success feedback
interface IUserLogger extends ILogger {
  success(message: string, ...args: any[]): void;
}

// Dual logger context for systematic observability
interface IObservabilityContext {
  diag: ILogger;    // Developer diagnostics → console.info/warn/error
  user: IUserLogger; // User feedback → UI messages + success
}
```

### Implementation Strategy

#### 1. **Core Observability Module** (`libraries/ts-res/src/packlets/observability/`)
- `interfaces.ts` - Core interfaces and types
- `implementations.ts` - Concrete logger implementations
- `factories.ts` - Factory functions and context creators
- `index.ts` - Public API exports

#### 2. **Default Implementations**
```typescript
// Console logger for diagnostics
export const consoleLogger: ILogger = {
  info: (message: string, ...args: any[]) => console.info(message, ...args),
  warn: (message: string, ...args: any[]) => console.warn(message, ...args),
  error: (message: string, ...args: any[]) => console.error(message, ...args)
};

// No-op user logger (default)
export const noOpUserLogger: IUserLogger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  success: () => {}
};

// Default observability context
export const defaultObservabilityContext: IObservabilityContext = {
  diag: consoleLogger,
  user: noOpUserLogger
};
```

#### 3. **Function Signature Updates**
Update all core ts-res functions to accept optional observability context:
- `Import.ImportManager` methods
- `Resources.ResourceManagerBuilder` methods
- `Runtime.ResourceResolver` methods
- `Config.SystemConfiguration` methods
- Processing and validation functions

Pattern: `o11y: IObservabilityContext = defaultObservabilityContext`

#### 4. **Integration Points**
- **Import Pipeline**: Log file processing, validation failures, resource discovery
- **Resource Management**: Log resource creation, compilation, conflicts
- **Runtime Resolution**: Log resolution attempts, context matching, errors
- **Configuration**: Log system setup, qualifier type registration, validation

#### 5. **Error Message Standards**
- **Diagnostic messages**: Technical details for developers with context
- **User messages**: Human-friendly success/error messages
- **Consistent formatting**: Include resource IDs, operation context, actionable information

## Implementation Steps

### Phase 1: Core Infrastructure (ts-res)
1. Create observability packlet with interfaces and implementations
2. Add factory functions for creating contexts with custom user loggers
3. Export observability tools in main ts-res index
4. Update core function signatures to accept observability context
5. Add comprehensive logging throughout processing pipeline
6. Update tests to use test observability context

### Phase 2: Integration Testing
1. Create comprehensive unit tests for observability interfaces
2. Test logging integration across all processing paths
3. Verify no-op contexts don't impact performance
4. Test custom user logger integration

### Phase 3: Documentation
1. Generate API documentation for observability interfaces
2. Create usage examples and best practices guide
3. Document integration patterns for consumers

## Consumer Usage Patterns

### Basic Usage (Console Diagnostics Only)
```typescript
import { defaultObservabilityContext } from '@fgv/ts-res';

// Uses console for diagnostics, no-op for user messages
const result = processResources(files, config, defaultObservabilityContext);
```

### Custom User Feedback Integration
```typescript
import { createObservabilityContext } from '@fgv/ts-res';

const o11y = createObservabilityContext((type, message) => {
  showUserMessage(type, message); // Your UI system
});

const result = processResources(files, config, o11y);
```

### Testing Context
```typescript
import { testObservabilityContext } from '@fgv/ts-res';

// No-op context for tests
const result = processResources(files, config, testObservabilityContext);
```

## Benefits

1. **Systematic Debugging**: Replaces ad-hoc console.log with structured logging
2. **User Feedback**: Enables rich UI feedback without tight coupling
3. **Performance**: No-op contexts have minimal overhead
4. **Testing**: Clean test contexts prevent log spew
5. **Consistency**: Uniform logging patterns across entire library
6. **Extensibility**: Easy to add new logger implementations

## Migration Strategy

1. **Backward Compatibility**: All observability parameters are optional with defaults
2. **Gradual Adoption**: Existing code works unchanged, new features get observability
3. **Progressive Enhancement**: Consumers can opt into rich logging as needed

## Success Criteria

- All core ts-res processing has diagnostic logging
- User-friendly success/error messages available
- Zero impact on existing consumers (backward compatible)
- Comprehensive test coverage for observability features
- API documentation generated and complete
- Performance benchmarks show minimal overhead