[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ConfigurationTools](../README.md) / QualifierEditForm

# Variable: QualifierEditForm

> `const` **QualifierEditForm**: `React.FC`\<`IQualifierEditFormProps`\>

Modal form component for creating and editing qualifiers in a ts-res system configuration.

The QualifierEditForm provides a comprehensive interface for defining qualifiers that control
resource resolution behavior. It includes validation, type-specific configuration options,
and automatic token generation for streamlined qualifier creation.

## Examples

```tsx
import { ConfigurationTools } from '@fgv/ts-res-ui-components';

// Creating a new language qualifier
const qualifierTypes = [
  { name: 'language', systemType: 'language' },
  { name: 'region', systemType: 'territory' }
];

const [showForm, setShowForm] = useState(false);
const [qualifiers, setQualifiers] = useState([]);

const handleSave = (qualifier) => {
  setQualifiers(prev => [...prev, qualifier]);
  setShowForm(false);
};

{showForm && (
  <ConfigurationTools.QualifierEditForm
    qualifierTypes={qualifierTypes}
    onSave={handleSave}
    onCancel={() => setShowForm(false)}
    existingNames={qualifiers.map(q => q.name)}
  />
)}
```

```tsx
// Editing an existing qualifier with validation
const existingQualifier = {
  name: 'language',
  typeName: 'language',
  defaultPriority: 100,
  token: 'lang',
  tokenIsOptional: false,
  defaultValue: 'en-US'
};

<ConfigurationTools.QualifierEditForm
  qualifier={existingQualifier}
  qualifierTypes={availableTypes}
  onSave={updateQualifier}
  onCancel={closeEditor}
  existingNames={otherQualifierNames}
/>
```

```tsx
// Advanced qualifier configuration with enum values
const platformType = {
  name: 'platform',
  systemType: 'literal',
  configuration: {
    caseSensitive: false,
    enumeratedValues: ['web', 'mobile', 'desktop'],
    allowContextList: true
  }
};

const platformQualifier = {
  name: 'platform',
  typeName: 'platform',
  defaultPriority: 80,
  token: 'plat',
  defaultValue: 'web,mobile' // Multiple values supported
};

<ConfigurationTools.QualifierEditForm
  qualifier={platformQualifier}
  qualifierTypes={[platformType]}
  onSave={handlePlatformSave}
  onCancel={cancelEdit}
/>
```
