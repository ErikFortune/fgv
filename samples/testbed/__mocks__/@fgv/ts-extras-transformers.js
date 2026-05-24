/**
 * Manual mock for @fgv/ts-extras-transformers.
 *
 * Prevents @huggingface/transformers (which requires Node.js native modules)
 * from loading in the jsdom test environment. Tests that exercise the
 * classifier screener replace these stubs via jest.mocked() in beforeEach.
 */
'use strict';

const { fail } = require('@fgv/ts-utils');

module.exports = {
  loadPipeline: jest.fn().mockResolvedValue(fail('loadPipeline not mocked in this test')),
  classify: jest.fn().mockResolvedValue(fail('classify not mocked in this test'))
};
