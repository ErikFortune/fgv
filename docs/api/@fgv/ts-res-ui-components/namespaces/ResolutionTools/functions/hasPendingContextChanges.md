[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ResolutionTools](../README.md) / hasPendingContextChanges

# Function: hasPendingContextChanges()

> **hasPendingContextChanges**(`contextValues`, `pendingContextValues`): `boolean`

Check if context has any pending changes by comparing current and pending values.

Performs a deep comparison between current context values and pending context values
to determine if there are unsaved changes. This is useful for UI state management
and preventing data loss in resolution interfaces.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `contextValues` | `Record`\<`string`, `string` \| `undefined`\> | The current/saved context values |
| `pendingContextValues` | `Record`\<`string`, `string` \| `undefined`\> | The pending/unsaved context values |

## Returns

`boolean`

True if there are pending changes, false if contexts are identical

## Examples

```typescript
import { ResolutionTools } from '@fgv/ts-res-ui-components';

// Check for unsaved context changes in resolution UI
const ResolutionInterface = () => {
  const [savedContext, setSavedContext] = useState({
    language: 'en-US',
    platform: 'web'
  });

  const [pendingContext, setPendingContext] = useState(savedContext);

  const hasChanges = ResolutionTools.hasPendingContextChanges(
    savedContext,
    pendingContext
  );

  const handleApplyChanges = () => {
    if (hasChanges) {
      setSavedContext(pendingContext);
      // Trigger re-resolution with new context...
    }
  };

  return (
    <div>
      {hasChanges && (
        <div className="warning">
          You have unsaved context changes.
          <button onClick={handleApplyChanges}>Apply Changes</button>
        </div>
      )}
    </div>
  );
};
```

```typescript
// Prevent navigation with unsaved changes
function useUnsavedChangesWarning(
  currentContext: Record<string, string | undefined>,
  pendingContext: Record<string, string | undefined>
) {
  const hasChanges = ResolutionTools.hasPendingContextChanges(
    currentContext,
    pendingContext
  );

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasChanges) {
        event.preventDefault();
        event.returnValue = 'You have unsaved context changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  return hasChanges;
}
```

```typescript
// Context change management in resolution workflow
class ResolutionContextManager {
  private savedContext: Record<string, string | undefined> = {};
  private pendingContext: Record<string, string | undefined> = {};

  updatePendingValue(qualifier: string, value: string | undefined) {
    this.pendingContext = { ...this.pendingContext, [qualifier]: value };
  }

  hasPendingChanges(): boolean {
    return ResolutionTools.hasPendingContextChanges(
      this.savedContext,
      this.pendingContext
    );
  }

  applyChanges(): boolean {
    if (this.hasPendingChanges()) {
      this.savedContext = { ...this.pendingContext };
      return true; // Changes were applied
    }
    return false; // No changes to apply
  }

  discardChanges(): boolean {
    if (this.hasPendingChanges()) {
      this.pendingContext = { ...this.savedContext };
      return true; // Changes were discarded
    }
    return false; // No changes to discard
  }
}
```
