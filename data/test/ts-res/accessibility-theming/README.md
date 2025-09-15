# Accessibility Theming Test Data

This directory contains test data showcasing custom qualifier types for accessibility theming, specifically the **contrast** qualifier type.

## Overview

The accessibility theming configuration demonstrates:

- **Custom Qualifier Type**: `contrast` with values `standard`, `high`, `black`, `white`
- **Hierarchical Matching**: `high` matches any of `high`, `black`, or `white`
- **Real-world Use Case**: Theme color resources that adapt to accessibility requirements

## Files

### Configuration
- `../config-variations/accessibility-theming.json` - System configuration defining the contrast qualifier type

### Resources
- `colors/button-colors.res.json` - Button color variations for different contrast levels
- `colors/background-colors.res.json` - Background colors that adapt to contrast requirements  
- `colors/text-colors.res.json` - Text colors optimized for accessibility

## Contrast Qualifier Type

The custom `contrast` qualifier type supports these values:

- **`standard`** - Default contrast level for normal users
- **`high`** - High contrast mode (matches `high`, `black`, or `white`)  
- **`black`** - Specific black high-contrast theme
- **`white`** - Specific white high-contrast theme

### Matching Behavior

The contrast qualifier type implements special matching logic:

1. **Exact matches** get perfect scores
2. **`high` matches any high-contrast value** (`high`, `black`, `white`) with score 0.8
3. **Any high-contrast value matches `high`** with score 0.8
4. **Non-matching values** get no match

## Using in the Playground

1. **Load the configuration**: Import `../config-variations/accessibility-theming.json`
2. **Load the resources**: Import the JSON files from the `colors/` directory
3. **Test different contexts**:
   - `contrast=standard, component=button` - Gets standard button colors
   - `contrast=high, component=button` - Gets high-contrast button colors  
   - `contrast=black, component=button` - Gets specific black theme colors
   - `contrast=white, component=button` - Gets specific white theme colors

## Example Contexts

```json
// Standard button in light theme
{
  "contrast": "standard",
  "theme": "light", 
  "component": "button"
}

// High contrast button (will match black/white variants too)
{
  "contrast": "high",
  "component": "button"
}

// Specific black high-contrast background
{
  "contrast": "black",
  "component": "background"  
}

// Text colors for white high-contrast theme
{
  "contrast": "white",
  "theme": "light",
  "component": "text"
}
```

## Implementation Details

The contrast qualifier type is implemented in:

- `src/factories/ContrastQualifierType.ts` - Core qualifier type class
- `src/factories/ContrastQualifierTypeFactory.ts` - Factory for creating instances
- `src/App.tsx` - Registration with ResourceOrchestrator

This demonstrates how to extend the ts-res system with custom validation logic while maintaining compatibility with the UI components and configuration system.