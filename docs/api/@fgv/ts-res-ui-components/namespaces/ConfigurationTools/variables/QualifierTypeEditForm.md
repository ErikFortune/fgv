[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ConfigurationTools](../README.md) / QualifierTypeEditForm

# Variable: QualifierTypeEditForm

> `const` **QualifierTypeEditForm**: `React.FC`\<`IQualifierTypeEditFormProps`\>

Modal form component for creating and editing qualifier types in a ts-res system configuration.

The QualifierTypeEditForm provides a comprehensive interface for defining qualifier types that
control the behavior and validation of qualifiers. It supports all three system types (language,
territory, literal) with type-specific configuration options, enumerated values, and hierarchical
relationships between values.

## Examples

```tsx
import { ConfigurationTools } from '@fgv/ts-res-ui-components';

// Creating a new literal qualifier type with enumerated values
const [showForm, setShowForm] = useState(false);
const [qualifierTypes, setQualifierTypes] = useState([]);

const handleSave = (qualifierType) => {
  setQualifierTypes(prev => [...prev, qualifierType]);
  setShowForm(false);
};

{showForm && (
  <ConfigurationTools.QualifierTypeEditForm
    onSave={handleSave}
    onCancel={() => setShowForm(false)}
    existingNames={qualifierTypes.map(qt => qt.name)}
  />
)}
```

```tsx
// Editing a platform qualifier type with hierarchy
const platformType = {
  name: 'platform',
  systemType: 'literal',
  configuration: {
    allowContextList: true,
    caseSensitive: false,
    enumeratedValues: ['web', 'mobile', 'desktop', 'smart-tv'],
    hierarchy: {
      'smart-tv': 'web',  // smart-tv inherits from web
      'tablet': 'mobile'  // tablet inherits from mobile
    }
  }
};

<ConfigurationTools.QualifierTypeEditForm
  qualifierType={platformType}
  onSave={updatePlatformType}
  onCancel={closeEditor}
  existingNames={otherTypeNames}
/>
```

```tsx
// Territory qualifier type with restricted territories
const regionType = {
  name: 'region',
  systemType: 'territory',
  configuration: {
    allowContextList: false,
    acceptLowercase: true,
    allowedTerritories: ['US', 'CA', 'GB', 'AU'],
    hierarchy: {
      'US': 'AMERICAS',
      'CA': 'AMERICAS',
      'GB': 'EUROPE',
      'AU': 'APAC'
    }
  }
};

<ConfigurationTools.QualifierTypeEditForm
  qualifierType={regionType}
  onSave={saveRegionType}
  onCancel={cancelEdit}
/>
```

```tsx
// Simple language qualifier type
const languageType = {
  name: 'locale',
  systemType: 'language',
  configuration: {
    allowContextList: true // Allow multiple languages like 'en-US,en'
  }
};

<ConfigurationTools.QualifierTypeEditForm
  qualifierType={languageType}
  onSave={handleLanguageTypeSave}
  onCancel={handleCancel}
  existingNames={existingTypeNames}
/>
```
