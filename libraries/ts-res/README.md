# @fgv/ts-res

[![NPM Version](https://img.shields.io/npm/v/@fgv/ts-res.svg)](https://www.npmjs.com/package/@fgv/ts-res)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A TypeScript library for multidimensional resource management with internationalization and localization support. `@fgv/ts-res` provides a sophisticated system for managing resources with complex conditional logic based on qualifiers like language, territory, and custom dimensions.

## Understanding the Resource Model

### What is a Resource?

In `@fgv/ts-res`, a **resource** represents a logical entity (like a user profile form, API configuration, or UI component) that can vary based on context. Instead of simple key-value pairs, resources are composed of **candidates** - each providing a full or partial representation of that entity for various different contexts.

The context is represented as a configurable set of typed **qualifiers** with some value.  Each candidate has an associated **condition set** consisting of zero or more **conditions**, each of which specifies some qualifier and a value to be matched.  Qualifiers not present in a condition set are irrelevant, so the empty condition set is *unconditional* and matches any context.

```typescript
// Traditional i18n approach - separate keys, full duplication
{
  "profile.title.en": "User Profile",
  "profile.title.fr": "Profil Utilisateur", 
  "profile.button.en": "Save Changes",
  "profile.button.fr": "Enregistrer les Modifications",
  "profile.title.en-CA": "User Profile", // Duplicated!
  "profile.button.en-CA": "Save Changes" // Duplicated!
}

// ts-res approach - one resource, multiple candidates
{
  "id": "user.profile",
  "candidates": [
    {
      "json": { "title": "User Profile", "button": "Save Changes" },
      "conditions": { "language": "en" }
    },
    {
      "json": { "title": "Profil Utilisateur", "button": "Enregistrer" },
      "conditions": { "language": "fr" }
    },
    {
      "json": { "button": "Save Eh!" }, // Only override button text
      "conditions": { "language": "en", "territory": "CA" }
    }
  ]
}
```

### Partial Candidates: The Power of Composition

It is possible that several candidates for some resource will match any given context, which enables **composition** of **partial candidates** - you don't need to duplicate entire resources, just specify what changes:

```typescript
// Base configuration for all environments
{
  "id": "api.config",
  "candidates": [
    {
      "json": { 
        "timeout": 5000,
        "retries": 3,
        "features": { "analytics": true, "debugging": false }
      },
      "conditions": {} // Base case - applies everywhere
    },
    {
      "json": { 
        "url": "https://api.production.com",
        "features": { "debugging": false }
      },
      "conditions": { "environment": "production" }
    },
    {
      "json": { 
        "url": "https://api.dev.com",
        "features": { "debugging": true } // Only override debugging
      },
      "conditions": { "environment": "development" }
    }
  ]
}
```

### Three Resolution Strategies

**1. Single Best Match** - Pick the most specific candidate only:
```typescript
// Context: { environment: "development" }
const bestMatch = resolver.resolveBestResourceCandidate('api.config').orThrow();
console.log(bestMatch.candidate.json);
// Returns: { "url": "api.dev.com", "features": { "debugging": true } }
// Note: Only the development candidate, not merged with base
```

**2. All Matching Candidates** - Get everything that matches for analysis:
```typescript
const allMatches = resolver.resolveAllCandidates('api.config').orThrow();
// Returns array: [base candidate, development candidate]
// Each candidate as separate objects, not merged
```

**3. Composed Resolution** - Merge all matching candidates in priority order:
```typescript
// Context: { language: "en", territory: "CA", userType: "admin" }
const composed = resolver.resolveComposedResourceValue('user.dashboard').orThrow();
console.log(composed);
// Returns merged result: {
//   title: 'Dashboard',                    // from base English
//   nav: { home: 'Home', settings: 'Preferences' }, // base + Canadian override
//   actions: { 
//     save: 'Save, eh!',                   // from Canadian variant
//     cancel: 'Cancel',                    // from base English  
//     admin: 'Admin Panel'                 // from admin variant
//   }
// }
```

### Why This Matters

**Eliminates Duplication**: Change base configuration once, variants inherit automatically

**Handles Complexity**: Easily manage overlapping conditions (Canadian English admin users vs regular Canadian English users)

**Maintainable**: Add new dimensions (user types, themes, devices) without restructuring existing resources

**Flexible**: Same resource system handles i18n, configuration management, feature flags, and more

## Installation

```bash
npm install @fgv/ts-res
```

## Quick Start

This example demonstrates all three resolution strategies using a user dashboard that varies by language, region, and user type:

```typescript
import * as TsRes from '@fgv/ts-res';

// 1. Create a resource manager using predefined configuration
const manager = TsRes.Resources.ResourceManagerBuilder.createPredefined('default').orThrow();

// 2. Add a resource with base + partial candidates
manager.addResource({
  id: 'user.dashboard',
  resourceTypeName: 'json',
  candidates: [
    // Base English dashboard
    {
      json: { 
        title: 'Dashboard',
        nav: { home: 'Home', settings: 'Settings' },
        actions: { save: 'Save', cancel: 'Cancel' }
      },
      conditions: { language: 'en' }
    },
    // Canadian English - only changes some terminology
    {
      json: { 
        nav: { settings: 'Preferences' }, // Only override this
        actions: { save: 'Save, eh!' }     // And this
      },
      conditions: { language: 'en', territory: 'CA' }
    },
    // Admin users get additional actions
    {
      json: {
        actions: { 
          save: 'Save',
          cancel: 'Cancel', 
          admin: 'Admin Panel' // Additional action
        }
      },
      conditions: { userType: 'admin' }
    }
  ]
}).orThrow();

// 3. Build the resource manager to prepare for resolution
manager.build().orThrow();

// 4. Create resolver and demonstrate different resolution strategies
const resolver = TsRes.ResourceResolver.create(manager).orThrow();

// Canadian admin user context
const contextualResolver = resolver.withContext({ 
  language: 'en',
  territory: 'CA',
  userType: 'admin'
}).orThrow();

// COMPOSED RESOLUTION - Merges base + Canadian + admin candidates
const composed = contextualResolver.resolveComposedResourceValue('user.dashboard').orThrow();
console.log(composed);
// Result: {
//   title: 'Dashboard',                    // from base English
//   nav: { home: 'Home', settings: 'Preferences' }, // base + Canadian override
//   actions: { 
//     save: 'Save, eh!',                   // from Canadian variant
//     cancel: 'Cancel',                    // from base English  
//     admin: 'Admin Panel'                 // from admin variant
//   }
// }

// SINGLE BEST MATCH - Get most specific candidate only
const bestMatch = contextualResolver.resolveBestResourceCandidate('user.dashboard').orThrow();
console.log(bestMatch.candidate.json);
// Returns just the admin candidate (most specific match)

// ALL MATCHES - Get all matching candidates for analysis  
const allMatches = contextualResolver.resolveAllCandidates('user.dashboard').orThrow();
console.log(`Found ${allMatches.length} matching candidates`);
// Returns array: [base English, Canadian English, admin]
```

## Features

- **Composed Resource Resolution**: Merge multiple partial candidates into complete resources
- **Multidimensional Qualifiers**: Organize by language, territory, user types, environments, and custom dimensions
- **Flexible Resolution Strategies**: Single best match, all matches, or composed resolution
- **Type-Safe**: Full TypeScript support with comprehensive type definitions
- **Partial Candidate Support**: Override only what changes, inherit the rest
- **Priority-Based Matching**: Configurable priority levels for different qualifiers
- **Resource Merging**: Support for augmenting and replacing merge strategies
- **File System Integration**: Import resources from file systems with automatic condition inference
- **Context Filtering**: Generate clean environment-specific bundles
- **BCP47 Language Support**: Built-in support for BCP47 language tags
- **Extensible Architecture**: Plugin-based system for custom qualifier types

## Technical Concepts

### Qualifiers and Conditions

**Qualifiers** define the dimensions along which resources can vary:

```typescript
// Built-in qualifiers
- language: 'en', 'fr', 'en-CA'    // BCP47 language tags
- territory: 'US', 'CA', 'FR'      // Geographic regions  
- currentTerritory: 'US'           // User's current location

// Custom qualifiers  
- userType: 'admin', 'user', 'guest'
- environment: 'dev', 'staging', 'prod'
- theme: 'light', 'dark'
- device: 'mobile', 'tablet', 'desktop'
```

**Conditions** specify when a candidate applies using qualifier-value pairs:

```typescript
{
  language: 'en-CA',     // Canadian English
  territory: 'CA',       // Canada
  userType: 'admin'      // Admin users only
}
```

### Resolution Algorithm

**Step 1: Individual Condition Scoring**
Each condition is evaluated against the context to produce a score between 0.0 (NoMatch) and 1.0 (PerfectMatch):

```typescript
// Language hierarchy matching
context: { language: "en-US" }
condition: { language: "en-US" } → 1.0 (PerfectMatch)
condition: { language: "en" }    → 0.8 (partial match - more general)
condition: { language: "fr-FR" } → 0.0 (NoMatch)

// Context list priority (earlier positions beat later)
context: { languages: ["en-US", "fr-FR"] }
condition: { language: "en" }    → matches first preference (higher score)
condition: { language: "fr-FR" } → matches second preference (lower score)

// Territory/literal hierarchies can also produce partial matches
```

**Step 2: Condition Set Evaluation**
A candidate's condition set matches only if ALL conditions score > 0.0. If any condition yields NoMatch (0.0), the entire candidate is eliminated.

**Step 3: Priority-First Ranking**
Each qualifier has a default priority that its conditions inherit. Candidates are ranked using a priority-first system:

1. **Primary rule**: Candidate with the highest priority condition ALWAYS wins
2. **Secondary rule**: Score is only used as tie-breaker when priorities are equal
3. **Comparison**: Sort conditions within each candidate by (priority DESC, score DESC), then compare candidates pairwise

```typescript
// Context: { language: "en-CA", territory: "CA" }

// Example: Language (priority 600) beats Territory (priority 400)  
Candidate A: { language: "en" }    → priority 600, score 0.8 (partial match with en-CA)
Candidate B: { territory: "CA" }   → priority 400, score 1.0 (perfect match)
// Winner: Candidate A (higher priority wins despite lower score)

// When priorities match, score breaks ties
Candidate A: { language: "en-CA" } → priority 600, score 1.0 (perfect match)
Candidate B: { language: "en" }    → priority 600, score 0.8 (partial match) 
// Winner: Candidate A (same priority, higher score)

// Multiple conditions: ALL must match, highest priority condition determines rank
Candidate C: { language: "en", territory: "CA" } → both conditions match
// Conditions: language (priority 600, score 0.8), territory (priority 400, score 1.0)  
// Candidate rank determined by highest: priority 600, score 0.8
```

**Step 4: Fallback Resolution (when no candidates match)**
If no candidates pass Step 2 (all are eliminated by `NoMatch` conditions), the system falls back to resolution considering defaults:

```typescript
// Qualifier configured with default language = "en-US"
// Context: { language: "de-DE" } (German - no candidates match)

// During fallback, NoMatch conditions get promoted to their scoreAsDefault:
condition: { language: "en-US" } → scoreAsDefault = 1.0 (perfect match with default)
condition: { language: "fr-FR" } → scoreAsDefault = 0.0 (no match with default)  
condition: { language: "en-GB" } → scoreAsDefault = 0.7 (partial match with default)

// Now English candidates become available for German users as intelligent fallbacks
```

The `scoreAsDefault` is automatically calculated when creating conditions by comparing the condition's value against the qualifier's configured default value using the same 0.0-1.0 scoring logic.

**Step 5: Resolution Strategy Application**

- **Single Best Match**: Return the top-ranked candidate only
- **All Candidates**: Return all candidates that passed matching (Step 2 or fallback Step 4), with their rankings  
- **Composed Resolution**: Merge all matching candidates in rank order (lowest rank merged first, highest rank applied last)

## Creating Resources

The most flexible and maintainable way to manage resources is through filesystem import, which automatically infers conditions and resource IDs from your directory structure.

### Filesystem Import (Recommended)

Organize your resources in a directory structure that reflects their conditions. Since values like "CA" or "FR" could be either language or territory, use explicit qualifiers or tokens:

```
resources/
├── language=en/                  # language: "en"
│   ├── dashboard.json            # id: "dashboard"
│   ├── profile.json              # id: "profile"
│   └── territory=CA/             # language: "en", territory: "CA"
│       └── dashboard.json        # id: "dashboard" (Canadian override)
├── language=fr/                  # language: "fr"
│   ├── dashboard.json            # id: "dashboard"
│   └── territory=CA/             # language: "fr", territory: "CA"
│       └── dashboard.json        # id: "dashboard" (Quebec variant)
└── _resources.json               # Resource collection or configuration
```

Or with tokens configured for brevity:

```
resources/
├── lang=en/                      # language: "en" (using token)
│   ├── dashboard.json            
│   └── terr=CA/                  # territory: "CA" (using token)
│       └── dashboard.json        
├── lang=fr/                      # language: "fr" (using token)
│   └── terr=CA/                  # territory: "CA" (using token)
│       └── dashboard.json        
└── resources-config.json         # Configuration with token definitions
```

Import resources with automatic context inference:

```typescript
import * as TsRes from '@fgv/ts-res';

// Create configuration with tokens for cleaner folder names
const config = TsRes.Config.SystemConfiguration.create({
  name: 'my-app',
  qualifierTypes: [
    TsRes.QualifierTypes.LanguageQualifierType.create().orThrow(),
    TsRes.QualifierTypes.TerritoryQualifierType.create().orThrow()
  ],
  qualifiers: [
    { name: 'language', typeName: 'language', defaultPriority: 600, token: 'lang' },
    { name: 'territory', typeName: 'territory', defaultPriority: 400, token: 'terr' }
  ],
  resourceTypes: [
    TsRes.ResourceTypes.JsonResourceType.create().orThrow()
  ]
}).orThrow();

const manager = TsRes.Resources.ResourceManagerBuilder.create(config).orThrow();

// Import from filesystem - conditions are inferred from folder names
const importManager = TsRes.Import.ImportManager.create({
  filetree: fileTree,
  resources: manager,
  importers: TsRes.Import.ImportManager.getDefaultImporters(),
  initialContext: TsRes.Import.ImportContext.create().orThrow()
}).orThrow();

const result = importManager.importFromFileSystem({
  type: 'path',
  path: './resources'
}).orThrow();

// Result: All resources loaded with appropriate conditions
// - resources/lang=en/dashboard.json → { language: "en" }
// - resources/lang=en/terr=CA/dashboard.json → { language: "en", territory: "CA" }
```

### Resource File Formats

Resources can be stored in two formats:

**1. Resource Collection Format** (`_resources.json`):

Resource collections are flexible containers that can include:
- **Loose resources**: Complete resources with their candidates
- **Loose candidates**: Additional candidates to merge with existing resources
- **Nested collections**: Collections within collections for organization

```json
{
  "resources": [
    {
      "id": "dashboard",
      "candidates": [
        {
          "json": { "title": "Dashboard", "welcome": "Welcome!" },
          "conditions": { "language": "en" }
        }
      ]
    }
  ],
  "candidates": [
    {
      "resourceId": "dashboard",
      "json": { "welcome": "Welcome, eh!" },
      "conditions": { "language": "en", "territory": "CA" }
    },
    {
      "resourceId": "profile",
      "json": { "title": "User Profile" },
      "conditions": { "language": "en" }
    }
  ],
  "collections": [
    {
      "name": "legal",
      "resources": [
        {
          "id": "legal.privacy",
          "candidates": [
            {
              "json": { "url": "/privacy.html" },
              "conditions": {}
            }
          ]
        }
      ]
    }
  ]
}
```

The importer merges all these elements:
- Loose candidates are added to their target resources
- Nested collections are flattened with appropriate ID prefixing
- Multiple candidates for the same resource are merged

**2. Resource Tree Format** (individual JSON files):
```json
// resources/en/dashboard.json
{
  "title": "Dashboard",
  "welcome": "Welcome!",
  "nav": {
    "home": "Home",
    "settings": "Settings"
  }
}

// resources/en/CA/dashboard.json (partial override)
{
  "welcome": "Welcome, eh!",
  "nav": {
    "settings": "Preferences"  // Canadian terminology
  }
}
```

### Context Collection During Import

The importer recognizes qualifier values in folder and file names using specific patterns:

**1. Default Pattern: `qualifier=value`**
```
resources/
├── language=en/              # { language: "en" }
├── language=fr-CA/           # { language: "fr-CA" }
├── territory=US/             # { territory: "US" }
└── environment=production/   # { environment: "production" }
```

**2. Token Shorthand (when configured)**
Qualifiers can define a "token" for brevity:
```typescript
// Configuration
{
  qualifiers: [
    { name: "language", token: "lang" },        // Allow "lang=en" 
    { name: "homeTerritory", token: "home" },   // Allow "home=US"
    { name: "environment", token: "env" }       // Allow "env=prod"
  ]
}
```
```
resources/
├── lang=en-US/               # { language: "en-US" } via token
├── home=CA/                  # { homeTerritory: "CA" } via token
└── env=production/           # { environment: "production" } via token
```

**3. Optional Token Pattern (use with caution!)**
When `tokenIsOptional: true`, the qualifier name/token can be omitted:
```typescript
{
  qualifiers: [
    { 
      name: "homeTerritory", 
      token: "home",
      tokenIsOptional: true  // DANGER: "CA" alone will match!
    }
  ]
}
```
```
resources/
├── CA/                       # { homeTerritory: "CA" } - matches without prefix!
├── home=US/                  # { homeTerritory: "US" } - explicit still works
└── strings/                  # Regular folder (if "strings" isn't a valid territory)
```

**⚠️ Warning**: Be very cautious with `tokenIsOptional`. If your qualifier accepts permissive values (like territories that could be any 2-letter code), ordinary folder names might be misinterpreted as qualifier values.

**4. Context Accumulation**
Nested folders inherit and combine parent conditions:
```
resources/
└── language=en/
    └── territory=CA/
        └── role=admin/       # { language: "en", territory: "CA", role: "admin" }
```

**5. Resource ID Prefixing**
Non-qualifier folders become part of the resource ID:
```
resources/
├── legal/                    # Not a qualifier, becomes ID prefix
│   ├── privacy.json          # id: "legal.privacy"
│   └── territory=EU/
│       └── privacy.json      # id: "legal.privacy", conditions: { territory: "EU" }
└── language=fr/
    └── legal/
        └── privacy.json      # id: "legal.privacy", conditions: { language: "fr" }
```

### Manual Resource Creation (Alternative)

For simple cases or dynamic resources, you can create them programmatically:

```typescript
manager.addResource({
  id: 'api.config',
  resourceTypeName: 'json',
  candidates: [
    {
      json: { url: 'localhost:3000' },
      conditions: { environment: 'development' }
    },
    {
      json: { url: 'api.production.com' },
      conditions: { environment: 'production' }
    }
  ]
}).orThrow();
```

This is useful for configuration that changes based on deployment environment or resources generated at runtime.

## Advanced Usage

### Custom Priority and Default Scoring

While priority and `scoreAsDefault` are typically determined automatically by qualifier configuration, they can be overridden for advanced use cases:

**Use Case 1: Custom Priority for Territory-Based Content**

For legal documents and branding, territory often matters more than language:

```typescript
// Configuration: Elevate territory priority for legal/brand content
const territoryPriorityConfig = TsRes.Config.SystemConfiguration.create({
  name: 'territory-priority',
  qualifierTypes: [
    TsRes.QualifierTypes.LanguageQualifierType.create().orThrow(),
    TsRes.QualifierTypes.TerritoryQualifierType.create().orThrow()
  ],
  qualifiers: [
    { name: 'language', typeName: 'language', defaultPriority: 600 },
    { name: 'currentTerritory', typeName: 'territory', defaultPriority: 700 } // Higher than language
  ],
  resourceTypes: [TsRes.ResourceTypes.JsonResourceType.create().orThrow()]
}).orThrow();

// Legal document with territory-specific versions
manager.addResource({
  id: 'legal.privacy-policy',
  candidates: [
    {
      json: { url: '/privacy-us.html' },
      conditions: { currentTerritory: 'US' } // Priority 700
    },
    {
      json: { url: '/privacy-ca.html' },
      conditions: { currentTerritory: 'CA' } // Priority 700
    },
    {
      json: { url: '/privacy-generic-fr.html' },
      conditions: { language: 'fr' } // Priority 600 (lower)
    }
  ]
}).orThrow();

// Context: { language: 'fr-CA', currentTerritory: 'CA' }
// Winner: Canadian privacy policy (territory priority 700 > language priority 600)
// Result: { url: '/privacy-ca.html' } - legally correct for Canada
```

**Use Case 2: Custom scoreAsDefault for "Original Language" Scenarios**

For content like quotes or historical documents, you might want to preserve the original language:

```typescript
// Configuration: Custom scoreAsDefault for originalLanguage qualifier  
const originalLanguageConfig = TsRes.Config.SystemConfiguration.create({
  name: 'preserve-original',
  qualifierTypes: [
    TsRes.QualifierTypes.LanguageQualifierType.create().orThrow()
  ],
  qualifiers: [
    { name: 'language', typeName: 'language', defaultPriority: 600, defaultValue: 'en' },
    { name: 'originalLanguage', typeName: 'language', defaultPriority: 650, defaultValue: 'original' }
  ],
  resourceTypes: [TsRes.ResourceTypes.JsonResourceType.create().orThrow()]
}).orThrow();

// Historical quote that should prefer original language
manager.addResource({
  id: 'quotes.einstein',
  candidates: [
    {
      json: { text: 'Gott würfelt nicht', attribution: 'Einstein, 1926' },
      conditions: { originalLanguage: 'de' } // German original, scoreAsDefault = 1.0
    },
    {
      json: { text: 'God does not play dice', attribution: 'Einstein, 1926' },
      conditions: { language: 'en' } // English translation, scoreAsDefault = calculated from default
    }
  ]
}).orThrow();

// Context: { language: 'fr' } (French user, no direct matches)
// Fallback resolution: originalLanguage='de' gets scoreAsDefault=1.0, language='en' gets lower score
// Winner: German original (higher scoreAsDefault in fallback resolution)
// Result: { text: 'Gott würfelt nicht', attribution: 'Einstein, 1926' }
```

These patterns ensure that content with special requirements (legal compliance, historical accuracy) gets appropriate priority treatment.

**Individual Condition Overrides for Outlier Cases**

For rare exceptions, you can override priority or scoreAsDefault directly in individual condition declarations without creating new configurations:

```typescript
// Most content uses standard language/territory priorities
// But this specific legal resource needs territory to take precedence

manager.addResource({
  id: 'legal.gdpr-notice',
  candidates: [
    {
      json: { text: 'GDPR applies', url: '/gdpr-eu.html' },
      conditions: { 
        territory: { 
          qualifier: 'territory',
          operator: 'eq', 
          value: 'EU',
          priority: 700  // Override: higher than normal territory priority
        }
      }
    },
    {
      json: { text: 'Generic privacy notice', url: '/privacy.html' },
      conditions: { language: 'en' } // Uses default language priority (600)
    }
  ]
}).orThrow();

// Individual scoreAsDefault override for a specific quote
manager.addResource({
  id: 'quotes.shakespeare',
  candidates: [
    {
      json: { text: 'To be or not to be', source: 'Hamlet' },
      conditions: {
        originalLanguage: {
          qualifier: 'originalLanguage',
          operator: 'eq',
          value: 'en',
          scoreAsDefault: 1.0  // Override: perfect fallback score for English original
        }
      }
    }
  ]
}).orThrow();
```

This approach is more efficient than creating separate configurations when you only have occasional exceptions to the standard priority rules.

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