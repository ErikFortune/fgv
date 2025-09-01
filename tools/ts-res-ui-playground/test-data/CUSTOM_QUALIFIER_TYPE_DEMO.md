# Custom Qualifier Type Demo - Contrast Accessibility

This playground now includes a complete demonstration of custom qualifier types with the **Contrast Qualifier Type** for accessibility theming.

## 🎯 What's New

### Custom Qualifier Type Implementation
- **`ContrastQualifierType`** - Custom qualifier type with accessibility-focused matching logic
- **`ContrastQualifierTypeFactory`** - Factory for creating instances from JSON configuration
- **Hierarchical matching** - `high` matches `high`, `black`, or `white` for flexible theming

### Test Data & Configuration
- **Accessibility Theming Configuration** - Complete system configuration showcasing custom types
- **Theme Color Resources** - Button, background, and text colors that adapt to contrast requirements
- **Realistic Use Case** - Demonstrates accessibility compliance through resource selection

## 🚀 How to Test in the Playground

1. **Start the Playground**: The playground is already running at http://localhost:3001

2. **Load the Configuration**:
   - Go to the **Configuration** tab
   - Import: `test-data/config-variations/accessibility-theming.json`
   - Notice the **custom** qualifier type with orange styling ✨

3. **Edit the Custom Qualifier Type**:
   - Click **Edit** on the "contrast" qualifier type
   - Notice it shows the **JSON editor** instead of the structured form
   - Modify the configuration to see real-time validation

4. **Load Theme Resources**:
   - Go to the **Import** tab  
   - Load: `test-data/accessibility-theming/colors/button-colors.res.json`
   - Load: `test-data/accessibility-theming/colors/background-colors.res.json`
   - Load: `test-data/accessibility-theming/colors/text-colors.res.json`

5. **Test Resource Resolution**:
   - Go to the **Resolution** tab
   - Try these contexts to see the custom matching logic:
     ```
     contrast=standard, component=button
     contrast=high, component=button  
     contrast=black, component=button
     contrast=white, component=text
     ```

## 🎨 Key Features Demonstrated

### 1. **Custom Qualifier Type UI Support**
- Orange badges distinguish custom types from system types
- Generic JSON editor for custom type configuration
- Real-time JSON validation with error feedback
- Choice modal when adding new qualifier types

### 2. **Advanced Matching Logic** 
- **Exact matches**: `contrast=black` matches `contrast=black` (score: 1.0)
- **Hierarchical matches**: `contrast=high` matches `contrast=black` (score: 0.8)
- **Bidirectional**: `contrast=black` also matches `contrast=high` (score: 0.8)
- **Non-matches**: `contrast=standard` doesn't match `contrast=high` (score: 0)

### 3. **Real-world Application**
- **Standard contrast** provides normal color schemes
- **High contrast** activates accessibility-compliant colors
- **Black/White themes** offer specific high-contrast variants
- **Flexible matching** allows `high` to match any high-contrast variant

## 🔧 Implementation Details

### Files Created:
- `src/factories/ContrastQualifierType.ts` - Core qualifier type class
- `src/factories/ContrastQualifierTypeFactory.ts` - Configuration factory
- `test-data/config-variations/accessibility-theming.json` - System config
- `test-data/accessibility-theming/colors/*.res.json` - Theme resources

### Integration Points:
- `src/App.tsx` - Registers the factory with ResourceOrchestrator
- Extends existing ts-res-ui-components to support custom types
- Works seamlessly with configuration management and resource resolution

## 🎉 What This Demonstrates

1. **Complete Custom Type Workflow**: From definition to UI integration
2. **Advanced UI Components**: Generic editors with validation support  
3. **Real-world Use Case**: Accessibility theming with practical resources
4. **Extensibility**: How to extend ts-res without modifying core libraries
5. **Type Safety**: Validation methods ensure configuration integrity

The playground now showcases both **system qualifier types** (language, territory, literal) and **custom qualifier types** (contrast) working together seamlessly in the UI! 🚀