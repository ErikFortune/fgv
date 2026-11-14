[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ConfigurationTools](../README.md) / ResourceTypeEditForm

# Variable: ResourceTypeEditForm

> `const` **ResourceTypeEditForm**: `React.FC`\<`IResourceTypeEditFormProps`\>

Modal form component for creating and editing resource types in a ts-res system configuration.

The ResourceTypeEditForm provides an interface for defining resource types that categorize
resources and determine their data handling behavior. It supports both common predefined
types and custom types for specialized use cases, with automatic type suggestion based
on resource type names.

## Examples

```tsx
import { ConfigurationTools } from '@fgv/ts-res-ui-components';

// Creating a new resource type with common type
const [showForm, setShowForm] = useState(false);
const [resourceTypes, setResourceTypes] = useState([]);

const handleSave = (resourceType) => {
  setResourceTypes(prev => [...prev, resourceType]);
  setShowForm(false);
};

{showForm && (
  <ConfigurationTools.ResourceTypeEditForm
    onSave={handleSave}
    onCancel={() => setShowForm(false)}
    existingNames={resourceTypes.map(rt => rt.name)}
  />
)}
```

```tsx
// Editing an existing resource type
const userSettingsType = {
  name: 'userSettings',
  typeName: 'object'  // Built-in object type for structured data
};

<ConfigurationTools.ResourceTypeEditForm
  resourceType={userSettingsType}
  onSave={updateResourceType}
  onCancel={closeEditor}
  existingNames={otherTypeNames}
/>
```

```tsx
// Creating resource types for different content categories
const contentTypes = [
  { name: 'errorMessages', typeName: 'string' },
  { name: 'uiLabels', typeName: 'localizedString' },
  { name: 'navigationMenus', typeName: 'object' },
  { name: 'permissionLists', typeName: 'array' },
  { name: 'appConfig', typeName: 'config' },
  { name: 'customValidator', typeName: 'customValidation' } // Custom type
];

const CreateResourceTypesForm = () => {
  const [currentType, setCurrentType] = useState(null);

  return (
    <div>
      {currentType && (
        <ConfigurationTools.ResourceTypeEditForm
          resourceType={currentType}
          onSave={handleSaveType}
          onCancel={() => setCurrentType(null)}
          existingNames={existingNames}
        />
      )}
    </div>
  );
};
```

```tsx
// Custom resource type for specialized processing
const templateType = {
  name: 'emailTemplates',
  typeName: 'htmlTemplate'  // Custom type name for specialized handling
};

<ConfigurationTools.ResourceTypeEditForm
  resourceType={templateType}
  onSave={(updatedType) => {
    // Handle custom type processing
    o11y.user.success(`${updatedType.name}: Custom type '${updatedType.typeName}' saved successfully`);
    saveToConfiguration(updatedType);
  }}
  onCancel={cancelEdit}
/>
```
