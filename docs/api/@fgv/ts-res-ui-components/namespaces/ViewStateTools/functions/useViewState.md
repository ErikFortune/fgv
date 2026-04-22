[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ViewStateTools](../README.md) / useViewState

# Function: useViewState()

> **useViewState**(): `IUseViewStateReturn`

Hook for managing view state including messages and resource selection.

This hook provides a centralized way to manage common view state concerns
like user messages (notifications) and resource selection. It's designed
to be used by view components that need to display messages and track
the currently selected resource.

## Returns

`IUseViewStateReturn`

Object containing view state and state management functions

## Example

```tsx
function MyResourceView() {
  const {
    messages,
    selectedResourceId,
    addIMessage,
    clearIMessages,
    selectResource
  } = useViewState();

  const handleOperation = async () => {
    try {
      await someAsyncOperation();
      addIMessage('success', 'Operation completed successfully');
    } catch (error) {
      addIMessage('error', `Operation failed: ${error.message}`);
    }
  };

  return (
    <div>
      <IMessageDisplay messages={messages} onClear={clearIMessages} />
      <ResourcePicker
        selectedResourceId={selectedResourceId}
        onResourceSelect={(selection) => selectResource(selection.resourceId)}
      />
    </div>
  );
}
```
