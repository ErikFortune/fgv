# ts-res Test Data

This directory contains test data examples for the ts-res library, demonstrating different predefined configurations and resource resolution patterns.

## Examples

### [default/](./default/)
Uses the **default** predefined configuration which demonstrates **territory-priority** resolution:
- Territory priority: 850
- Language priority: 800
- Simple two-qualifier system ideal for learning
- Shows how territory takes precedence over language

### [extended-example/](./extended-example/)  
Uses the **extended-example** predefined configuration for complex multi-dimensional scenarios:
- Seven different qualifiers with hierarchical priorities
- Market hierarchy with geographic regions
- Role-based access control
- Environment-specific configurations
- Case-sensitive currency handling

### [custom-config/](./custom-config/)
Contains a custom configuration with additional qualifiers not in the predefined set:
- Custom priority arrangements
- Additional qualifiers like density and region
- Demonstrates flexibility beyond predefined configurations

## Configuration Comparison

| Configuration | Qualifiers | Primary Use Case | Complexity |
|---------------|------------|------------------|------------|
| **default** | 2 (territory, language) | Learning, simple apps | Low |
| **language-priority** | 2 (language, territory) | Language-first apps | Low |
| **territory-priority** | 2 (territory, language) | Region-first apps | Low |
| **extended-example** | 7 (territory, language, market, role, env, currency) | Enterprise applications | High |
| **custom-config** | 8 (custom qualifiers) | Specialized needs | Medium |

## Testing Priority Behaviors

To understand how different priorities affect resource resolution:

1. **Load the same resources** with different configurations
2. **Use identical contexts** (e.g., `{language: "fr", territory: "CA"}`)  
3. **Compare results** to see which qualifier takes precedence

### Example Context for Testing
```json
{
  "language": "fr",
  "currentTerritory": "CA"
}
```

- **default** (territory-priority): Will prefer territory-specific resources
- **language-priority**: Will prefer language-specific resources

## Browser Integration

These examples are designed to work with the ts-res-browser tool:

1. Navigate to the **Configuration** tab
2. Use **Load Predefined** dropdown to select a configuration
3. Click **Apply Configuration**
4. Navigate to **Import** tab and load one of these example directories
5. Use **Filter** tab to test different context combinations
6. Observe how different contexts resolve to different resources

## Usage Tips

- Start with the **default** example to understand basic concepts
- Use **extended-example** to explore complex enterprise scenarios
- Compare **default** vs **language-priority** to understand priority differences
- **custom-config** shows how to create specialized configurations beyond predefined options