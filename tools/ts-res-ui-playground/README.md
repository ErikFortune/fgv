# TS-RES Browser

A visual tool for loading, browsing, and experimenting with ts-res resources. Built as a React web application for optimal performance and modern browser capabilities.

## Features

### Core Tools
- **Import View**: Load resources from files, directories, or ZIP archives using File System Access API
- **Source View**: Browse and explore built resources in alphabetical order with export capabilities
- **Filter View**: Filter resources by context for focused analysis with advanced options
- **Compiled View**: Navigate compiled resource collections in tree view
- **Resolution View**: Test resource resolution with different qualifiers and contexts, including editing and creation
- **Configuration View**: Manage qualifier types, qualifiers, and resource types
- **Resource Picker**: Interactive resource selection component
- **Grid View**: Tabular view of resources with advanced filtering and configuration options
- **Multi-Grid View**: Administrative workflow with shared context across multiple grids

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
│   │   ├── ResourcePickerTool.tsx   # Resource picker component
│   │   ├── ResourceCreationTest.tsx # Resource creation testing
│   │   └── HostControlledResolution.tsx # Host-controlled resolution demo
│   ├── editors/         # Resource editors
│   │   └── MarketInfoEditor.tsx     # Custom market info editor
│   └── common/          # Shared components
├── hooks/               # Custom React hooks
│   ├── useFileImport.ts             # File system operations
│   ├── useUrlParams.ts              # URL parameter parsing
│   └── useNavigationWarning.ts      # Navigation warning handling
├── utils/               # Utility functions
│   ├── zip/                         # Browser-specific ZIP utilities
│   ├── fileImport.ts                # File system integration
│   ├── fileTreeConverter.ts         # FileTree integration
│   ├── resourceEditorFactory.ts     # Resource editor factory
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
- **@fgv/ts-res** for resource management and ZIP archive processing
- **@fgv/ts-res-ui-components** for UI components, orchestration, and observability hooks
- **@fgv/ts-utils** for Result pattern and FileTree abstraction

## Architecture

The application follows a component-based architecture with:

### Core Systems
- **State Management**: ResourceOrchestrator component from @fgv/ts-res-ui-components with centralized state management
- **UI Components**: Views and tools from @fgv/ts-res-ui-components library for consistent user experience
- **File Access**: File System Access API with fallback to input elements
- **ZIP Processing**: ZipArchive packlet from @fgv/ts-res for unified ZIP handling
- **Resource Processing**: Direct integration with ts-res library and FileTree abstraction
- **Error Handling**: Result pattern from @fgv/ts-utils throughout
- **Observability**: Enhanced diagnostic logging and observability context

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