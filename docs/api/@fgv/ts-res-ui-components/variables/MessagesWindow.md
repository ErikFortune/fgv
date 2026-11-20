[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-res-ui-components](../README.md) / MessagesWindow

# Variable: MessagesWindow

> `const` **MessagesWindow**: `React.FC`\<[`IMessagesWindowProps`](../namespaces/ViewStateTools/interfaces/IMessagesWindowProps.md)\>

MessagesWindow component for displaying and managing application messages.

Provides a comprehensive interface for displaying, filtering, and managing
application messages with advanced features like search, filtering by type,
and copy functionality. Designed for use in development tools and debugging
interfaces where message visibility and management are critical.

**Key Features:**
- **Message filtering**: Filter messages by type (info, warning, error, success)
- **Search functionality**: Full-text search across message content
- **Copy functionality**: Copy all filtered messages to clipboard
- **Collapsible interface**: Minimize/maximize the message window
- **Message count display**: Shows filtered vs total message counts
- **Timestamp formatting**: Human-readable timestamp display
- **Visual indicators**: Color-coded message types with appropriate icons
- **Auto-hide when empty**: Component hides automatically when no messages exist

## Examples

```typescript
import { MessagesWindow, IMessage } from '@fgv/ts-res-ui-components';

function MyApplication() {
  const [messages, setMessages] = useState<IMessage[]>([]);

  const addMessage = (type: IMessage['type'], text: string) => {
    const newMessage: IMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      type,
      message: text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const clearMessages = () => {
    setMessages([]);
  };

  // Create component with button controls and messages window
  return React.createElement('div', {},
    React.createElement('div', { className: 'space-x-2 mb-4' },
      React.createElement('button',
        { onClick: () => addMessage('info', 'Processing started') },
        'Add Info'
      ),
      React.createElement('button',
        { onClick: () => addMessage('success', 'Operation completed') },
        'Add Success'
      )
    ),
    React.createElement(MessagesWindow, {
      messages,
      onClearMessages: clearMessages
    })
  );
}
```

```typescript
// Basic usage with observability context
import { ViewStateTools, ObservabilityProvider } from '@fgv/ts-res-ui-components';

function MyTool() {
  const { viewState } = ViewStateTools.useViewState();

  return (
    <div>
      <MyComponents />
      <MessagesWindow
        messages={viewState.messages}
        onClearMessages={viewState.clearMessages}
      />
    </div>
  );
}
```
