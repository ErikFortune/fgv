[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ConfigurationTools](../README.md) / HierarchyEditor

# Variable: HierarchyEditor

> `const` **HierarchyEditor**: `React.FC`\<`IHierarchyEditorProps`\>

Interactive editor for defining hierarchical relationships between qualifier values.

The HierarchyEditor allows users to define parent-child relationships between qualifier values,
enabling hierarchical resolution in the ts-res system. It provides an intuitive interface for
creating, viewing, and managing value hierarchies with visual tree representation.

## Examples

```tsx
import { ConfigurationTools } from '@fgv/ts-res-ui-components';

// Basic hierarchy editing for region qualifiers
const [regionHierarchy, setRegionHierarchy] = useState({
  'quebec': 'canada',
  'ontario': 'canada',
  'california': 'usa',
  'texas': 'usa'
});

<ConfigurationTools.HierarchyEditor
  hierarchy={regionHierarchy}
  onChange={setRegionHierarchy}
  availableValues={['quebec', 'ontario', 'california', 'texas']}
/>
```

```tsx
// Hierarchy editing for language qualifiers with dynamic values
const [languageHierarchy, setLanguageHierarchy] = useState({
  'en-CA': 'en',
  'en-US': 'en',
  'fr-CA': 'fr',
  'fr-FR': 'fr'
});

<ConfigurationTools.HierarchyEditor
  hierarchy={languageHierarchy}
  onChange={setLanguageHierarchy}
  availableValues={[]} // Allow free-form input
  className="my-hierarchy-editor"
/>
```

```tsx
// Integration with qualifier type configuration
const QualifierTypeEditor = ({ qualifierType, onSave }) => {
  const [hierarchy, setHierarchy] = useState(qualifierType.hierarchy || {});

  const handleSave = () => {
    onSave({
      ...qualifierType,
      hierarchy: Object.keys(hierarchy).length > 0 ? hierarchy : undefined
    });
  };

  return (
    <div>
      <ConfigurationTools.HierarchyEditor
        hierarchy={hierarchy}
        onChange={setHierarchy}
        availableValues={qualifierType.enumeratedValues || []}
      />
      <button onClick={handleSave}>Save Qualifier Type</button>
    </div>
  );
};
```
