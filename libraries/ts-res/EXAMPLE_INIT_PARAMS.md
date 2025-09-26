# SystemConfiguration InitParams Example

This example demonstrates the new `ISystemConfigurationInitParams` functionality that allows setting qualifier default values during SystemConfiguration creation.

## Basic Usage

```typescript
import * as TsRes from '@fgv/ts-res';

// Create a SystemConfiguration with qualifier default values
const initParams: TsRes.Config.ISystemConfigurationInitParams = {
  qualifierDefaultValues: {
    'language': 'en-US',
    'currentTerritory': 'US'
  }
};

const systemConfig = TsRes.Config.SystemConfiguration.create(
  baseConfig, 
  initParams
).orThrow();

// The qualifiers now have default values
const languageQualifier = systemConfig.qualifiers.validating.get('language').orThrow();
console.log(languageQualifier.defaultValue); // 'en-US'

const territoryQualifier = systemConfig.qualifiers.validating.get('currentTerritory').orThrow();
console.log(territoryQualifier.defaultValue); // 'US'
```

## Using with Predefined Configurations

```typescript
// Apply qualifier default values to a predefined configuration
const systemConfig = TsRes.Config.getPredefinedSystemConfiguration(
  'default',
  {
    qualifierDefaultValues: {
      'language': 'fr-FR',
      'currentTerritory': 'FR'
    }
  }
).orThrow();
```

## Removing Default Values

```typescript
// Use null to remove existing default values
const initParams: TsRes.Config.ISystemConfigurationInitParams = {
  qualifierDefaultValues: {
    'language': null  // Removes the default value
  }
};
```

## Validation

The system validates default values according to the qualifier type rules:

```typescript
// This will fail because 'invalid-language-tag' is not a valid BCP47 language tag
const badParams: TsRes.Config.ISystemConfigurationInitParams = {
  qualifierDefaultValues: {
    'language': 'invalid-language-tag'
  }
};

const result = TsRes.Config.SystemConfiguration.create(baseConfig, badParams);
// result.isFailure() === true
// result.message includes validation error
```

## Helper Function

You can also use the helper function directly:

```typescript
const updatedConfig = TsRes.Config.updateSystemConfigurationQualifierDefaultValues(
  originalConfig,
  {
    'language': 'de-DE',
    'currentTerritory': 'DE'
  }
).orThrow();

const systemConfig = TsRes.Config.SystemConfiguration.create(updatedConfig).orThrow();
```