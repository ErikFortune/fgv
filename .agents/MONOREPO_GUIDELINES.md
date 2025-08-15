# Rush Monorepo Development Guidelines

## Overview
This document provides essential guidelines for developing in the FGV Rush monorepo. Following these guidelines ensures consistency, maintainability, and compatibility across all packages.

## Package Management

### Rush Commands (Required)
- **Never** use `npm install` or edit `package.json` directly
- **Always** use Rush commands for dependency management

```bash
# Add runtime dependencies (NOTE: -p flag required)
rush add -p <package-name>
rush add -p <package-name>@<version>

# Add multiple packages at once
rush add -p package1 package2 package3

# Add development dependencies
rush add --dev -p <package-name>

# Add peer dependencies
rush add --peer -p <package-name>

# Remove dependencies
rush remove -p <package-name>

# Update dependencies
rush update

# Install all dependencies
rush install
```

### ⚠️ Critical Dependency Management Warnings
- **Rush automatically uses consistent versions** across the monorepo for existing packages
- **New packages get 'latest' version** unless specified
- **Dependency conflicts are extremely tricky to resolve** due to version synchronization
- **Always work in a separate branch** when adding or updating dependencies
- **Ask for help or confirmation at every step** when dealing with dependency issues
- Version conflicts can cascade across multiple packages in the monorepo

### Dependency Classification
- **Runtime Dependencies**: Required for the package to function in production
- **Development Dependencies**: Only needed during development/building (testing, linting, build tools)
- **Peer Dependencies**: Expected to be provided by consuming packages

### Shared Dependencies
- Be mindful of shared dependencies affecting other monorepo packages
- Coordinate major version updates that affect multiple packages
- Prefer using existing monorepo packages over external alternatives

## Runtime Requirements

### Node Version
- **Required**: Node.js v20 LTS
- Set in package.json: `"engines": { "node": ">=20.0.0" }`
- Use `.nvmrc` file in project root if needed

### TypeScript
- Use consistent TypeScript configuration
- Extend from shared tsconfig if available
- Follow monorepo TypeScript patterns

## Required Monorepo Dependencies

### Core Utilities
- **@fgv/ts-utils**: Result pattern, collections, validation, conversion
- **@fgv/ts-json-base**: Basic JSON handling and validation
- **@fgv/ts-json**: Intensive JSON work (templating, merging, transformation)
- **@fgv/ts-utils-jest**: Testing utilities with result-specific matchers
- **@fgv/ts-bcp47**: Structured language tags and localization

### Specialized Libraries
- **@fgv/ts-res**: Resource management and localization
- **@fgv/ts-sudoku-lib**: Sudoku puzzle generation and solving
- **@fgv/ts-extras**: Additional utilities and experimental features

## Development Patterns

### Result Pattern (Required)
All operations that can fail should use the Result pattern:

```typescript
import { Result, succeed, fail } from '@fgv/ts-utils';

// Good: Use Result<T> for fallible operations
function parseNumber(input: string): Result<number> {
  const parsed = parseInt(input, 10);
  if (isNaN(parsed)) {
    return fail(`Invalid number: ${input}`);
  }
  return succeed(parsed);
}

// Good: Chain operations with Result methods
const result = parseNumber("42")
  .onSuccess(num => succeed(num * 2))
  .onFailure(err => fail(`Parse error: ${err}`));
```

### Error Handling
- Use `.onSuccess()`, `.onFailure()`, `.orThrow()` patterns
- Prefer `.orDefault()` for safe fallbacks
- Use `.orElse()` for alternative operations

```typescript
// Good: Proper error handling
const value = riskyOperation()
  .onSuccess(result => processResult(result))
  .onFailure(error => logError(error))
  .orDefault(defaultValue);

// Good: Throw only when appropriate
const criticalValue = riskyOperation().orThrow();
```

### Validation and Conversion
Use converters and validators from ts-utils:

```typescript
import { Converters, Validators } from '@fgv/ts-utils';

// Good: Use built-in converters
const numberResult = Converters.number.convert(input);

// Good: Create custom converters
const customConverter = Converters.generic<MyType>((from: unknown) => {
  // validation logic
  return succeed(validated);
});
```

### Collections
Use Result-aware collections from ts-utils:

```typescript
import { ValidatingResultMap, ResultMap } from '@fgv/ts-utils';

// Good: Use Result-aware collections
const map = new ValidatingResultMap({
  converters: new KeyValueConverters({
    key: Converters.string,
    value: myCustomConverter
  })
});
```

## Testing Guidelines

### Test Framework
- Use **@fgv/ts-utils-jest** for testing
- Follow existing test patterns in the monorepo
- Use result-specific matchers

```typescript
import '@fgv/ts-utils-jest';

describe('MyFunction', () => {
  test('should succeed with valid input', () => {
    const result = myFunction('valid-input');
    expect(result).toSucceedWith('expected-output');
  });

  test('should fail with invalid input', () => {
    const result = myFunction('invalid-input');
    expect(result).toFailWith(/error pattern/);
  });
});
```

### Test Commands
- Use `rushx test` to run tests [[memory:3006079]]
- Use `rushx test --coverage` for coverage reports
- Do not call Jest directly or use `-- extra-arguments` with `rushx test`

## Code Style and Consistency

### Formatting
- Use consistent code formatting across the monorepo
- Follow existing patterns in similar packages
- Use appropriate linting rules

### Documentation
- Document public APIs with JSDoc
- Include usage examples in README files
- Document breaking changes in CHANGELOG files

### Naming Conventions
- Use consistent naming patterns
- Follow TypeScript naming conventions
- Use descriptive names for better readability

## Project Structure

### Standard Layout
```
my-package/
├── src/
│   ├── index.ts          # Main entry point
│   ├── packlets/         # Feature modules
│   └── test/             # Test files
├── lib/                  # Compiled output
├── docs/                 # Generated documentation
├── package.json          # Managed by Rush
├── tsconfig.json         # TypeScript configuration
├── jest.config.json      # Jest configuration
└── README.md             # Package documentation
```

### Configuration Files
- Follow monorepo configuration patterns
- Extend from shared configurations when available
- Document any custom configuration choices

## Build and Development

### Common Commands
```bash
# Development
rushx dev          # Start development server
rushx build        # Build the package
rushx test         # Run tests
rushx lint         # Run linter
rushx clean        # Clean build artifacts

# Monorepo operations
rush build         # Build all packages
rush test          # Test all packages
rush update        # Update all dependencies
```

### Build Configuration
- Use consistent build tools across similar packages
- Follow monorepo build patterns
- Ensure builds are deterministic and reproducible

## Integration Guidelines

### Inter-package Dependencies
- Prefer using other monorepo packages over external alternatives
- Use proper dependency declarations
- Test integration between packages

### External Dependencies
- Minimize external dependencies
- Prefer well-maintained, popular packages
- Document rationale for external dependencies

## Release and Versioning

### Change Management
- Use Rush's change management system
- Document all public API changes
- Follow semantic versioning principles

### Publishing
- Follow monorepo publishing procedures
- Coordinate releases that affect multiple packages
- Test packages after publishing

## Common Patterns

### Package Entry Points
```typescript
// Good: Clear, typed exports
export * from './packlets/feature-a';
export * from './packlets/feature-b';
export { SpecificType } from './packlets/internal';
```

### Configuration Objects
```typescript
// Good: Use Result pattern for configuration
export interface IConfigParams {
  requiredParam: string;
  optionalParam?: number;
}

export class MyClass {
  public static create(params: IConfigParams): Result<MyClass> {
    return captureResult(() => new MyClass(params));
  }
}
```

### Error Messages
```typescript
// Good: Descriptive error messages
return fail(`Invalid configuration: ${param} must be between 1 and 100`);

// Good: Context-aware errors
return fail(`Failed to process ${resource.id}: ${underlyingError.message}`);
```

## Best Practices

### Performance
- Use lazy initialization where appropriate
- Implement caching for expensive operations
- Consider memory usage in long-running processes

### Security
- Validate all inputs
- Use type-safe APIs
- Avoid exposing internal implementation details

### Maintainability
- Write self-documenting code
- Use consistent patterns across the codebase
- Keep functions and classes focused and small

## Troubleshooting

### Common Issues
- **Rush install fails**: Check for package.json modifications
- **Build errors**: Verify TypeScript configuration
- **Test failures**: Check for missing dependencies

### Getting Help
- Review existing packages for patterns
- Check monorepo documentation
- Consult with other developers

## Conclusion

Following these guidelines ensures that all packages in the monorepo maintain consistency, reliability, and compatibility. When in doubt, follow the patterns established by existing packages and use the Result pattern for all fallible operations. 