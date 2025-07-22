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

## Usage

### Basic Usage

```bash
# Launch browser with resources from a directory
ts-res-browser-cli browse --input ./resources --config default

# Launch with a specific configuration file
ts-res-browser-cli browse --input ./my-resources --config ./config.json

# Create ZIP and launch without opening browser automatically
ts-res-browser-cli browse --input ./resources --config extended-example --no-open
```

### ZIP Workflow

The CLI automatically creates ZIP archives containing your resources and configuration:

1. **ZIP Creation**: Resources and configuration are bundled into a timestamped ZIP file in your Downloads folder
2. **Manifest Generation**: Each ZIP includes a manifest with metadata about the bundled content
3. **Browser Integration**: The browser can directly load and process these ZIP archives

```bash
# Creates: ~/Downloads/ts-res-bundle-[timestamp].zip
ts-res-browser-cli browse --input ./resources --config my-config
```

### Development Server

```bash
# Automatically start development server locally
ts-res-browser-cli browse --input ./resources --dev

# Use existing server at custom URL  
ts-res-browser-cli browse --input ./resources --url http://localhost:3001
```

### Advanced Options

```bash
# Apply context filtering
ts-res-browser-cli browse \
  --input ./resources \
  --context-filter "language=en-US|territory=US" \
  --reduce-qualifiers

# Interactive mode with sample data
ts-res-browser-cli browse --interactive

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
- `--interactive`: Launch in interactive mode with sample data
- `--dev`: Automatically start development server locally
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
