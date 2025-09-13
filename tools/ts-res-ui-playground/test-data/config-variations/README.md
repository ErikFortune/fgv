# Configuration Variations

This directory contains various system configuration files for testing the ts-res browser tool. Each configuration demonstrates different priority schemes and use cases.

## Available Configurations

### high-priority-language.json
- **Use Case**: Internationalization-focused applications
- **Priority**: Language (900) > Territory (600/500) > Role (400) > Platform (300)
- **Features**: Simplified role set, basic platform types

### territory-first.json
- **Use Case**: Region-specific applications
- **Priority**: Territory (950/900) > Language (700) > Role (600) > Environment (500)
- **Features**: Case-sensitive roles, territory context lists enabled, non-optional home territory token

### gaming-app.json
- **Use Case**: Gaming applications
- **Priority**: Platform (850) > Language (800) > Territory (750) > Graphics (700) > Player Level (600) > Game Mode (550)
- **Features**: Gaming-specific qualifiers (graphics quality, player level, game mode), platform-focused hierarchy

### minimal-basic.json
- **Use Case**: Simple applications with basic requirements
- **Priority**: Language (600) > Device (500)
- **Features**: Only two qualifiers, minimal complexity

### qualifier-default-values.json
- **Use Case**: Demonstrating qualifier default values functionality
- **Priority**: Language (600) > Territory (500) > Device (400) > Environment (300)
- **Features**: All qualifiers have default values configured (language with multiple values, territory single value, device with list, environment single value)
- **Demonstrates**: How default values are defined and used when qualifiers are not specified in context

### enterprise-complex.json
- **Use Case**: Large enterprise applications with complex permissions and multi-tenancy
- **Priority**: Tenant (1000) > Environment (950) > Security (900) > Territory (850/800) > Language (750) > Role (700) > Department (650) > Feature Flags (600)
- **Features**: Multi-tenant support, security levels, department-based access, feature flags, complex role hierarchies

### composition-terminology.json
- **Use Case**: Demonstrating resource composition with international terminology variations plus full application context
- **Priority**: Home Territory (850) > Language (800) > Territory (700) > Region (600) > Role (500) > Environment (400) > Platform (300) > Density (200)
- **Features**: Comprehensive terminology resources showing composition with partial candidates for regional variations, plus full application qualifiers for testing existing resources
- **Resources**: UI terms with base English/French/Dutch candidates and partial variants for Canadian English, British English, Canadian French, Belgian Dutch; App configuration with territory-specific settings; Feature flags with regional overrides; Plus supports existing sample project resources
- **Demonstrates**: How partial candidates compose with base candidates to create localized terminology sets while maintaining compatibility with existing test resources

## Usage

These configurations can be loaded into the Configuration Tool to test different system setups and see how they affect resource resolution behavior.

Each configuration includes:
- **name**: Human-readable name for the configuration
- **description**: Explanation of the use case and features
- **qualifierTypes**: Defines the available qualifier types with their configurations
- **qualifiers**: Defines the actual qualifiers with their priorities and tokens
- **resourceTypes**: Available resource types (currently just JSON)

## Testing Different Scenarios

Use these configurations to test:
1. **Priority Effects**: How different priority schemes affect resource resolution
2. **Context Lists**: Territory and role configurations with `allowContextList` enabled
3. **Case Sensitivity**: Role configurations with different case sensitivity settings
4. **Token Usage**: Various token configurations (optional vs required)
5. **Default Values**: Qualifier default values for fallback behavior (see qualifier-default-values.json)
6. **Complexity Scaling**: From minimal (2 qualifiers) to complex (9 qualifiers)