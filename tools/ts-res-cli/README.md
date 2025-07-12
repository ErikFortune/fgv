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
  --partial-match \
  --format json \
  --minify

# Compile for production with TypeScript output
ts-res-compile compile \
  -i ./resources \
  -o ./dist/resources.ts \
  --format ts \
  --mode production \
  --minify \
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
  --partial-match
```

## Commands

### `compile`

Compiles resources from input to output format.

**Required Options:**
- `-i, --input <path>` - Input file or directory path
- `-o, --output <path>` - Output file path

**Optional Options:**
- `-c, --context <json>` - Context filter for resources (JSON string)
- `-f, --format <format>` - Output format (json, js, ts, binary) [default: json]
- `-m, --mode <mode>` - Compilation mode (development, production) [default: development]
- `--partial-match` - Enable partial context matching [default: false]
- `--source-maps` - Include source maps [default: false]
- `--minify` - Minify output [default: false]
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
- `--partial-match` - Enable partial context matching [default: false]
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

### JSON (default)
```json
{
  "resources": {
    "welcome.message": {
      "default": { "text": "Welcome!" }
    }
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

# Resources for US English with partial matching
ts-res-compile compile -i ./resources -o ./en-us.json \
  --context '{"language": "en-US", "territory": "US"}' \
  --partial-match
```

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