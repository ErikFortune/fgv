# Delta CLI Command Architecture Design

## Overview
Design for implementing `ts-res-cli delta` command that leverages the existing DeltaGenerator class while following established CLI patterns.

## Architecture Decisions

### Core Principle: Thin CLI Wrapper
- CLI provides orchestration and parameter handling
- Business logic remains in ts-res library (DeltaGenerator)
- Maximum reuse of existing CLI infrastructure

### Component Design

#### 1. DeltaCompiler Class (New - in ts-res library)
**Location**: `libraries/ts-res/src/packlets/cli/deltaCompiler.ts`
**Purpose**: Orchestrates delta generation workflow
**Key Methods**:
- `compile(options: IDeltaCompileOptions): Result<IResourceBlob>`
- Private methods for resource loading, context setup, delta generation

#### 2. CLI Command Handler (New - in ts-res-cli)
**Location**: `tools/ts-res-cli/src/actions/delta.ts`
**Purpose**: Parse CLI arguments and invoke DeltaCompiler
**Responsibilities**:
- Argument parsing and validation
- Progress reporting and user interaction
- Error handling and logging setup

#### 3. Interface Definitions
```typescript
interface IDeltaCompileOptions {
  baselinePath: string;
  targetPath: string;
  baselineContext?: Context.IContextDecl;
  targetContext?: Context.IContextDecl;
  logger: ILogger;
  // Other options following existing patterns
}
```

## Integration Strategy

### Resource Loading
- **Reuse**: ImportManager and existing resource loading patterns
- **Pattern**: Same as ResourceCompiler.compile() for consistency
- **Benefit**: Proven, tested resource loading logic

### Context Management
- **Reuse**: ContextTokens parsing from existing CLI
- **Pattern**: `--context-filter "language=en-US,territory=US"`
- **Benefit**: Familiar user interface

### Configuration Management
- **Reuse**: SystemConfiguration loading patterns
- **Pattern**: `--config [config-name]` support
- **Benefit**: Consistent configuration experience

### Output Generation
- **Reuse**: IResourceBlob and existing output formatters
- **Pattern**: `--format [json|bundle|...]` support
- **Benefit**: All existing output formats automatically supported

### Logging Integration
- **ConsoleLogger**: For normal operation with progress updates
- **InMemoryLogger**: For testing and batch scenarios
- **Pattern**: Same as other CLI commands

## CLI Command Structure

### Basic Usage
```bash
ts-res-cli delta --baseline ./resources/en-US --target ./resources/en-GB --output ./delta.json
```

### Advanced Usage
```bash
ts-res-cli delta \
  --baseline ./resources \
  --target ./updated-resources \
  --output ./delta.bundle.json \
  --format bundle \
  --context-filter "language=en-US" \
  --config language-priority \
  --debug
```

### Flag Harmonization
All existing flags work consistently:
- `--config [name]` - Use named configuration
- `--context-filter [filter]` - Apply context filtering
- `--format [format]` - Specify output format
- `--debug` - Enable debug logging
- `--verbose` - Verbose progress reporting
- `--dry-run` - Preview operation without writing output

## Implementation Phases

### Phase 1: Core Infrastructure
1. Create IDeltaCompileOptions interface
2. Implement DeltaCompiler class in ts-res
3. Add unit tests for DeltaCompiler
4. Validate integration with existing DeltaGenerator

### Phase 2: CLI Integration
1. Create delta command handler in ts-res-cli
2. Implement argument parsing and validation
3. Add CLI integration tests
4. Update CLI help documentation

### Phase 3: Advanced Features
1. Add context filtering support
2. Implement configuration file support
3. Add output format options
4. Create comprehensive integration tests

### Phase 4: Documentation & Polish
1. Update CLI documentation
2. Add usage examples and tutorials
3. Performance testing and optimization
4. Final integration testing

## Code Reuse Strategy

### ~80% Reuse from Existing CLI Infrastructure
- Resource loading: ImportManager patterns
- Configuration: SystemConfiguration handling
- Context parsing: ContextTokens logic
- Output generation: IResourceBlob formatters
- Error handling: Result pattern throughout
- Logging: ILogger interface usage

### New Components (Minimal)
- DeltaCompiler orchestration class
- CLI argument parsing for delta-specific flags
- Integration glue between CLI and DeltaCompiler

## Testing Strategy

### Unit Tests
- DeltaCompiler class with mock dependencies
- CLI argument parsing logic
- Error scenario handling

### Integration Tests
- End-to-end CLI command execution
- File I/O and resource loading scenarios
- Output format verification
- Context filtering validation

### Follows Existing Patterns
- Same test structure as ResourceCompiler tests
- Use established mocking patterns
- Maintain 100% coverage requirement

## Error Handling

### CLI Level
- Argument validation with helpful error messages
- File access errors with clear remediation steps
- Progress reporting for long-running operations

### Library Level
- Result pattern throughout for consistent error handling
- Detailed error context in failure messages
- Proper error aggregation via MessageAggregator

## Documentation Requirements

### CLI Help
- Integrated `ts-res-cli delta --help` documentation
- Examples for common use cases
- Clear explanation of all flags and options

### Code Documentation
- TSDoc comments on all public interfaces
- Architecture decision documentation
- Usage examples in code comments

## Performance Considerations

### Efficiency
- Leverages optimized DeltaGenerator implementation
- Minimal memory footprint through streaming where possible
- Progress reporting for user feedback on large operations

### Scalability
- Designed to handle typical resource set sizes efficiently
- Memory usage scales linearly with resource size
- Error reporting doesn't compromise performance

## Summary

This architecture provides a complete, maintainable implementation by:

1. **Maximizing code reuse** - 80% of functionality comes from existing CLI patterns
2. **Maintaining separation of concerns** - CLI orchestrates, library provides business logic
3. **Following established patterns** - Consistent user experience and developer experience
4. **Ensuring comprehensive integration** - Works with all existing CLI features
5. **Providing clear implementation path** - Four distinct, manageable phases

The design respects existing architectural decisions while efficiently adding the new delta generation capability.