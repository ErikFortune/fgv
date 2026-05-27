/*
 * Copyright (c) 2026 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Message model types for the observability system.
 * @packageDocumentation
 */

import { type MessageLogLevel } from '@fgv/ts-utils';

// ============================================================================
// Message Severity
// ============================================================================

/**
 * Display styling levels for messages — drives color, icon, and toast behavior.
 *
 * This is the styling axis, orthogonal to the {@link @fgv/ts-utils#MessageLogLevel | log level}
 * filter axis on {@link IMessage.level}. `'success'` lives here (a UI affordance with no
 * log-level analog) and is only ever set explicitly — never derived from a logger bridge.
 * @public
 */
export type MessageSeverity = 'info' | 'success' | 'warning' | 'error';

/**
 * Derives a display {@link MessageSeverity} from a canonical
 * {@link @fgv/ts-utils#MessageLogLevel | log level}, used when a message carries no explicit
 * `severity` styling override. `'success'` is never derived — it is a UI-only affordance.
 * @param level - The canonical log level.
 * @returns The styling severity to use for display.
 * @public
 */
export function deriveSeverityFromLevel(level: MessageLogLevel): MessageSeverity {
  switch (level) {
    case 'warning':
      return 'warning';
    case 'error':
      return 'error';
    case 'quiet':
    case 'detail':
    case 'info':
      return 'info';
  }
}

// ============================================================================
// Message
// ============================================================================

/**
 * A single message in the observability stream.
 * @public
 */
export interface IMessage {
  /** Unique message ID */
  readonly id: string;
  /**
   * Canonical {@link @fgv/ts-utils#MessageLogLevel | log level} — drives FILTERING.
   * Set losslessly from a ts-utils logger when a message originates from the logger bridge.
   */
  readonly level: MessageLogLevel;
  /**
   * Display styling override (color / icon / toast). Optional; when absent, styling is
   * derived from {@link IMessage.level} via {@link deriveSeverityFromLevel}. `'success'`
   * lives here — set explicitly for UI-originated messages, never from a logger bridge.
   */
  readonly severity?: MessageSeverity;
  /** Message text */
  readonly text: string;
  /** Timestamp (ms since epoch) */
  readonly timestamp: number;
  /** Optional action (e.g., a link or callback) */
  readonly action?: IMessageAction;
}

/**
 * An actionable element attached to a message (e.g., "Go to Session" link).
 * @public
 */
export interface IMessageAction {
  /** Action label */
  readonly label: string;
  /** Callback when the action is triggered */
  readonly onAction: () => void;
}

// ============================================================================
// Toast Configuration
// ============================================================================

/**
 * Configuration for toast auto-dismiss behavior.
 * @public
 */
export interface IToastConfig {
  /** Auto-dismiss duration in ms. 0 = no auto-dismiss. */
  readonly autoDismissMs: number;
}

/**
 * Default toast configuration by severity.
 * @public
 */
export const DEFAULT_TOAST_CONFIG: Record<MessageSeverity, IToastConfig> = {
  info: { autoDismissMs: 3000 },
  success: { autoDismissMs: 3000 },
  warning: { autoDismissMs: 5000 },
  error: { autoDismissMs: 0 }
} as const;

// ============================================================================
// Helpers
// ============================================================================

let _nextId: number = 0;

/**
 * Generates a unique message ID.
 * @internal
 */
export function generateMessageId(): string {
  return `msg-${++_nextId}-${Date.now().toString(36)}`;
}

/**
 * Options for {@link createMessage} (and `addMessage`).
 * @public
 */
export interface ICreateMessageOptions {
  /**
   * Explicit display styling override. Omit to derive styling from the level via
   * {@link deriveSeverityFromLevel}. Set to `'success'` for UI-originated success messages.
   */
  readonly severity?: MessageSeverity;
  /** Optional action (e.g., a link or callback). */
  readonly action?: IMessageAction;
}

/**
 * Creates a new message at the given canonical {@link @fgv/ts-utils#MessageLogLevel | log level}.
 * The level drives filtering; pass `options.severity` only to override display styling
 * (e.g. `'success'`).
 * @param level - The canonical log level (filter axis).
 * @param text - The message text.
 * @param options - Optional styling severity and action.
 * @returns The created message.
 * @public
 */
export function createMessage(
  level: MessageLogLevel,
  text: string,
  options?: ICreateMessageOptions
): IMessage {
  return {
    id: generateMessageId(),
    level,
    severity: options?.severity,
    text,
    timestamp: Date.now(),
    action: options?.action
  };
}
