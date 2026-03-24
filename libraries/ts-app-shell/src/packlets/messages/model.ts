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

// ============================================================================
// Message Severity
// ============================================================================

/**
 * Severity levels for messages.
 * @public
 */
export type MessageSeverity = 'info' | 'success' | 'warning' | 'error';

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
  /** Message severity */
  readonly severity: MessageSeverity;
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
 * Creates a new message.
 * @public
 */
export function createMessage(severity: MessageSeverity, text: string, action?: IMessageAction): IMessage {
  return {
    id: generateMessageId(),
    severity,
    text,
    timestamp: Date.now(),
    action
  };
}
