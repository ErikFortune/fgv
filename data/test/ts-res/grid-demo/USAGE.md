# Using Grid Demo Data with ts-res-ui-playground

This guide explains how to load and use the grid demo data with the GridView and MultiGridView components.

## Quick Start

1. **Start the playground:**
   ```bash
   cd tools/ts-res-ui-playground
   rushx dev
   ```

2. **Load the grid demo configuration:**
   - Go to the "Import Resources" tab
   - Click "Import File" and select: `data/test/ts-res/grid-demo/grid-config.json` (configuration)
   - Click "Import File" and select: `data/test/ts-res/grid-demo/resources/grid-demo-collection.json` (resources)

3. **Navigate to Grid Views:**
   - Select "Grid View" or "Multi-Grid View" from the sidebar
   - The demo configurations should now work with the loaded data

## Alternative Loading Methods

### Option 1: Import via Resource Bundle
If you have compiled the resources into a bundle:
```bash
cd data/test/ts-res/grid-demo
ts-res-cli compile --config grid-config.json --output grid-demo.bundle.json resources/
```

Then import the bundle file in the playground.

## Available Demo Configurations

### Single Grid Configurations (`sampleGridConfigurations`)

1. **Application Configuration** (`app-config`)
   - Demonstrates dropdown controls for currency, date format, time format, measurement system
   - String inputs with validation for support email and phone
   - Territory-specific variations (US, CA, GB, FR, DE)

2. **Common UI Strings** (`common-strings`) 
   - Basic string inputs with length validation
   - Multi-language support (EN, FR, DE, NL)
   - Common UI elements like welcome, hello, goodbye, yes, no, cancel, loading

3. **UI Terminology** (`ui-terms`)
   - Region-specific terminology variations
   - Shows difference between US/UK/CA terminology (color/colour, shopping cart/basket, etc.)
   - Territory-specific localization

4. **Error Messages** (`error-messages`)
   - User-facing error messages with validation requirements
   - Multi-language support
   - Demonstrates validation for required fields, email format, network errors, etc.

### Multi-Grid Configurations (`multiGridConfigurations`)

1. **Territory Setup Workflow**
   - Combines app-config and ui-terms in a multi-grid administrative interface
   - Demonstrates related data editing across multiple grids simultaneously

## Data Structure

### Resources Available:
- **app-config**: Application configuration with territory-specific variations
- **common**: Common UI strings with language variations  
- **errors**: Error messages with language variations
- **ui-terms**: UI terminology with territory variations

### Qualifiers Available:
- **language**: BCP47 language tags (en-US, en-GB, fr-FR, fr-CA, de-DE, nl-NL)
- **territory**: Territory codes (US, CA, GB, FR, DE)
- **region**: Regional groupings (north-america, europe, etc.)

## Testing Different Contexts

Use the playground's context controls to test different scenarios:
- Set language to "fr-FR" to see French translations
- Set territory to "GB" to see UK-specific terminology
- Combine language and territory to see locale-specific data

## Customization

You can modify the data files to test different scenarios:
- Edit column configurations in `gridConfigurations.ts`
- Add new territories or languages to the resource files
- Modify validation rules to test different input scenarios

## Troubleshooting

If the grid configurations don't appear:
1. Ensure all resource files are loaded (common.json, errors.json, app-config.json, ui-terms.json)
2. Check that the configuration file (grid-config.json) was loaded successfully
3. Verify that the resource IDs in gridConfigurations.ts match the resource names in the JSON files
4. Check the browser console for any loading errors