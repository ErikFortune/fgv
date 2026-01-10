/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import React, { createContext, useContext, useCallback, useMemo, useState, ReactNode } from 'react';
import { Logging, succeed } from '@fgv/ts-utils';
import type { Success, IResultReporter, MessageLogLevel } from '@fgv/ts-utils';

/**
 * Message types for the message pane
 * @public
 */
export type MessageType = 'success' | 'error' | 'warning' | 'info' | 'debug';

/**
 * A message displayed in the message pane
 * @public
 */
export interface IMessage {
  /** Unique message ID */
  id: string;
  /** Message type */
  type: MessageType;
  /** Message text */
  text: string;
  /** Timestamp */
  timestamp: Date;
  /** Optional source/category */
  source?: string;
}

/**
 * User logger interface that extends ILogger with success method for UI feedback.
 * @public
 */
export interface IUserLogger extends Logging.ILogger {
  /**
   * Logs a success message for user feedback.
   */
  success(message?: unknown, ...parameters: unknown[]): Success<string | undefined>;
}

/**
 * User log reporter interface that combines IUserLogger with IResultReporter.
 * @public
 */
export interface IUserLogReporter extends IUserLogger, IResultReporter<unknown> {}

/**
 * Observability context that provides both diagnostic and user logging capabilities.
 * @public
 */
export interface IObservabilityContext {
  /** Diagnostic logger for internal system diagnostics */
  readonly diag: Logging.LogReporter<unknown>;
  /** User logger for user-facing messages and feedback */
  readonly user: IUserLogReporter;
  /** All messages (for message pane) */
  readonly messages: readonly IMessage[];
  /** Clear all messages */
  clearMessages: () => void;
  /** Clear messages by type */
  clearMessagesByType: (type: MessageType) => void;
  /** Message counts by type */
  readonly messageCounts: Record<MessageType, number>;
}

/**
 * Function signature for adding messages to the pane
 * @internal
 */
type AddMessageFunction = (type: MessageType, message: string, source?: string) => void;

/**
 * Generate a unique message ID
 * @internal
 */
function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Map log level to message type
 * @internal
 */
function logLevelToMessageType(level: MessageLogLevel): MessageType {
  switch (level) {
    case 'error':
      return 'error';
    case 'warning':
      return 'warning';
    case 'info':
      return 'info';
    case 'detail':
    case 'quiet':
      return 'debug';
    default:
      return 'info';
  }
}

/**
 * Console-based user logger that logs to console and adds messages to the pane.
 * @public
 */
export class MessagePaneUserLogger extends Logging.LoggerBase implements IUserLogReporter {
  private _addMessage: AddMessageFunction;
  private _source: string;

  public constructor(
    logLevel: Logging.ReporterLogLevel,
    addMessage: AddMessageFunction,
    source: string = 'app'
  ) {
    super(logLevel);
    this._addMessage = addMessage;
    this._source = source;
  }

  protected _log(message: string, level: MessageLogLevel): Success<string | undefined> {
    // Log to console for diagnostics
    switch (level) {
      case 'error':
        console.error(`[${this._source}] ${message}`);
        break;
      case 'warning':
        console.warn(`[${this._source}] ${message}`);
        break;
      case 'info':
        console.info(`[${this._source}] ${message}`);
        break;
      default:
        console.log(`[${this._source}] ${message}`);
        break;
    }

    // Add to message pane
    const type = logLevelToMessageType(level);
    this._addMessage(type, message, this._source);

    return succeed(message);
  }

  public success(message?: unknown, ...parameters: unknown[]): Success<string | undefined> {
    const formatted = this._format(message, ...parameters);
    console.log(`[${this._source}] ${formatted}`);
    this._addMessage('success', formatted, this._source);
    return succeed(formatted);
  }

  public reportSuccess(__level: MessageLogLevel, __value: unknown, __detail?: unknown): void {
    // Could be enhanced to report success values
  }

  public reportFailure(level: MessageLogLevel, message: string, __detail?: unknown): void {
    this.log(level, `Operation failed: ${message}`);
  }
}

/**
 * Default observability context (for use outside provider)
 * @internal
 */
const defaultObservabilityContext: IObservabilityContext = {
  diag: new Logging.LogReporter({ logger: new Logging.ConsoleLogger('info') }),
  user: new MessagePaneUserLogger('info', () => {}),
  messages: [],
  clearMessages: () => {},
  clearMessagesByType: () => {},
  messageCounts: { success: 0, error: 0, warning: 0, info: 0, debug: 0 }
};

/**
 * React context for observability infrastructure
 * @public
 */
export const ObservabilityContext: React.Context<IObservabilityContext> =
  createContext<IObservabilityContext>(defaultObservabilityContext);

/**
 * Props for the ObservabilityProvider component
 * @public
 */
export interface IObservabilityProviderProps {
  /** Child components */
  children: ReactNode;
  /** Maximum number of messages to retain (default: 100) */
  maxMessages?: number;
  /** Log level for user messages (default: 'info') */
  userLogLevel?: Logging.ReporterLogLevel;
  /** Log level for diagnostic messages (default: 'info') */
  diagLogLevel?: Logging.ReporterLogLevel;
}

/**
 * Provider component that manages observability infrastructure
 * @public
 */
export function ObservabilityProvider({
  children,
  maxMessages = 100,
  userLogLevel = 'info',
  diagLogLevel = 'info'
}: IObservabilityProviderProps): React.ReactElement {
  const [messages, setMessages] = useState<IMessage[]>([]);

  // Add a message
  const addMessage = useCallback(
    (type: MessageType, text: string, source?: string) => {
      const newMessage: IMessage = {
        id: generateMessageId(),
        type,
        text,
        timestamp: new Date(),
        source
      };

      setMessages((prev) => {
        const updated = [...prev, newMessage];
        // Trim to max messages
        if (updated.length > maxMessages) {
          return updated.slice(-maxMessages);
        }
        return updated;
      });
    },
    [maxMessages]
  );

  // Clear all messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Clear messages by type
  const clearMessagesByType = useCallback((type: MessageType) => {
    setMessages((prev) => prev.filter((m) => m.type !== type));
  }, []);

  // Calculate message counts
  const messageCounts = useMemo((): Record<MessageType, number> => {
    const counts: Record<MessageType, number> = {
      success: 0,
      error: 0,
      warning: 0,
      info: 0,
      debug: 0
    };
    for (const msg of messages) {
      counts[msg.type]++;
    }
    return counts;
  }, [messages]);

  // Create loggers
  const diag = useMemo(
    () => new Logging.LogReporter({ logger: new Logging.ConsoleLogger(diagLogLevel) }),
    [diagLogLevel]
  );

  const user = useMemo(() => new MessagePaneUserLogger(userLogLevel, addMessage), [userLogLevel, addMessage]);

  const value = useMemo(
    (): IObservabilityContext => ({
      diag,
      user,
      messages,
      clearMessages,
      clearMessagesByType,
      messageCounts
    }),
    [diag, user, messages, clearMessages, clearMessagesByType, messageCounts]
  );

  return <ObservabilityContext.Provider value={value}>{children}</ObservabilityContext.Provider>;
}

/**
 * Hook to access observability context
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, diag } = useObservability();
 *
 *   const handleLoad = async () => {
 *     diag.info('Starting data load...');
 *     try {
 *       await loadData();
 *       user.success('Data loaded successfully!');
 *     } catch (error) {
 *       diag.error('Load failed:', error);
 *       user.error('Failed to load data. Please try again.');
 *     }
 *   };
 *
 *   return <button onClick={handleLoad}>Load Data</button>;
 * }
 * ```
 * @public
 */
export function useObservability(): IObservabilityContext {
  return useContext(ObservabilityContext);
}

/**
 * Hook to access just the messages (for the message pane)
 * @public
 */
export function useMessages(): {
  messages: readonly IMessage[];
  clearMessages: () => void;
  clearMessagesByType: (type: MessageType) => void;
  messageCounts: Record<MessageType, number>;
} {
  const { messages, clearMessages, clearMessagesByType, messageCounts } = useObservability();
  return { messages, clearMessages, clearMessagesByType, messageCounts };
}
