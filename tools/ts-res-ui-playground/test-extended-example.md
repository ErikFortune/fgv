# Testing ts-res-ui-playground with Extended Example

## Test Scenario
Testing with data from `/data/test/ts-res/extended-example/`

## Steps to Test:

1. **Start the playground:**
   ```bash
   cd tools/ts-res-ui-playground
   rushx dev
   ```

2. **Load the configuration:**
   - Click on "Configuration" tab
   - Click "Load Configuration"
   - Navigate to `/data/test/ts-res/extended-example/configuration.json`
   - Load the file

3. **Import resources:**
   - Click on "Import" tab
   - Select "Import Directory"
   - Navigate to `/data/test/ts-res/extended-example/resources/`
   - Import the directory

4. **Browse resources:**
   - Click on "Source Browser" tab
   - Resources should be visible and browsable

## What to Look For in Console:

### Success Indicators:
- `[PLAYGROUND] Initializing ts-res-ui-playground with observable factory chain`
- `[CONFIG] Processing system configuration`
- `[QUALIFIER_TYPES] Starting creation of qualifier types`
- `✅ Created "language" (language)`
- `✅ Created "territory" (territory)`
- `✅ Created "role" (literal)`
- `✅ Created "environment" (literal)`
- `✅ Created "currency" (literal)`
- `✅ Created "market" (literal)`

### Failure Indicators (FIXED):
- `❌ ContrastQualifierTypeFactory can only create 'contrast' types`
- `No factory in chain could create qualifier type`
- `Failed to create qualifier type`

## Configuration Details:

The extended-example configuration contains:
- **language** (systemType: "language") - Built-in type
- **territory** (systemType: "territory") - Built-in type  
- **role** (systemType: "literal") - Built-in type
- **environment** (systemType: "literal") - Built-in type
- **currency** (systemType: "literal") - Built-in type
- **market** (systemType: "literal") - Built-in type with hierarchy

## The Fix:

The solution uses an `ObservableContrastQualifierTypeFactory` that:
1. Handles "contrast" types with detailed logging
2. Lets the ts-res system automatically chain built-in factories for standard types
3. Provides comprehensive observability into factory resolution

### Key Changes:
- **Observable Factory**: Enhanced logging shows exactly which types are being processed
- **Automatic Chaining**: Built-in factories are automatically appended by ts-res (no manual chaining needed!)
- **Comprehensive Logging**: See factory attempts, successes, failures, and fallbacks
- **User-Friendly Errors**: Clear error messages for configuration issues

This ensures both custom "contrast" types and standard qualifier types work properly!