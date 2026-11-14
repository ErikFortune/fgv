[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-res-ui-components](../README.md) / ConfigurationView

# Variable: ConfigurationView

> `const` **ConfigurationView**: `React.FC`\<[`IConfigurationViewProps`](../namespaces/ConfigurationTools/interfaces/IConfigurationViewProps.md)\>

ConfigurationView component for managing ts-res system configurations.

Provides a comprehensive interface for creating, editing, and managing ts-res
system configurations including qualifier types, qualifiers, and resource types.
Supports import/export functionality and real-time validation.

**Key Features:**
- **Configuration editing**: Create and modify system configurations
- **Qualifier type management**: Add, edit, and remove qualifier types (language, territory, etc.)
- **Qualifier management**: Configure specific qualifiers with default values
- **Resource type management**: Define and manage resource types
- **Import/export**: Load configurations from files or export current settings
- **Real-time validation**: Validate configuration changes as you type
- **Change tracking**: Track unsaved changes with visual indicators

## Example

```tsx
import { ConfigurationView } from '@fgv/ts-res-ui-components';

function MyConfigurationEditor() {
  const [config, setConfig] = useState(defaultConfiguration);
  const [hasChanges, setHasChanges] = useState(false);

  const handleSave = () => {
    console.log('Saving configuration...', config);
    setHasChanges(false);
  };

  return (
    <ConfigurationView
      configuration={config}
      onConfigurationChange={(newConfig) => {
        setConfig(newConfig);
        setHasChanges(true);
      }}
      onSave={handleSave}
      hasUnsavedChanges={hasChanges}
    />
  );
}
```
