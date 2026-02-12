// Copyright (c) 2026 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import '@fgv/ts-utils-jest';

import { ConfectionId, FillingId, UserEntities, UserLibrary as UserLib } from '@fgv/ts-chocolate';

import {
  renderSessionDetail,
  renderSessionSummary
} from '../../../../../commands/workspace/renderers/sessionRenderer';
import { createTestLibrary } from './helpers/testLibrary';

describe('sessionRenderer', () => {
  const chocolateLib = createTestLibrary();
  let userLib: UserLib.UserLibrary;
  let fillingSession: UserLib.Session.EditingSession;
  let moldedBonBonSession: UserLib.Session.MoldedBonBonEditingSession;
  let barTruffleSession: UserLib.Session.BarTruffleEditingSession;
  let rolledTruffleSession: UserLib.Session.RolledTruffleEditingSession;

  beforeEach(() => {
    // Create user library with empty sessions/journals/inventory
    const userEntities = UserEntities.UserEntityLibrary.create().orThrow();
    userLib = UserLib.UserLibrary.create(userEntities, chocolateLib).orThrow();

    // Create a filling editing session
    const filling = chocolateLib.fillings.get('test.dark-ganache' as FillingId).orThrow();
    const variation = filling.goldenVariation;
    fillingSession = UserLib.Session.EditingSession.create(variation, 1.5).orThrow();

    // Create confection editing sessions for each confection type
    const moldedBonBon = chocolateLib.confections.get('test.test-bonbon' as ConfectionId).orThrow();
    if (!moldedBonBon.isMoldedBonBon()) {
      throw new Error('Expected molded bonbon');
    }
    moldedBonBonSession = UserLib.Session.MoldedBonBonEditingSession.create(moldedBonBon, userLib).orThrow();

    const barTruffle = chocolateLib.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();
    if (!barTruffle.isBarTruffle()) {
      throw new Error('Expected bar truffle');
    }
    barTruffleSession = UserLib.Session.BarTruffleEditingSession.create(barTruffle, userLib).orThrow();

    const rolledTruffle = chocolateLib.confections.get('test.test-rolled-truffle' as ConfectionId).orThrow();
    if (!rolledTruffle.isRolledTruffle()) {
      throw new Error('Expected rolled truffle');
    }
    rolledTruffleSession = UserLib.Session.RolledTruffleEditingSession.create(
      rolledTruffle,
      userLib
    ).orThrow();
  });

  // ============================================================================
  // renderSessionSummary
  // ============================================================================

  describe('renderSessionSummary', () => {
    describe('filling sessions', () => {
      test('formats filling session summary with recipe name and target weight', () => {
        const summary = renderSessionSummary(fillingSession);

        expect(summary).toContain(fillingSession.sessionId);
        expect(summary).toContain('[filling]');
        expect(summary).toContain('Dark Ganache');
        expect(summary).toContain('525g');
      });
    });

    describe('confection sessions', () => {
      test('formats molded bonbon session summary', () => {
        const summary = renderSessionSummary(moldedBonBonSession);

        expect(summary).toContain(moldedBonBonSession.sessionId);
        expect(summary).toContain('[molded-bonbon]');
        expect(summary).toContain('Test BonBon');
      });

      test('formats bar truffle session summary', () => {
        const summary = renderSessionSummary(barTruffleSession);

        expect(summary).toContain(barTruffleSession.sessionId);
        expect(summary).toContain('[bar-truffle]');
        expect(summary).toContain('Test Bar Truffle');
      });

      test('formats rolled truffle session summary', () => {
        const summary = renderSessionSummary(rolledTruffleSession);

        expect(summary).toContain(rolledTruffleSession.sessionId);
        expect(summary).toContain('[rolled-truffle]');
        expect(summary).toContain('Test Rolled Truffle');
      });
    });
  });

  // ============================================================================
  // renderSessionDetail
  // ============================================================================

  describe('renderSessionDetail', () => {
    describe('filling sessions', () => {
      test('renders basic session information', () => {
        const result = renderSessionDetail(fillingSession);

        expect(result.text).toContain('Session: Dark Ganache');
        expect(result.text).toContain(`Session ID: ${fillingSession.sessionId}`);
        expect(result.text).toContain('Type: Filling');
      });

      test('renders recipe information', () => {
        const result = renderSessionDetail(fillingSession);

        expect(result.text).toContain('Recipe: Dark Ganache (test.dark-ganache)');
        expect(result.text).toContain('Variation: 2026-01-01-01');
      });

      test('renders target weight', () => {
        const result = renderSessionDetail(fillingSession);

        expect(result.text).toContain('Target Weight: 525g');
      });

      test('renders has changes status', () => {
        const result = renderSessionDetail(fillingSession);

        expect(result.text).toContain('Has Changes: no');
      });

      test('includes view filling action', () => {
        const result = renderSessionDetail(fillingSession);

        expect(result.actions).toHaveLength(1);
        expect(result.actions[0].label).toContain('View filling: Dark Ganache');
        expect(result.actions[0].key).toBe('view-filling:test.dark-ganache');
        expect(result.actions[0].description).toContain('Navigate to filling test.dark-ganache');
      });
    });

    describe('confection sessions', () => {
      describe('molded bonbon sessions', () => {
        test('renders basic session information', () => {
          const result = renderSessionDetail(moldedBonBonSession);

          expect(result.text).toContain('Session: Test BonBon');
          expect(result.text).toContain(`Session ID: ${moldedBonBonSession.sessionId}`);
          expect(result.text).toContain('Type: molded-bonbon');
        });

        test('renders confection information', () => {
          const result = renderSessionDetail(moldedBonBonSession);

          expect(result.text).toContain('Confection: Test BonBon (test.test-bonbon)');
        });

        test('renders filling sessions count with fillings', () => {
          const result = renderSessionDetail(moldedBonBonSession);

          expect(result.text).toContain('Filling Sessions: 1');
        });

        test('renders filling slots when present', () => {
          const result = renderSessionDetail(moldedBonBonSession);

          expect(result.text).toContain('Filling Slots:');
          expect(result.text).toContain('center: Dark Ganache');
        });

        test('includes view confection action', () => {
          const result = renderSessionDetail(moldedBonBonSession);

          expect(result.actions).toHaveLength(1);
          expect(result.actions[0].label).toContain('View confection: Test BonBon');
          expect(result.actions[0].key).toBe('view-confection:test.test-bonbon');
          expect(result.actions[0].description).toContain('Navigate to confection test.test-bonbon');
        });
      });

      describe('bar truffle sessions', () => {
        test('renders basic session information', () => {
          const result = renderSessionDetail(barTruffleSession);

          expect(result.text).toContain('Session: Test Bar Truffle');
          expect(result.text).toContain(`Session ID: ${barTruffleSession.sessionId}`);
          expect(result.text).toContain('Type: bar-truffle');
        });

        test('renders confection information', () => {
          const result = renderSessionDetail(barTruffleSession);

          expect(result.text).toContain('Confection: Test Bar Truffle (test.test-bar-truffle)');
        });

        test('renders filling sessions count when empty', () => {
          const result = renderSessionDetail(barTruffleSession);

          expect(result.text).toContain('Filling Sessions: 0');
        });

        test('includes view confection action', () => {
          const result = renderSessionDetail(barTruffleSession);

          expect(result.actions).toHaveLength(1);
          expect(result.actions[0].label).toContain('View confection: Test Bar Truffle');
          expect(result.actions[0].key).toBe('view-confection:test.test-bar-truffle');
        });
      });

      describe('rolled truffle sessions', () => {
        test('renders basic session information', () => {
          const result = renderSessionDetail(rolledTruffleSession);

          expect(result.text).toContain('Session: Test Rolled Truffle');
          expect(result.text).toContain(`Session ID: ${rolledTruffleSession.sessionId}`);
          expect(result.text).toContain('Type: rolled-truffle');
        });

        test('renders confection information', () => {
          const result = renderSessionDetail(rolledTruffleSession);

          expect(result.text).toContain('Confection: Test Rolled Truffle (test.test-rolled-truffle)');
        });

        test('renders filling sessions count when empty', () => {
          const result = renderSessionDetail(rolledTruffleSession);

          expect(result.text).toContain('Filling Sessions: 0');
        });

        test('includes view confection action', () => {
          const result = renderSessionDetail(rolledTruffleSession);

          expect(result.actions).toHaveLength(1);
          expect(result.actions[0].label).toContain('View confection: Test Rolled Truffle');
          expect(result.actions[0].key).toBe('view-confection:test.test-rolled-truffle');
        });
      });
    });
  });
});
