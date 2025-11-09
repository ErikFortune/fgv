# @fgv/ts-res-browser-cli

Command-line interface to launch ts-res-browser with specified resources and configuration.

## Features

- **ZIP Archive Creation**: Automatically creates ZIP archives containing resources and configuration for easy browser loading
- **Development Server Integration**: Can automatically start and manage the ts-res-browser development server
- **Flexible Resource Input**: Supports both individual files and entire directory trees
- **Configuration Management**: Works with predefined configurations or custom configuration files
- **Context Filtering**: Apply context filters and qualifier settings via command line
- **Interactive Mode**: Launch with sample data for exploration

## Installation

```bash
npm install -g @fgv/ts-res-browser-cli
```

Or use directly with npx (no installation required):

```bash
npx @fgv/ts-res-browser-cli --help
```

## Usage

### Basic Usage

```bash
# Launch browser with resources from a directory
ts-res-browser-cli browse --input ./resources --config default --serve

# With npx (no installation required)
npx @fgv/ts-res-browser-cli --input ./resources --config default --serve

# Launch with a specific configuration file
ts-res-browser-cli browse --input ./my-resources --config ./config.json --serve

# Create ZIP and launch without opening browser automatically
ts-res-browser-cli browse --input ./resources --config extended-example --serve --no-open
```

### ZIP Workflow

The CLI automatically creates ZIP archives containing your resources and configuration:

1. **ZIP Creation**: Resources and configuration are bundled into a timestamped ZIP file in your Downloads folder
2. **Manifest Generation**: Each ZIP includes a manifest with metadata about the bundled content
3. **Browser Integration**: The browser can directly load and process these ZIP archives

```bash
# Creates: ~/Downloads/ts-res-bundle-[timestamp].zip
ts-res-browser-cli browse --input ./resources --config my-config --serve
```

### Server Options

The CLI provides several ways to launch the browser with a server:

```bash
# Recommended: Universal server start (works everywhere)
ts-res-browser-cli browse --input ./resources --serve

# Development server (monorepo environment only)  
ts-res-browser-cli browse --input ./resources --dev

# Connect to existing server
ts-res-browser-cli browse --input ./resources --url http://localhost:3001
```

**Server Flag Behavior:**
- `--serve`: Works in both monorepo and published packages
  - **Monorepo**: Starts webpack dev server with hot reloading (port 3000)
  - **Published packages**: Starts static file server (port 8080)
- `--dev`: Development server with hot reloading (monorepo only)
  - **Monorepo**: Same as `--serve` 
  - **Published packages**: Shows error with instructions to use `--serve`
- `--url`: Connect to existing server at specified URL

### Advanced Options

```bash
# Apply context filtering
ts-res-browser-cli browse \
  --input ./resources \
  --context-filter "language=en-US|territory=US" \
  --reduce-qualifiers

# Interactive mode with sample data (requires server)
ts-res-browser-cli browse --interactive --serve

# Verbose output
ts-res-browser-cli browse --input ./resources --verbose
```

## Command Reference

### `browse` Command

Launch ts-res-browser with specified resources and configuration.

**Options:**
- `-i, --input <path>`: Input file or directory path
- `--config <name|path>`: Predefined configuration name or file path
- `-c, --context <json>`: Context filter (JSON string)  
- `--context-filter <token>`: Context filter (pipe-separated)
- `--qualifier-defaults <token>`: Qualifier defaults (pipe-separated)
- `--resource-types <types>`: Resource type filter (comma-separated)
- `--max-distance <number>`: Maximum distance for language matching
- `--reduce-qualifiers`: Remove perfectly matching qualifier conditions
- `-p, --port <number>`: Port for local browser instance
- `--url <url>`: URL of remote browser instance
- `--no-open`: Do not open browser automatically
- `--interactive`: Launch in interactive mode with sample data (requires --serve, --dev, or --url)
- `--serve`: Start server (dev in monorepo, serve in published packages) and connect automatically
- `--dev`: Start development server locally (monorepo only)
- `-v, --verbose`: Verbose output
- `-q, --quiet`: Quiet output

### `config` Command

Manage system configurations (future enhancement).

## ZIP Archive Format

Created ZIP archives contain:

```
ts-res-bundle-[timestamp].zip
├── manifest.json          # Archive metadata
├── input/                 # Resource files (preserving structure)
│   ├── file1.json
│   └── subdirectory/
│       └── file2.json
└── config.json           # Configuration (if provided)
```

The manifest includes:
- Timestamp of archive creation
- Input file/directory metadata
- Configuration file metadata
- Original paths for reference

## Integration with ts-res-browser

The browser application includes a dedicated ZIP Loader tool that can:
- Directly load ZIP archives created by this CLI
- Parse manifests and apply configurations automatically
- Process resources through the standard ts-res pipeline
- Provide seamless transition from CLI to browser workflow

## License

MIT
