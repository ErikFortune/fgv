# GridView Control Implementation Plan

## Overview
Create a GridView system that supports multiple grid instances with shared context, each displaying different resource subsets through configurable selectors, while leveraging existing ResolutionView state management.

## Core Architecture

### Key Design Principles
1. **Presentation Focus**: Leverage existing ResolutionState/Actions for all behavior
2. **Multi-Grid Support**: Multiple grid instances sharing common context and batch operations
3. **Extensible Resource Selection**: Simple built-in selectors with clear extension points
4. **Shared Context**: Admin workflow support (e.g., setting up new country across multiple grids)
5. **Advanced Cell Types**: Rich cell presentation with validation and specialized editors

### Component Structure
```
src/components/views/GridView/
├── MultiGridView.tsx         // Container with tabs/shared context
├── GridView.tsx             // Individual grid instance  
├── SharedContextControls.tsx // Context controls for all grids
├── GridSelector.tsx         // Tab/card selector component
├── ResourceGrid.tsx         // Grid table component
├── EditableGridCell.tsx     // Cell editing integration
├── cells/                   // Specialized cell types
│   ├── StringCell.tsx       // String input with validation
│   ├── BooleanCell.tsx      // Checkbox for boolean values
│   ├── TriStateCell.tsx     // Three-state checkbox or dropdown
│   ├── DropdownCell.tsx     // Dropdown/combobox for string properties
│   └── index.ts            // Cell type exports
└── utils/
    ├── ResourceSelector.ts   // Extensible selector system
    ├── cellValidation.ts     // Cell validation utilities
    └── gridConfiguration.ts  // Configuration helpers
```

## Advanced Cell Presentation System

### Cell Type Requirements
1. **String Cells**: 
   - Text input with configurable validation
   - Visual highlighting for invalid values
   - Support for regex patterns, length limits, required fields
   - Optional dropdown/combobox mode with predefined options

2. **Boolean Cells**:
   - Standard checkbox for true/false values
   - Clear visual state indication

3. **Tri-State Cells**:
   - Support for true/false/null or undefined states
   - Options: 3-state checkbox, dropdown with 3 options
   - Clear visual distinction between states

4. **Validation System**:
   - Cell-level validation with visual feedback
   - Grid-level validation aggregation
   - Prevent batch application when validation errors exist
   - Integration with existing Result pattern

### Enhanced Column Definition
```typescript
interface GridColumnDefinition {
  id: string;
  title: string;
  dataPath: string | string[];
  width?: number;
  sortable?: boolean;
  editable?: boolean;
  
  // Enhanced cell configuration
  cellType?: 'string' | 'boolean' | 'tristate' | 'dropdown' | 'custom';
  cellRenderer?: React.ComponentType<GridCellProps>;
  cellEditor?: React.ComponentType<GridCellEditorProps>;
  
  // Validation configuration
  validation?: {
    required?: boolean;
    pattern?: RegExp;
    minLength?: number;
    maxLength?: number;
    custom?: (value: JsonValue) => string | null; // Returns error message or null
  };
  
  // Dropdown/combobox options
  dropdownOptions?: Array<{ value: string; label: string }> | (() => Promise<Array<{ value: string; label: string }>>);
  allowCustomValue?: boolean; // For combobox behavior
}
```

### Validation Integration
```typescript
interface GridValidationState {
  cellErrors: Map<string, Map<string, string>>; // resourceId -> columnId -> error message
  hasErrors: boolean;
  errorCount: number;
}

interface GridCellValidationProps {
  value: JsonValue;
  column: GridColumnDefinition;
  resourceId: string;
  onValidationChange: (resourceId: string, columnId: string, error: string | null) => void;
}
```

## Resource Selector System

### Simple Built-in Selectors (90% of use cases)
```typescript
type GridResourceSelector = 
  | { type: 'ids'; resourceIds: string[] }
  | { type: 'prefix'; prefix: string }
  | { type: 'suffix'; suffix: string }  
  | { type: 'resourceTypes'; types: string[] }
  | { type: 'pattern'; pattern: string }
  | { type: 'all' }
  | { type: 'custom'; selector: CustomResourceSelector };
```

### Extensibility for Complex Cases
```typescript
interface CustomResourceSelector {
  id: string;
  select: (resources: ProcessedResources) => string[];
  displayName?: string;
}

// Registry system allows hosts to add new selector types
interface ResourceSelectorRegistry {
  registerSelector<TConfig>(type: string, handler: SelectorHandler): void;
  getRegisteredTypes(): string[];
}
```

## Multi-Grid Configuration

### Grid Configuration Interface
```typescript
interface GridViewInitParams {
  id: string;
  title: string;
  description?: string;
  resourceSelection: GridResourceSelector;
  columnMapping: ResourceTypeColumnMapping[];
  presentationOptions?: GridPresentationOptions;
}

interface MultiGridViewProps extends ViewBaseProps {
  gridConfigurations: GridViewInitParams[];
  // Shared across all grids:
  resources?: ProcessedResources | null;
  resolutionState?: ResolutionState;
  resolutionActions?: ResolutionActions;
  contextOptions?: ResolutionContextOptions;
  // Multi-grid options:
  tabsPresentation?: 'tabs' | 'cards' | 'accordion';
  defaultActiveGrid?: string;
}
```

## Implementation Benefits

### Admin Workflow Support
**Scenario: Setting up new country "Canada"**
1. Set shared context: `country=CA, language=en-CA`
2. **Languages Grid**: Configure Canadian English settings with validation
3. **Formats Grid**: Set Canadian date/number formats with dropdowns
4. **Payment Methods Grid**: Enable Canadian payment options with tri-state checkboxes
5. **Text Strings Grid**: Add French Canadian translations with string validation
6. **Single Apply**: All changes across grids applied atomically (only if all validation passes)

### Advanced Cell Examples
```typescript
// String cell with validation
{
  id: 'email',
  title: 'Email Address',
  dataPath: 'contact.email',
  cellType: 'string',
  editable: true,
  validation: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  }
}

// Dropdown cell with options
{
  id: 'status',
  title: 'Status',
  dataPath: 'status',
  cellType: 'dropdown',
  editable: true,
  dropdownOptions: [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'pending', label: 'Pending' }
  ]
}

// Tri-state for optional features
{
  id: 'feature_enabled',
  title: 'Feature Enabled',
  dataPath: 'features.advanced',
  cellType: 'tristate',
  editable: true
}
```

## Implementation Phases

### Phase 1: Core Grid Foundation ✅
1. GridView component with existing state integration ✅
2. Basic ResourceGrid with column mapping ✅
3. Simple resource selectors (ids, prefix, resourceTypes) ✅
4. Basic EditableGridCell with existing saveEdit integration (in progress)

### Phase 2: Advanced Cell Types
1. StringCell with validation and error highlighting
2. BooleanCell with checkbox presentation
3. TriStateCell with 3-state support
4. DropdownCell with options and combobox mode
5. Grid validation state management
6. Validation integration with batch apply prevention

### Phase 3: Multi-Grid Container
1. MultiGridView container component
2. SharedContextControls component
3. GridSelector (tabs/cards) component
4. Shared context state management

### Phase 4: UI Playground Integration
1. Add GridView to ui-playground tool
2. Create sample grid configurations
3. Demo multi-grid administrative workflows
4. Example column mappings for common resource types

### Phase 5: Advanced Features
1. Additional selector types (pattern, suffix)
2. Custom selector registry system
3. Advanced grid presentation options (pagination, filtering)
4. Performance optimizations for large datasets

## UI Playground Integration Plan

### Sample Configurations
```typescript
// Example grid configurations for playground
const playgroundGrids = [
  {
    id: 'user-messages',
    title: 'User Messages',
    resourceSelection: { type: 'prefix', prefix: 'user.' },
    columnMapping: [{
      resourceType: 'text-resource',
      columns: [
        {
          id: 'text',
          title: 'Message Text',
          dataPath: 'text',
          cellType: 'string',
          editable: true,
          validation: { required: true, maxLength: 200 }
        },
        {
          id: 'enabled',
          title: 'Enabled',
          dataPath: 'enabled',
          cellType: 'boolean',
          editable: true
        }
      ]
    }]
  }
];
```

This comprehensive plan ensures the GridView system provides powerful multi-resource editing capabilities with rich cell types, validation, and seamless integration with existing ts-res-ui-components patterns.