# TS-RES Browser

A visual tool for loading, browsing, and experimenting with ts-res resources. Built as a React web application for optimal performance and modern browser capabilities.

## Features

- **Source Browser**: Browse and explore built resources
- **Compiled Browser**: Navigate compiled resource collections
- **Resolution Viewer**: Test resource resolution with different qualifiers
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

1. **Import Files**: Click "Import Files" to select your ts-res project files
2. **Browse Resources**: Use the sidebar to navigate between different tools
3. **Explore**: View resource details, test resolution, and experiment with qualifiers

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
│   ├── layout/          # Layout components
│   ├── tools/           # Tool-specific components
│   └── common/          # Shared components
├── hooks/               # Custom React hooks
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
├── App.tsx              # Main application component
└── main.tsx             # Application entry point
```

### Technology Stack

- **React 18+** with TypeScript
- **Webpack** for bundling
- **Tailwind CSS** for styling
- **Heroicons** for iconography
- **@fgv/ts-res** for resource management

## Architecture

The application follows a component-based architecture with:

- **State Management**: React Context + useReducer
- **File Access**: File System Access API with fallback
- **Error Handling**: Result pattern from @fgv/ts-utils
- **Testing**: Jest with React Testing Library

## Contributing

1. Create a feature branch from `ts-res-browser`
2. Make your changes
3. Add tests for new functionality
4. Run tests: `rushx test`
5. Submit a pull request

## License

MIT License - see LICENSE file for details 