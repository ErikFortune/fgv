# TS-RES Browser

A visual tool for loading, browsing, and experimenting with ts-res resources. Built as a React web application for optimal performance and modern browser capabilities.

## Features

### Core Tools
- **Import Tool**: Load resources from files or directories using File System Access API
- **ZIP Loader**: Load pre-bundled ZIP archives created by ts-res-browser-cli
- **Source Browser**: Browse and explore built resources in alphabetical order
- **Compiled Browser**: Navigate compiled resource collections in tree view
- **Filter Tool**: Filter resources by context for focused analysis
- **Resolution Viewer**: Test resource resolution with different qualifiers and contexts
- **Configuration Tool**: Manage qualifier types, qualifiers, and resource types

### Advanced Features
- **ZIP Archive Support**: Direct loading of ZIP bundles with automatic configuration application
- **URL Parameter Integration**: Launch with pre-configured settings via command line
- **Context Filtering**: Advanced filtering by language, territory, and custom qualifiers
- **Interactive Mode**: Explore with sample data and predefined configurations
- **Modern UI**: Built with React, TypeScript, and Tailwind CSS

## Getting Started

### Prerequisites

- Node.js v20 or higher
- Rush package manager

### Installation

1. Install dependencies:
```bash
rush install
```

2. Build the project:
```bash
rushx build
```

3. Start the development server:
```bash
rushx dev
```

The application will open in your browser at `http://localhost:3000`.

### Usage

#### Option 1: Direct File Loading
1. **Import Files**: Use the Import Tool to select your ts-res project files/directories
2. **Browse Resources**: Navigate between different tools using the sidebar
3. **Explore**: View resource details, test resolution, and experiment with qualifiers

#### Option 2: ZIP Archive Workflow (Recommended)
1. **Create Archive**: Use ts-res-browser-cli to create ZIP archives:
   ```bash
   ts-res-browser-cli browse --input ./resources --config extended-example
   ```
2. **Load Archive**: Use the ZIP Loader tool to load the created archive
3. **Automatic Setup**: Configuration and resources are applied automatically

#### Option 3: Command Line Integration
Launch directly with pre-configured settings:
```bash
# Launch with automatic development server
ts-res-browser-cli browse --input ./resources --dev

# Launch with ZIP creation but no browser opening
ts-res-browser-cli browse --input ./resources --no-open
```

### URL Parameters

The browser supports URL parameters for automated setup:
- `config=<name>`: Load predefined configuration
- `contextFilter=<filter>`: Apply context filtering  
- `loadZip=true`: Navigate directly to ZIP Loader
- `interactive=true`: Launch in interactive mode
- `reduceQualifiers=true`: Enable qualifier reduction

Example: `http://localhost:3000?config=extended-example&loadZip=true`

## Development

### Scripts

- `rushx dev` - Start development server
- `rushx build` - Build for production
- `rushx test` - Run tests
- `rushx clean` - Clean build artifacts

### Project Structure

```
src/
├── components/
│   ├── layout/          # Layout components (Header, Sidebar, etc.)
│   ├── tools/           # Tool-specific components
│   │   ├── ImportTool.tsx           # File/directory import
│   │   ├── ZipLoader.tsx            # ZIP archive loader
│   │   ├── SourceBrowser.tsx        # Resource browsing
│   │   ├── CompiledBrowser.tsx      # Tree view navigation  
│   │   ├── FilterTool.tsx           # Context filtering
│   │   ├── ResolutionViewer.tsx     # Resolution testing
│   │   └── ConfigurationTool.tsx    # Configuration management
│   └── common/          # Shared components
├── hooks/               # Custom React hooks
│   ├── useAppState.ts               # Main application state
│   ├── useResourceManager.ts        # Resource processing
│   ├── useFileImport.ts             # File system operations
│   └── useUrlParams.ts              # URL parameter parsing
├── utils/               # Utility functions
│   ├── zip/                         # Browser-specific ZIP utilities
│   ├── fileImport.ts                # File system integration
│   ├── fileTreeConverter.ts         # FileTree integration
│   └── urlParams.ts                 # URL parameter utilities
├── types/               # TypeScript type definitions
├── App.tsx              # Main application component  
└── main.tsx             # Application entry point
```

### Technology Stack

- **React 19** with TypeScript
- **Webpack 5** for bundling with browser polyfills
- **Tailwind CSS** for styling
- **Heroicons** for iconography  
- **JSZip** for browser-based ZIP processing
- **@fgv/ts-res** for resource management
- **@fgv/ts-utils** for Result pattern and FileTree abstraction

## Architecture

The application follows a component-based architecture with:

### Core Systems
- **State Management**: React hooks with centralized state management
- **File Access**: File System Access API with fallback to input elements
- **ZIP Processing**: Browser-compatible ZIP implementation using JSZip
- **Resource Processing**: FileTree abstraction for unified file access
- **Error Handling**: Result pattern from @fgv/ts-utils throughout

### Integration Points
- **CLI Integration**: Seamless workflow with ts-res-browser-cli via ZIP archives
- **URL Parameters**: Support for automated setup and configuration
- **Development Server**: Integration with webpack-dev-server for hot reloading

### Browser Compatibility
- **File System Access API**: Modern file access with graceful fallback
- **Node.js Polyfills**: Webpack configuration for browser compatibility
- **ZIP Archives**: Client-side processing without server dependencies

## Contributing

1. Create a feature branch from `ts-res-browser`
2. Make your changes
3. Add tests for new functionality
4. Run tests: `rushx test`
5. Submit a pull request

## License

MIT License - see LICENSE file for details 