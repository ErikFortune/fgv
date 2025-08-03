# TS-RES Go Runtime

A Go runtime package for loading and resolving [ts-res](../../libraries/ts-res) resource bundles. This package provides read-only access to bundle contents and resource resolution, compatible with bundle files produced by the TypeScript ts-res system.

## Features

- **Bundle Loading**: Load and parse JSON bundle files with integrity verification
- **Resource Browsing**: Browse bundle contents and resource metadata
- **Resource Resolution**: Resolve resources to values based on context
- **Caching**: O(1) condition evaluation with intelligent caching
- **Validation**: Comprehensive validation of bundle structure and references

## Installation

```bash
go get github.com/fgv-vis/fgv/go/ts-res-runtime
```

## Quick Start

```go
package main

import (
    "fmt"
    "log"
    
    "github.com/fgv-vis/fgv/go/ts-res-runtime"
)

func main() {
    // Load a bundle
    bundle, err := tsres.LoadBundle("path/to/bundle.json")
    if err != nil {
        log.Fatal(err)
    }
    
    // Create a resource manager
    manager, err := tsres.NewManager(bundle)
    if err != nil {
        log.Fatal(err)
    }
    
    // Create a resolver with context
    context := map[string]interface{}{
        "language": "en",
        "territory": "US",
    }
    resolver, err := tsres.NewResolver(manager, context)
    if err != nil {
        log.Fatal(err)
    }
    
    // Resolve a resource
    value, err := resolver.ResolveResourceValue("my.resource.id")
    if err != nil {
        log.Fatal(err)
    }
    
    fmt.Printf("Resolved value: %v\n", value)
}
```

## API Overview

### Bundle Loading

```go
// Load from file
bundle, err := tsres.LoadBundle("bundle.json")

// Load from bytes with options
options := tsres.LoaderOptions{
    SkipChecksumVerification: false,
    UseSHA256: false, // Use CRC32 for browser compatibility
}
bundle, err := tsres.LoadBundleFromBytes(data, options)

// Validate bundle
err := tsres.ValidateBundle(bundle)
```

### Resource Management

```go
// Create manager
manager, err := tsres.NewManager(bundle)

// List resources
resourceIDs := manager.ListResourceIDs()

// Get resource metadata
resource, err := manager.GetResource("my.resource.id")

// Get statistics
numResources := manager.GetNumResources()
numCandidates := manager.GetNumCandidates()
```

### Resource Resolution

```go
// Create resolver with context
context := map[string]interface{}{
    "language": "en",
    "territory": "US",
    "theme": "dark",
}
resolver, err := tsres.NewResolver(manager, context)

// Resolve to best candidate
candidate, err := resolver.ResolveResource("my.resource.id")

// Resolve to composed value (handles partial merging)
value, err := resolver.ResolveResourceValue("my.resource.id")

// Get all matching candidates
candidates, err := resolver.ResolveAllResourceCandidates("my.resource.id")

// Update context and clear caches
newContext := map[string]interface{}{"language": "es"}
err := resolver.UpdateContext(newContext)
```

## Bundle Format

The Go runtime is compatible with bundle files produced by the TypeScript ts-res system. Bundles contain:

- **Metadata**: Build date, checksum, version, description
- **Configuration**: Qualifier types, qualifiers, resource types
- **Compiled Collection**: Conditions, condition sets, decisions, resources

Example bundle structure:
```json
{
  "metadata": {
    "dateBuilt": "2025-01-15T10:30:00.000Z",
    "checksum": "a1b2c3d4",
    "version": "1.0.0",
    "description": "Example resource bundle"
  },
  "config": {
    "qualifierTypes": [...],
    "qualifiers": [...],
    "resourceTypes": [...]
  },
  "compiledCollection": {
    "conditions": [...],
    "conditionSets": [...],
    "decisions": [...],
    "resources": [...]
  }
}
```

## Context and Resolution

Resources are resolved based on context values that match qualifier names. The resolver evaluates conditions against context values to determine the best matching candidates.

### Supported Qualifier Types

- **String**: Exact match, contains, starts with, ends with
- **Number**: Equality, greater than, less than comparisons
- **Boolean**: Equality comparison

### Resolution Process

1. **Condition Evaluation**: Each condition is evaluated against context values
2. **Condition Set Resolution**: All conditions in a set must match
3. **Decision Resolution**: Best matching condition sets are selected
4. **Candidate Selection**: Candidates are ranked by priority and score
5. **Value Composition**: Partial candidates are merged into full candidates

## Example CLI Tool

The package includes an example CLI tool demonstrating usage:

```bash
# Build the example
cd cmd/example
go build -o ts-res-example

# List resources in a bundle
./ts-res-example -bundle path/to/bundle.json -list

# Resolve a resource with context
./ts-res-example -bundle path/to/bundle.json -resource "greeting" -context '{"language":"en","territory":"US"}' -verbose
```

## Performance

- **O(1) Condition Caching**: Conditions are cached by index for fast lookup
- **Lazy Evaluation**: Only evaluates conditions as needed
- **Memory Efficient**: Minimal memory overhead for indexes and caches
- **No Mutations**: Read-only access ensures thread safety

## Compatibility

- **Go Version**: Requires Go 1.19 or later
- **TypeScript ts-res**: Compatible with bundle format from ts-res v5.0.0+
- **Browser Compatibility**: Uses CRC32 checksums by default to match browser implementations

## Testing

Run tests with:

```bash
go test ./...
```

For verbose output:

```bash
go test -v ./...
```

## Architecture

```
pkg/
├── bundle/     # Bundle loading and validation
├── runtime/    # Resource management and resolution
├── types/      # Core type definitions
└── utils/      # Utility functions

cmd/
└── example/    # Example CLI tool
```

### Key Components

- **Bundle Loader**: Parses JSON, verifies checksums, validates structure
- **Resource Manager**: Provides indexed access to bundle contents
- **Resource Resolver**: Evaluates conditions and resolves resources
- **Type System**: Mirrors TypeScript interfaces for compatibility

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see [LICENSE](../../LICENSE) file for details.

## Related Projects

- [ts-res](../../libraries/ts-res) - TypeScript resource management system
- [ts-res-browser](../../tools/ts-res-browser) - Browser-based resource explorer
- [ts-res-cli](../../tools/ts-res-cli) - Command-line tools for ts-res