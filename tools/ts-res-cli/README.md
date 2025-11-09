# @fgv/ts-res-cli

Command-line interface for compiling and managing ts-res resources with contextual filtering and optimization.

## Installation

```bash
# From the monorepo root
rush install
rushx build --to @fgv/ts-res-cli
```

## Usage

### Compile Resources

```bash
ts-res-compile compile -i ./resources -o ./dist/resources.json
```

### Advanced Compilation

```bash
# Compile with context filtering
ts-res-compile compile \
  -i ./resources \
  -o ./dist/resources.json \
  --context '{"language": "en-US", "territory": "US"}' \
  --format json
# Compile for production with TypeScript output
ts-res-compile compile \
  -i ./resources \
  -o ./dist/resources.ts \
  --format ts \
  --include-metadata

# Create a complete bundle with metadata and configuration
ts-res-compile compile \
  -i ./resources \
  -o ./dist/resources.bundle.json \
  --format bundle \
  --include-metadata
```

### Validate Resources

```bash
# Validate resource files
ts-res-compile validate -i ./resources
```

### Get Resource Information

```bash
# Get basic resource information
ts-res-compile info -i ./resources

# Get filtered information
ts-res-compile info \
  -i ./resources \
  --context '{"language": "en"}' \
```

## Commands

### `compile`

Compiles resources from input to output format.

**Required Options:**
- `-i, --input <path>` - Input file or directory path
- `-o, --output <path>` - Output file path

**Optional Options:**
- `-c, --context <json>` - Context filter for resources (JSON string)
- `-f, --format <format>` - Output format (compiled, source, js, ts, binary, bundle) [default: compiled]
- `--debug` - Include debug information [default: false]
- `-v, --verbose` - Verbose output [default: false]
- `-q, --quiet` - Quiet output [default: false]
- `--validate` - Validate resources during compilation [default: true]
- `--include-metadata` - Include resource metadata in output [default: false]
- `--resource-types <types>` - Resource type filter (comma-separated)
- `--max-distance <number>` - Maximum distance for language matching

### `validate`

Validates resources without compilation.

**Required Options:**
- `-i, --input <path>` - Input file or directory path

**Optional Options:**
- `-v, --verbose` - Verbose output [default: false]
- `-q, --quiet` - Quiet output [default: false]

### `info`

Shows information about resources.

**Required Options:**
- `-i, --input <path>` - Input file or directory path

**Optional Options:**
- `-c, --context <json>` - Context filter for resources (JSON string)
- `--resource-types <types>` - Resource type filter (comma-separated)
- `--max-distance <number>` - Maximum distance for language matching

## Input Formats

The CLI supports the following input formats:

### Resource Candidate Array
```json
[
  {
    "id": "welcome.message",
    "json": { "text": "Welcome!" },
    "conditions": { "language": "en" },
    "resourceTypeName": "json"
  }
]
```

### Resource Collection
```json
{
  "resources": [
    {
      "id": "welcome.message",
      "resourceTypeName": "json",
      "candidates": [
        {
          "json": { "text": "Welcome!" },
          "conditions": { "language": "en" }
        }
      ]
    }
  ]
}
```

## Output Formats

### Compiled (default)
Compiled resource collection optimized for runtime use:
```json
{
  "resources": {
    "welcome.message": {
      "default": { "text": "Welcome!" }
    }
  }
}
```

### Source
Original resource collection format:
```json
{
  "resources": [
    {
      "id": "welcome.message",
      "resourceTypeName": "json",
      "candidates": [
        {
          "json": { "text": "Welcome!" },
          "conditions": { "language": "en" }
        }
      ]
    }
  ]
}
```

### Bundle
Complete resource bundle with metadata, configuration, and compiled resources:
```json
{
  "metadata": {
    "dateBuilt": "2025-01-01T00:00:00.000Z",
    "checksum": "abc12345",
    "version": "1.0.0",
    "description": "Generated bundle from ts-res-cli"
  },
  "config": {
    "qualifierTypes": [...],
    "qualifiers": [...],
    "resourceTypes": [...]
  },
  "compiledCollection": {
    "resources": {...}
  }
}
```

### JavaScript
```javascript
module.exports = {
  "resources": {
    "welcome.message": {
      "default": { "text": "Welcome!" }
    }
  }
};
```

### TypeScript
```typescript
export const resources = {
  "resources": {
    "welcome.message": {
      "default": { "text": "Welcome!" }
    }
  }
} as const;
```

## Context Filtering

Context filtering allows you to compile only resources that match specific conditions:

```bash
# Only resources for English language
ts-res-compile compile -i ./resources -o ./en.json \
  --context '{"language": "en"}'

## Examples

See the `examples/` directory for sample resource files and compilation scenarios.

## Development

```bash
# Build the CLI
rushx build

# Run tests
rushx test

# Run linting
rushx lint

# Generate documentation
rushx build-docs
```