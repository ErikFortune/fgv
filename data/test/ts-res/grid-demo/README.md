# Grid Demo Test Data

This directory contains sample data designed specifically for testing the GridView and MultiGridView components in the `ts-res-ui-playground` tool.

## Resources

The resources are provided in a single collection file (`resources/grid-demo-collection.json`) to match the expectations of the grid configurations in `tools/ts-res-ui-playground/src/utils/gridConfigurations.ts`:

### app-config
Application configuration data including currency, date formats, measurement systems, and support contact information. Available for territories:
- **US** (USD, MM/DD/YYYY, imperial)
- **CA** (CAD, DD/MM/YYYY, metric)
- **GB** (GBP, DD/MM/YYYY, metric)
- **FR** (EUR, DD/MM/YYYY, metric)
- **DE** (EUR, DD.MM.YYYY, metric)

### common
Common UI strings used throughout applications:
- `welcome` - Welcome message
- `hello` - Greeting
- `goodbye` - Farewell
- `yes` - Affirmative response
- `no` - Negative response
- `cancel` - Cancel action
- `loading` - Loading indicator text

Available in multiple languages: en-US, en-GB, fr-FR, fr-CA, de-DE, nl-NL.

### errors
User-facing error messages:
- `validation_required` - Required field error
- `validation_email` - Invalid email format error
- `network_error` - Network connectivity error
- `server_error` - Server-side error
- `permission_denied` - Access denied error

Available in multiple languages: en-US, en-GB, fr-FR, fr-CA, de-DE, nl-NL.

### ui-terms
Region-specific UI terminology and spelling variations:
- `ShoppingCart` - Shopping cart/basket terminology
- `ZipCode` - Zip code/postal code terminology
- `Color` - Color/Colour spelling variations
- `Favorite` - Favorite/Favourite spelling variations
- `Email` - Email terminology
- Plus additional UI terms for login, settings, etc.

Available for territories: US, GB, CA, FR, DE.

## Configuration

The `grid-config.json` file defines:
- **Qualifier Types**: language, territory, region
- **Qualifiers**: Specific qualifier configurations with priorities
- **Resource Types**: JSON resource type definition

## Usage

To use this data with the grid playground:

1. Start the playground: `cd tools/ts-res-ui-playground && rushx dev`
2. Load this configuration in the grid tools
3. Test various grid configurations with the provided sample data

## Grid Configurations Supported

The playground now includes both **specific** and **flexible** grid configurations:

### Specific Configurations (for grid-demo-collection)
- **Application Configuration** (`app-config`) - Uses exact resource ID `grid-demo-collection.app-config`
- **Common UI Strings** (`common-strings`) - Uses exact resource ID `grid-demo-collection.common`  
- **UI Terminology** (`ui-terms`) - Uses exact resource ID `grid-demo-collection.ui-terms`
- **Error Messages** (`error-messages`) - Uses exact resource ID `grid-demo-collection.errors`

### Flexible Configurations (work with any data)
- **Application Configuration (Flexible)** (`app-config-flexible`) - Auto-detects resources ending with `app-config`
- **UI Strings (Flexible)** (`strings-flexible`) - Auto-detects resources ending with `common` or `strings`
- **UI Terminology (Flexible)** (`ui-terms-flexible`) - Auto-detects resources ending with `ui-terms` or `terms`
- **Error Messages (Flexible)** (`errors-flexible`) - Auto-detects resources ending with `errors` or `error-messages`

### Multi-Grid Workflows
- **Territory Setup**: Administrative workflows combining app-config and ui-terms
- **Demonstration Configs**: Cell type and validation showcases

### Key Features
- **Pattern-based Resource Selection**: Flexible configs use regex patterns to auto-detect resources
- **Multi-language Support**: EN, FR, DE, NL translations
- **Territory-specific Variations**: US, CA, GB, FR, DE localization  
- **Rich Cell Types**: Dropdowns, string inputs, validation, min/max lengths
- **Realistic Examples**: Proper localization and territory-specific variations

The flexible configurations make the grid tools more adaptable to different data sources and naming conventions.