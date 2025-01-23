/*
 * Copyright (c) 2020 Erik Fortune
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

import 'jest-extended';
import { MessageAggregator, fail, succeed } from '../../packlets/base';
import '../helpers/jest';

describe('MessageAggregator', () => {
  describe('constructor', () => {
    test('initializes empty by default', () => {
      const aggregator = new MessageAggregator();
      expect(aggregator.hasMessages).toBe(false);
      expect(aggregator.numMessages).toBe(0);
      expect(aggregator.messages).toEqual([]);
      expect(aggregator.toString()).toBe('');
    });

    test('initializes with messages if supplied', () => {
      const messages = ['prior', 'messages'];
      const aggregator = new MessageAggregator(messages);
      expect(aggregator.hasMessages).toBe(true);
      expect(aggregator.numMessages).toBe(messages.length);
      expect(aggregator.messages).toEqual(messages);
      expect(aggregator.messages).not.toBe(messages); // MUST not reuse incoming array
      expect(aggregator.toString()).toBe(messages.join('\n'));
    });
  });

  describe('addMessage', () => {
    const prior = ['prior', 'messages'];
    let withPrior: MessageAggregator;
    let empty: MessageAggregator;

    beforeEach(() => {
      empty = new MessageAggregator();
      withPrior = new MessageAggregator(prior);
    });

    test('adds a non-empty message', () => {
      empty.addMessage('add');
      withPrior.addMessage('add');
      expect(empty.messages).toEqual(['add']);
      expect(withPrior.messages).toEqual([...prior, 'add']);
    });

    test('does not add an empty string', () => {
      empty.addMessage('');
      withPrior.addMessage('');
      expect(empty.messages).toEqual([]);
      expect(withPrior.messages).toEqual(prior);
    });

    test('does not add undefined', () => {
      empty.addMessage(undefined);
      withPrior.addMessage(undefined);
      expect(empty.messages).toEqual([]);
      expect(withPrior.messages).toEqual(prior);
    });
  });

  describe('addMessages', () => {
    const prior = ['prior', 'messages'];
    const added = ['added', 'messages'];
    let withPrior: MessageAggregator;
    let empty: MessageAggregator;

    beforeEach(() => {
      empty = new MessageAggregator();
      withPrior = new MessageAggregator(prior);
    });

    test('adds a non-empty message', () => {
      empty.addMessages(added);
      withPrior.addMessages(added);
      expect(empty.messages).toEqual(added);
      expect(withPrior.messages).toEqual([...prior, ...added]);
    });

    test('does not add an empty array', () => {
      empty.addMessages([]);
      withPrior.addMessages([]);
      expect(empty.messages).toEqual([]);
      expect(withPrior.messages).toEqual(prior);
    });

    test('does not add undefined', () => {
      empty.addMessages(undefined);
      withPrior.addMessages(undefined);
      expect(empty.messages).toEqual([]);
      expect(withPrior.messages).toEqual(prior);
    });
  });

  describe('toString', () => {
    test('joins messages with newline by default', () => {
      const messages = ['some', 'error', 'messages'];
      const aggregator = new MessageAggregator(messages);
      expect(aggregator.toString()).toEqual(messages.join('\n'));
    });

    test('joins messages with a separator if supplied', () => {
      const messages = ['some', 'error', 'messages'];
      const separator = '|';
      const aggregator = new MessageAggregator(messages);
      expect(aggregator.toString(separator)).toEqual(messages.join(separator));
    });

    test('returns an empty string if there are no errors', () => {
      const aggregator = new MessageAggregator();
      expect(aggregator.toString()).toEqual('');
    });
  });

  describe('returnOrReport', () => {
    let aggregator: MessageAggregator;

    describe('with no aggregated errors', () => {
      beforeEach(() => {
        aggregator = new MessageAggregator();
      });

      test('propagates a success result', () => {
        aggregator = new MessageAggregator();
        expect(aggregator.returnOrReport(succeed('hello'))).toSucceedWith('hello');
      });

      test('propagates a failure result', () => {});
    });

    describe('with aggregated errors', () => {
      const prior = ['some prior', 'error messages'];

      beforeEach(() => {
        aggregator = new MessageAggregator(prior);
      });

      test('reports failure with aggregated messages if passed a successful result', () => {
        expect(aggregator.returnOrReport(succeed('hello'))).toFailWith(prior.join('\n'));
      });

      test('reports failure with aggregated messages including incoming message if passed a failure result', () => {
        expect(aggregator.returnOrReport(fail('extra message'))).toFailWith(
          [...prior, 'extra message'].join('\n')
        );
      });

      test('does not update aggregated messages if passed a failure result', () => {
        expect(aggregator.returnOrReport(fail('extra message'))).toFailWith(
          [...prior, 'extra message'].join('\n')
        );
        expect(aggregator.messages).toEqual(prior);
      });

      test('does not append the supplied failure message if it has already been aggregated', () => {
        expect(aggregator.returnOrReport(fail(prior[0]))).toFailWith(prior.join('\n'));
        expect(aggregator.returnOrReport(fail(prior[1]))).toFailWith(prior.join('\n'));
      });

      test('joins aggregated messages using a separator, if supplied', () => {
        const separator = ':';
        expect(aggregator.returnOrReport(succeed('hello'), separator)).toFailWith([...prior].join(separator));
      });

      test('joins aggregated and supplied message using a separator, if supplied', () => {
        const separator = ':';
        expect(aggregator.returnOrReport(fail('extra message'), separator)).toFailWith(
          [...prior, 'extra message'].join(separator)
        );
      });
    });
  });
});
