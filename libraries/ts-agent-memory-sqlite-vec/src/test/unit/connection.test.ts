/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';

import type BetterSqlite3 from 'better-sqlite3';
// `connection` is deliberately not on the packlet's entry point — it is @internal and
// must not reach the public surface — so this test reaches it directly, per
// TESTING_GUIDELINES.md § "Testing Internal Code" ("import internal modules directly
// when needed" rather than adding an export for the test's benefit).
// eslint-disable-next-line @rushstack/packlets/mechanics
import { closeOwnedConnection, openOwnedConnection } from '../../packlets/sqlite-vec-index/connection';

describe('connection', () => {
  describe('openOwnedConnection', () => {
    test('fails with a driver-load message when the driver cannot be loaded', async () => {
      // The compiled dynamic `import('better-sqlite3')` lowers to a `require` under
      // this package's commonjs emit, so a module-registry mock reaches it. This is
      // the one failure mode of the lazy import that no other test can produce — a
      // broken native install or an ABI mismatch — and it has its own message, so
      // leaving it unexercised would mean shipping a diagnostic nobody had read.
      jest.resetModules();
      jest.doMock('better-sqlite3', () => {
        throw new Error('boom: native binding did not load');
      });

      const isolated = require('../../packlets/sqlite-vec-index/connection') as {
        openOwnedConnection: typeof openOwnedConnection;
      };

      await expect(isolated.openOwnedConnection(':memory:', 'test label')).resolves.toFailWith(
        /test label: failed to load the 'better-sqlite3' driver:.*boom/i
      );

      jest.dontMock('better-sqlite3');
      jest.resetModules();
    });

    test('fails with an open message when the path cannot be opened', async () => {
      expect(await openOwnedConnection('/nonexistent-dir-xyz/db.sqlite', 'test label')).toFailWith(
        /test label: failed to open '\/nonexistent-dir-xyz\/db\.sqlite'/i
      );
    });

    test('succeeds and yields a usable connection', async () => {
      const opened = await openOwnedConnection(':memory:', 'test label');
      expect(opened).toSucceed();
      const db = opened.orThrow();
      expect(db.open).toBe(true);
      expect(closeOwnedConnection(db, 'test label')).toSucceedWith(true);
    });
  });

  describe('closeOwnedConnection', () => {
    test('reports a close that throws rather than swallowing it', () => {
      // This is the branch whose Result the open() cleanup path folds into its own
      // failure message via `withRollbackNote`. A real `better-sqlite3` close does not
      // throw on a healthy or already-closed connection, so the only honest way to
      // reach it is a stand-in that does — which is enough, because the contract under
      // test is "a throwing close becomes a Failure", not any driver behaviour.
      const throwing = {
        close: () => {
          throw new Error('cannot close');
        }
      } as unknown as BetterSqlite3.Database;

      expect(closeOwnedConnection(throwing, 'test label')).toFailWith(
        /test label: failed to close the connection:.*cannot close/i
      );
    });

    test('is idempotent against a real connection', async () => {
      const db = (await openOwnedConnection(':memory:', 'test label')).orThrow();
      expect(closeOwnedConnection(db, 'test label')).toSucceedWith(true);
      expect(closeOwnedConnection(db, 'test label')).toSucceedWith(true);
    });
  });
});
