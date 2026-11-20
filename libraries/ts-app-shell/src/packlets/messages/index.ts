/**
 * Messages packlet - observability context, toast system, and log panel.
 * @packageDocumentation
 */

export {
  type MessageSeverity,
  type IMessage,
  type IMessageAction,
  type IMessageHrefAction,
  type IMessageCallbackAction,
  type ICreateMessageOptions,
  type IToastConfig,
  DEFAULT_TOAST_CONFIG,
  deriveSeverityFromLevel,
  createMessage,
  generateMessageId
} from './model';

export {
  type IMessagesContextValue,
  type IMessagesProviderProps,
  MessagesProvider,
  TAILWIND_PROBE_CLASS,
  TAILWIND_PROBE_HEIGHT_PX,
  TAILWIND_PROBE_MESSAGE_TEXT,
  TAILWIND_SETUP_DOCS_URL,
  useMessages
} from './MessagesContext';

export { ToastItem, ToastContainer, type IToastItemProps, type IToastContainerProps } from './Toast';

export { StatusBar, type IStatusBarProps } from './StatusBar';

export { MessagesLogger } from './MessagesLogger';

export { useLogReporter, type IUseLogReporterOptions } from './useLogReporter';
