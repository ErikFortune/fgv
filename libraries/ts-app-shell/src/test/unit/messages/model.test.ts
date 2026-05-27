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

import { type MessageLogLevel } from '@fgv/ts-utils';

import {
  createMessage,
  DEFAULT_TOAST_CONFIG,
  deriveSeverityFromLevel,
  generateMessageId,
  type MessageSeverity
} from '../../../packlets/messages';

describe('messages/model', () => {
  describe('deriveSeverityFromLevel', () => {
    test.each<[MessageLogLevel, MessageSeverity]>([
      ['quiet', 'info'],
      ['detail', 'info'],
      ['info', 'info'],
      ['warning', 'warning'],
      ['error', 'error']
    ])('maps log level %s to severity %s', (level, expected) => {
      expect(deriveSeverityFromLevel(level)).toBe(expected);
    });

    test('never derives the success severity (UI-only affordance)', () => {
      const levels: MessageLogLevel[] = ['quiet', 'detail', 'info', 'warning', 'error'];
      for (const level of levels) {
        expect(deriveSeverityFromLevel(level)).not.toBe('success');
      }
    });
  });

  describe('createMessage', () => {
    test('sets the level (filter axis) and leaves severity undefined when no override is given', () => {
      const msg = createMessage('warning', 'disk almost full');
      expect(msg.level).toBe('warning');
      expect(msg.severity).toBeUndefined();
      expect(msg.text).toBe('disk almost full');
      expect(typeof msg.id).toBe('string');
      expect(typeof msg.timestamp).toBe('number');
      expect(msg.action).toBeUndefined();
    });

    test('applies an explicit severity styling override (e.g. success)', () => {
      const msg = createMessage('info', 'saved!', { severity: 'success' });
      expect(msg.level).toBe('info');
      expect(msg.severity).toBe('success');
    });

    test('attaches an optional action', () => {
      const onAction = jest.fn();
      const msg = createMessage('error', 'failed', { action: { label: 'Retry', onAction } });
      expect(msg.action?.label).toBe('Retry');
      msg.action?.onAction();
      expect(onAction).toHaveBeenCalledTimes(1);
    });

    test('generates unique ids across messages', () => {
      const a = createMessage('info', 'a');
      const b = createMessage('info', 'b');
      expect(a.id).not.toBe(b.id);
    });
  });

  describe('generateMessageId', () => {
    test('returns a msg-prefixed unique id each call', () => {
      const first = generateMessageId();
      const second = generateMessageId();
      expect(first).toMatch(/^msg-\d+-/);
      expect(first).not.toBe(second);
    });
  });

  describe('DEFAULT_TOAST_CONFIG', () => {
    test('is keyed by the styling severity axis', () => {
      expect(DEFAULT_TOAST_CONFIG.info.autoDismissMs).toBe(3000);
      expect(DEFAULT_TOAST_CONFIG.success.autoDismissMs).toBe(3000);
      expect(DEFAULT_TOAST_CONFIG.warning.autoDismissMs).toBe(5000);
      expect(DEFAULT_TOAST_CONFIG.error.autoDismissMs).toBe(0);
    });
  });
});
