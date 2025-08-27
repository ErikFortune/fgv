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

// 1. Create a resource manager using predefined configuration
const manager = TsRes.Resources.ResourceManagerBuilder.createPredefined('default').orThrow();

// 2. Add resources with different language/territory conditions
manager.addResource({
  id: 'greeting.message',
  resourceTypeName: 'json',
  candidates: [
    {
      json: { message: 'Hello' },
      conditions: { language: 'en' }
    },
    {
      json: { message: 'Bonjour' },
      conditions: { language: 'fr' }
    },
    {
      json: { message: 'Hello from Canada' },
      conditions: { 
        language: 'en-CA',
        currentTerritory: 'CA'
      }
    }
  ]
}).orThrow();

// 3. Build the resource manager to prepare for resolution
manager.build().orThrow();

// 4. Resolve resources for specific contexts
const resolver = TsRes.ResourceResolver.create(manager).orThrow();

// Get resolver for Canadian English context
const caResolver = resolver.withContext({ 
  language: 'en-CA', 
  currentTerritory: 'CA' 
}).orThrow();

// Resolve the greeting message - returns: { message: "Hello from Canada" }
const greeting = caResolver.resolveComposedResourceValue('greeting.message').orThrow();
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
// Using the resource manager's builder for individual resources
const manager = TsRes.Resources.ResourceManagerBuilder.createPredefined('default').orThrow();

manager.addResource({
  id: 'user.profile',
  resourceTypeName: 'json',
  candidates: [
    {
      json: { title: 'Profile', button: 'Edit' },
      conditions: { language: 'en' }
    },
    {
      json: { title: 'Profil', button: 'Modifier' },
      conditions: { language: 'fr' }
    }
  ]
}).orThrow();
```

### File System Integration

```typescript
// Create a resource manager and import from file system
const manager = TsRes.Resources.ResourceManagerBuilder.createPredefined('default').orThrow();

const importManager = TsRes.Import.ImportManager.create({
  filetree: fileTree,
  resources: manager,
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

### Custom System Configuration

```typescript
// Create a system configuration with custom qualifiers and types
const customConfig = TsRes.Config.SystemConfiguration.create({
  name: 'custom-config',
  description: 'Custom configuration with user types',
  qualifierTypes: [
    TsRes.QualifierTypes.LanguageQualifierType.create().orThrow(),
    TsRes.QualifierTypes.LiteralQualifierType.create({
      key: 'userType',
      values: ['admin', 'user', 'guest'],
      hierarchy: {
        'admin': ['user', 'guest'],
        'user': ['guest']
      }
    }).orThrow()
  ],
  qualifiers: [
    { name: 'language', typeName: 'language', defaultPriority: 600 },
    { name: 'userType', typeName: 'userType', defaultPriority: 500 }
  ],
  resourceTypes: [
    TsRes.ResourceTypes.JsonResourceType.create().orThrow()
  ]
}).orThrow();

const manager = TsRes.Resources.ResourceManagerBuilder.create({
  qualifiers: customConfig.qualifiers,
  resourceTypes: customConfig.resourceTypes
}).orThrow();
```

## API Reference

### Core Classes

- **ResourceManagerBuilder**: Central builder for resource management systems
- **ResourceResolver**: Runtime resolver for getting resources in specific contexts
- **Resource**: Individual resource with candidates for different contexts
- **ResourceCandidate**: Specific resource variant with conditions
- **SystemConfiguration**: Configuration defining qualifiers, types, and defaults
- **Condition**: Individual condition with qualifier, operator, and value
- **ConditionSet**: Collection of conditions for resource matching

### Namespaces

- **Resources**: Core resource management classes (`ResourceManagerBuilder`, etc.)
- **Config**: System configuration classes (`SystemConfiguration`, predefined configs)
- **Qualifiers**: Qualifier definition and management
- **Conditions**: Condition and condition set management
- **QualifierTypes**: Built-in and custom qualifier type definitions
- **Context**: Context definition for resource resolution
- **Import**: File system and external resource import utilities
- **ResourceJson**: JSON serialization and deserialization
- **Bundle**: Resource bundling and deployment utilities
- **Runtime**: Runtime resolution classes (`ResourceResolver`, etc.)

## Context Filtering and Qualifier Reduction

One feature of ts-res is its ability to create filtered, context-specific resource bundles with reduced qualifiers. This is particularly useful for operational scenarios like feature flag management across different environments.

### The Problem: Noisy Environment-Specific Bundles

Consider a feature flag system with different settings across environments:

```typescript
// Feature flags with environment-specific settings
const featureFlags = [
  {
    id: 'features.newDashboard',
    json: { enabled: false, rolloutPercent: 0 },
    conditions: { environment: 'production' }
  },
  {
    id: 'features.newDashboard', 
    json: { enabled: true, rolloutPercent: 50 },
    conditions: { environment: 'integration' }
  },
  {
    id: 'features.newDashboard',
    json: { enabled: true, rolloutPercent: 100 },
    conditions: { environment: 'development' }
  },
  {
    id: 'features.betaAPI',
    json: { enabled: false, version: 'v1' },
    conditions: { environment: 'production' }
  },
  {
    id: 'features.betaAPI',
    json: { enabled: true, version: 'v2' },
    conditions: { environment: 'integration' }
  },
  {
    id: 'features.betaAPI',
    json: { enabled: true, version: 'v2-beta' },
    conditions: { environment: 'development' }
  }
];
```

### Step 1: No Filtering (Complete Bundle)

Without filtering, your complete bundle contains all environments:

```typescript
const completeBundle = resourceManager.getResourceCollectionDecl().orThrow();

// Result: All candidates with all environment conditions
{
  "resources": [
    {
      "id": "features.newDashboard",
      "candidates": [
        {
          "json": { "enabled": false, "rolloutPercent": 0 },
          "conditions": { "environment": "production" }
        },
        {
          "json": { "enabled": true, "rolloutPercent": 50 },
          "conditions": { "environment": "integration" }
        },
        {
          "json": { "enabled": true, "rolloutPercent": 100 },
          "conditions": { "environment": "development" }
        }
      ]
    },
    // ... more resources with similar environment conditions
  ]
}
```

**Problem**: Bundle contains all environments, making it difficult to compare environment-specific configurations.

### Step 2: Context Filtering Only

Filter for a specific environment (e.g., production):

```typescript
const resourceManager = TsRes.Resources.ResourceManagerBuilder.createPredefined('default').orThrow();
// ... add feature flag resources ...
resourceManager.build().orThrow();

const productionContext = resourceManager.validateContext({ 
  environment: 'production' 
}).orThrow();

const filteredBundle = resourceManager.getResourceCollectionDecl({
  filterForContext: productionContext
  // reduceQualifiers: false (default)
}).orThrow();

// Result: Only production candidates, but environment conditions remain
{
  "resources": [
    {
      "id": "features.newDashboard", 
      "candidates": [
        {
          "json": { "enabled": false, "rolloutPercent": 0 },
          "conditions": { "environment": "production" }  // Environment condition still present
        }
      ]
    },
    {
      "id": "features.betaAPI",
      "candidates": [
        {
          "json": { "enabled": false, "version": "v1" },
          "conditions": { "environment": "production" }  // Environment condition still present
        }
      ]
    }
  ]
}
```

**Improvement**: Bundle size reduced, but environment conditions add noise when comparing between environments.

### Step 3: Context Filtering + Qualifier Reduction

Filter for production AND reduce redundant qualifiers:

```typescript
const cleanProductionBundle = resourceManager.getResourceCollectionDecl({
  filterForContext: productionContext,
  reduceQualifiers: true  // Enable qualifier reduction
}).orThrow();

// Result: Clean production bundle with environment conditions removed
{
  "resources": [
    {
      "id": "features.newDashboard",
      "candidates": [
        {
          "json": { "enabled": false, "rolloutPercent": 0 }
          // conditions: {} - Environment condition removed!
        }
      ]
    },
    {
      "id": "features.betaAPI", 
      "candidates": [
        {
          "json": { "enabled": false, "version": "v1" }
          // conditions: {} - Environment condition removed!
        }
      ]
    }
  ]
}
```

**Benefits**: 
- **Clean bundles**: No irrelevant environment conditions
- **Easy comparison**: Compare bundles between environments to see actual differences
- **Reduced noise**: Focus on configuration values, not deployment context

### Easy Environment Comparison

Now you can easily compare configuration differences between environments:

```typescript
// Get clean bundles for each environment
const [prodBundle, devBundle] = await Promise.all([
  getCleanBundle('production'),
  getCleanBundle('development')
]);

// Compare actual differences without environment noise
function compareFeatureFlags(prod, dev) {
  prod.resources.forEach(prodResource => {
    const devResource = dev.resources.find(r => r.id === prodResource.id);
    const prodConfig = prodResource.candidates[0].json;
    const devConfig = devResource.candidates[0].json;
    
    if (JSON.stringify(prodConfig) !== JSON.stringify(devConfig)) {
      console.log(`${prodResource.id} differs:`, {
        production: prodConfig,
        development: devConfig
      });
    }
  });
}

// Output:
// features.newDashboard differs: {
//   production: { enabled: false, rolloutPercent: 0 },
//   development: { enabled: true, rolloutPercent: 100 }
// }
// features.betaAPI differs: {
//   production: { enabled: false, version: 'v1' },
//   development: { enabled: true, version: 'v2-beta' }
// }
```

### Advanced: Multi-Qualifier Scenarios

Qualifier reduction is intelligent - it only removes qualifiers that match perfectly across ALL filtered candidates:

```typescript
// Resource with environment + language conditions
const multiQualifierResource = {
  id: 'features.localized',
  candidates: [
    {
      json: { enabled: true, locale: 'en-US' },
      conditions: { environment: 'production', language: 'en', territory: 'US' }
    },
    {
      json: { enabled: true, locale: 'en-GB' },
      conditions: { environment: 'production', language: 'en', territory: 'GB' }
    },
    {
      json: { enabled: true, locale: 'fr-FR' },
      conditions: { environment: 'production', language: 'fr', territory: 'FR' }
    }
  ]
};

// Filter by environment only
const result = resource.toLooseResourceDecl({
  filterForContext: { environment: 'production' },
  reduceQualifiers: true
});

// Result: Environment reduced (all match 'production'), language/territory preserved (they differ)
{
  "candidates": [
    {
      "json": { "enabled": true, "locale": "en-US" },
      "conditions": { "language": "en", "territory": "US" }  // environment removed, others preserved
    },
    {
      "json": { "enabled": true, "locale": "en-GB" },
      "conditions": { "language": "en", "territory": "GB" }  // environment removed, others preserved
    },
    {
      "json": { "enabled": true, "locale": "fr-FR" },
      "conditions": { "language": "fr", "territory": "FR" }  // environment removed, others preserved
    }
  ]
}
```

### Use Cases

**Feature Flag Management**: Clean environment-specific bundles for operational analysis
**Configuration Deployment**: Environment-specific configs without deployment noise  
**A/B Testing**: Clean experiment configurations for specific user segments
**Internationalization**: Language-specific bundles without region clutter
**Multi-tenant Applications**: Tenant-specific configurations without organizational context

## Common Patterns

### Web Application Localization

```typescript
// Use predefined configuration or create custom one with territories
const manager = TsRes.Resources.ResourceManagerBuilder.createPredefined('territoryPriority').orThrow();

manager.addResource({
  id: 'app.title',
  resourceTypeName: 'json',
  candidates: [
    // Default English
    { json: { title: 'My App' }, conditions: { language: 'en' } },
    // Canadian English variant
    { json: { title: 'My App, eh!' }, conditions: { language: 'en-CA' } },
    // French
    { json: { title: 'Mon App' }, conditions: { language: 'fr' } }
  ]
}).orThrow();

manager.build().orThrow();

// Create resolver for Canadian user
const resolver = TsRes.ResourceResolver.create(manager).orThrow();
const canadianResolver = resolver.withContext({ 
  language: 'en-CA', 
  currentTerritory: 'CA' 
}).orThrow();

const title = canadianResolver.resolveComposedResourceValue('app.title').orThrow();
// Returns: { title: 'My App, eh!' }
```

### Configuration Management

```typescript
// Create manager with custom environment qualifier
const manager = TsRes.Resources.ResourceManagerBuilder.createPredefined('default').orThrow();

manager.addResource({
  id: 'api.config',
  resourceTypeName: 'json',
  candidates: [
    { json: { url: 'localhost:3000' }, conditions: { environment: 'development' } },
    { json: { url: 'api.staging.com' }, conditions: { environment: 'staging' } },
    { json: { url: 'api.production.com' }, conditions: { environment: 'production' } }
  ]
}).orThrow();

manager.build().orThrow();

// Resolve configuration for production
const resolver = TsRes.ResourceResolver.create(manager).orThrow();
const prodResolver = resolver.withContext({ environment: 'production' }).orThrow();
const config = prodResolver.resolveComposedResourceValue('api.config').orThrow();
// Returns: { url: 'api.production.com' }
```

## Dependencies

- **@fgv/ts-utils**: Core utilities and Result pattern
- **@fgv/ts-extras**: Additional utility functions
- **@fgv/ts-json-base**: JSON validation and processing
- **@fgv/ts-bcp47**: BCP47 language tag processing
- **@fgv/ts-json**: JSON schema validation
- **luxon**: Date/time handling

## Development

This library is part of a Rush monorepo. Development commands:

```bash
# Install dependencies (from repository root)
rush install

# Build the project 
rushx build

# Run tests
rushx test

# Run tests with coverage
rushx coverage

# Lint code
rushx lint

# Fix linting issues
rushx fixlint

# Generate API documentation
rushx build-docs

# Build project and docs together
rushx build-all
```

## License

MIT License. See [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome! Please read the contributing guidelines and submit pull requests to the [main repository](https://github.com/ErikFortune/fgv).

## Support

For questions, issues, or feature requests, please visit the [GitHub issues page](https://github.com/ErikFortune/fgv/issues).