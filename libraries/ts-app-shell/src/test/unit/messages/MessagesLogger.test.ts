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

import '@fgv/ts-utils-jest';
import { type MessageLogLevel } from '@fgv/ts-utils';

import {
  createMessage,
  type ICreateMessageOptions,
  type IMessage,
  type IMessagesContextValue,
  MessagesLogger
} from '../../../packlets/messages';

interface IRecordedCall {
  readonly level: MessageLogLevel;
  readonly text: string;
  readonly options?: ICreateMessageOptions;
}

/**
 * Builds a recording `addMessage` stub matching the MessagesContext signature, plus the
 * array it records into.
 */
function makeRecorder(): {
  addMessage: IMessagesContextValue['addMessage'];
  calls: IRecordedCall[];
} {
  const calls: IRecordedCall[] = [];
  const addMessage = (level: MessageLogLevel, text: string, options?: ICreateMessageOptions): IMessage => {
    calls.push({ level, text, options });
    return createMessage(level, text, options);
  };
  return { addMessage, calls };
}

describe('MessagesLogger', () => {
  test('routes the log level straight through (lossless) with severity left undefined', () => {
    const { addMessage, calls } = makeRecorder();
    const logger = new MessagesLogger(addMessage, 'all');

    const levels: MessageLogLevel[] = ['quiet', 'detail', 'info', 'warning', 'error'];
    for (const level of levels) {
      logger.log(level, `at ${level}`);
    }

    expect(calls.map((c) => c.level)).toEqual(levels);
    for (const call of calls) {
      expect(call.options?.severity).toBeUndefined();
    }
  });

  test('lossless bridge preserves quiet under the all threshold', () => {
    const { addMessage, calls } = makeRecorder();
    const logger = new MessagesLogger(addMessage, 'all');

    expect(logger.log('quiet', 'whisper')).toSucceedWith('whisper');
    expect(calls).toHaveLength(1);
    expect(calls[0].level).toBe('quiet');
  });

  test('default info threshold suppresses detail and quiet before they reach the bridge', () => {
    const { addMessage, calls } = makeRecorder();
    const logger = new MessagesLogger(addMessage);

    expect(logger.detail('verbose')).toSucceedWith(undefined);
    expect(logger.log('quiet', 'whisper')).toSucceedWith(undefined);
    expect(logger.info('shown')).toSucceedWith('shown');

    expect(calls.map((c) => c.level)).toEqual(['info']);
  });

  test('detail threshold lets detail messages through losslessly', () => {
    const { addMessage, calls } = makeRecorder();
    const logger = new MessagesLogger(addMessage, 'detail');

    expect(logger.detail('verbose')).toSucceedWith('verbose');
    expect(calls).toHaveLength(1);
    expect(calls[0].level).toBe('detail');
  });

  test('convenience methods map to their canonical levels', () => {
    const { addMessage, calls } = makeRecorder();
    const logger = new MessagesLogger(addMessage, 'all');

    logger.info('i');
    logger.warn('w');
    logger.error('e');

    expect(calls.map((c) => c.level)).toEqual(['info', 'warning', 'error']);
  });

  test('attaches the configured default action to every bridged message', () => {
    const { addMessage, calls } = makeRecorder();
    const onAction = jest.fn();
    const logger = new MessagesLogger(addMessage, 'info', { label: 'Open', onAction });

    logger.error('boom');
    expect(calls[0].options?.action?.label).toBe('Open');
  });

  test('leaves the action undefined when no default action is configured', () => {
    const { addMessage, calls } = makeRecorder();
    const logger = new MessagesLogger(addMessage, 'info');

    logger.error('boom');
    expect(calls[0].options?.action).toBeUndefined();
  });
});
