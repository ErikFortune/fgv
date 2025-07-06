# @fgv/ts-res

[![NPM Version](https://img.shields.io/npm/v/@fgv/ts-res.svg)](https://www.npmjs.com/package/@fgv/ts-res)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A TypeScript library for multidimensional resource management with internationalization and localization support. `@fgv/ts-res` provides a sophisticated system for managing resources with complex conditional logic based on qualifiers like language, territory, and custom dimensions.

## Features

- **Multidimensional Resource Management**: Organize resources by language, territory, and custom qualifiers
- **Conditional Resource Resolution**: Automatic selection of the most appropriate resource based on context
- **Type-Safe**: Full TypeScript support with comprehensive type definitions
- **Flexible Resource Formats**: Support for JSON resources with extensible resource types
- **Hierarchical Organization**: Tree-based and collection-based resource structures
- **File System Integration**: Import resources from file systems with automatic condition inference
- **Priority-Based Resolution**: Configurable priority levels for different qualifiers
- **Resource Merging**: Support for augmenting and replacing resources
- **BCP47 Language Support**: Built-in support for BCP47 language tags
- **Extensible Architecture**: Plugin-based system for custom qualifier types

## Installation

```bash
npm install @fgv/ts-res
```

## Quick Start

```typescript
import * as TsRes from '@fgv/ts-res';

// 1. Set up qualifier types
const qualifierTypes = TsRes.QualifierTypes.QualifierTypeCollector.create({
  qualifierTypes: [
    TsRes.QualifierTypes.LanguageQualifierType.create().orThrow(),
    TsRes.QualifierTypes.TerritoryQualifierType.create().orThrow()
  ]
}).orThrow();

// 2. Define qualifiers with priorities
const qualifiers = TsRes.Qualifiers.QualifierCollector.create({
  qualifierTypes,
  qualifiers: [
    { name: 'language', typeName: 'language', defaultPriority: 600 },
    { name: 'territory', typeName: 'territory', defaultPriority: 700 }
  ]
}).orThrow();

// 3. Set up resource types
const resourceTypes = TsRes.ResourceTypes.ResourceTypeCollector.create({
  resourceTypes: [
    TsRes.ResourceTypes.JsonResourceType.create().orThrow()
  ]
}).orThrow();

// 4. Create resource manager
const manager = TsRes.Resources.ResourceManager.create({
  qualifiers,
  resourceTypes
}).orThrow();

// 5. Add resources
const resources = [
  {
    id: 'greeting.message',
    json: { message: 'Hello' },
    conditions: { language: 'en' }
  },
  {
    id: 'greeting.message',
    json: { message: 'Bonjour' },
    conditions: { language: 'fr' }
  },
  {
    id: 'greeting.message',
    json: { message: 'Hello from Canada' },
    conditions: { 
      language: 'en-CA',
      territory: 'CA'
    }
  }
];

resources.forEach(resource => {
  manager.addLooseCandidate(resource).orThrow();
});

// 6. Build and resolve resources
manager.build().orThrow();

const greetingResource = manager.getBuiltResource('greeting.message').orThrow();
const context = { language: 'en-CA', territory: 'CA' };
const candidates = greetingResource.getCandidatesForContext(context);

// Returns the most specific match: "Hello from Canada"
```

## Core Concepts

### Qualifiers

Qualifiers are dimensions along which resources can vary. Common qualifiers include:

- **Language**: BCP47 language tags (e.g., 'en', 'fr', 'en-CA')
- **Territory**: Geographic regions (e.g., 'US', 'CA', 'FR')
- **Custom**: Application-specific dimensions (e.g., 'theme', 'userType')

### Conditions

Conditions determine when a resource candidate applies. They consist of qualifier-value pairs:

```typescript
{
  language: 'en-CA',
  territory: 'CA',
  theme: 'dark'
}
```

### Resource Resolution

The library automatically selects the most appropriate resource based on:

1. **Specificity**: More specific conditions take precedence
2. **Priority**: Higher priority qualifiers are weighted more heavily
3. **Fallback**: Graceful degradation when exact matches aren't found

## Advanced Usage

### Resource Building with ResourceBuilder

```typescript
const builder = TsRes.Resources.ResourceBuilder.create({
  qualifiers,
  resourceTypes
}).orThrow();

const resource = builder
  .withId('user.profile')
  .withResourceTypeName('json')
  .withCandidate({
    json: { title: 'Profile', button: 'Edit' },
    conditions: { language: 'en' }
  })
  .withCandidate({
    json: { title: 'Profil', button: 'Modifier' },
    conditions: { language: 'fr' }
  })
  .build()
  .orThrow();

manager.addResource(resource).orThrow();
```

### File System Integration

```typescript
// Import resources from file system
const importManager = TsRes.Import.ImportManager.create({
  filetree: fileTree,
  resources: resourceManager,
  importers: TsRes.Import.ImportManager.getDefaultImporters(),
  initialContext: TsRes.Import.ImportContext.create().orThrow()
}).orThrow();

const importResult = importManager.importFromFileSystem({
  type: 'path',
  path: './resources'
}).orThrow();
```

### Resource Merging

Resources support different merge strategies:

```typescript
{
  id: 'app.config',
  json: { apiUrl: 'https://api.example.com' },
  conditions: { environment: 'production' },
  mergeMethod: 'replace' // or 'augment' (default)
}
```

### Custom Qualifier Types

```typescript
const customType = TsRes.QualifierTypes.LiteralQualifierType.create({
  key: 'userType',
  values: ['admin', 'user', 'guest'],
  hierarchy: {
    'admin': ['user', 'guest'],
    'user': ['guest']
  }
}).orThrow();
```

## API Reference

### Core Classes

- **ResourceManager**: Central orchestrator for resource operations
- **Resource**: Individual resource with candidates for different contexts
- **ResourceCandidate**: Specific resource variant with conditions
- **ResourceBuilder**: Builder pattern for constructing resources
- **QualifierCollector**: Manages qualifier definitions
- **ConditionSet**: Collection of conditions for resource matching

### Namespaces

- **Resources**: Core resource management classes
- **Qualifiers**: Qualifier definition and management
- **Conditions**: Condition and condition set management
- **QualifierTypes**: Built-in and custom qualifier type definitions
- **Context**: Context definition for resource resolution
- **Import**: File system and external resource import utilities
- **ResourceJson**: JSON serialization and deserialization

## Common Patterns

### Web Application Localization

```typescript
// Set up for multi-language, multi-region application
const qualifiers = [
  { name: 'language', typeName: 'language', defaultPriority: 600 },
  { name: 'homeTerritory', typeName: 'territory', defaultPriority: 700 },
  { name: 'currentTerritory', typeName: 'territory', defaultPriority: 800 }
];

// Resources with fallback chains
const resources = [
  // Default English
  { id: 'app.title', json: { title: 'My App' }, conditions: { language: 'en' } },
  // Canadian English variant
  { id: 'app.title', json: { title: 'My App, eh!' }, conditions: { language: 'en-CA' } },
  // French
  { id: 'app.title', json: { title: 'Mon App' }, conditions: { language: 'fr' } }
];
```

### Configuration Management

```typescript
// Environment-specific configurations
const configs = [
  { id: 'api.config', json: { url: 'localhost:3000' }, conditions: { env: 'development' } },
  { id: 'api.config', json: { url: 'api.staging.com' }, conditions: { env: 'staging' } },
  { id: 'api.config', json: { url: 'api.production.com' }, conditions: { env: 'production' } }
];
```

## Dependencies

- **@fgv/ts-utils**: Core utilities and Result pattern
- **@fgv/ts-extras**: Additional utility functions
- **@fgv/ts-json-base**: JSON validation and processing
- **@fgv/ts-bcp47**: BCP47 language tag processing
- **@fgv/ts-json**: JSON schema validation
- **luxon**: Date/time handling

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm run test

# Run tests with coverage
npm run coverage

# Lint code
npm run lint

# Generate documentation
npm run build-docs
```

## License

MIT License. See [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome! Please read the contributing guidelines and submit pull requests to the [main repository](https://github.com/ErikFortune/fgv).

## Support

For questions, issues, or feature requests, please visit the [GitHub issues page](https://github.com/ErikFortune/fgv/issues).