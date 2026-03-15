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

import { FileTree } from '@fgv/ts-json-base';
import { SessionLibrary, Session } from '../../../../packlets/entities';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { ISessionFileTreeSource } from '../../../../packlets/entities/session/library';
import {
  BaseSessionId,
  CollectionId,
  ConfectionId,
  ConfectionRecipeVariationId,
  FillingId,
  FillingRecipeVariationId,
  Measurement,
  Percentage,
  SessionId,
  SlotId
} from '../../../../packlets/common';

describe('SessionLibrary', () => {
  const testCollectionId = 'user-sessions' as CollectionId;

  // Minimal produced filling entity for history
  const minimalProducedFilling = {
    variationId: 'test.ganache@2026-01-01-01' as FillingRecipeVariationId,
    scaleFactor: 1,
    targetWeight: 300 as Measurement,
    ingredients: []
  };

  const fillingSession1: Session.IFillingSessionEntity = {
    baseId: '2026-01-15-143025-a1b2c3d4' as BaseSessionId,
    sessionType: 'filling',
    status: 'active',
    createdAt: '2026-01-15T14:30:25Z',
    updatedAt: '2026-01-15T14:30:25Z',
    sourceVariationId: 'test.ganache@2026-01-01-01' as FillingRecipeVariationId,
    history: {
      current: minimalProducedFilling,
      original: minimalProducedFilling,
      undoStack: [],
      redoStack: []
    }
  };

  const fillingSession2: Session.IFillingSessionEntity = {
    baseId: '2026-01-16-100000-b2c3d4e5' as BaseSessionId,
    sessionType: 'filling',
    status: 'committed',
    createdAt: '2026-01-16T10:00:00Z',
    updatedAt: '2026-01-16T10:00:00Z',
    sourceVariationId: 'test.ganache@2026-01-01-01' as FillingRecipeVariationId,
    history: {
      current: minimalProducedFilling,
      original: minimalProducedFilling,
      undoStack: [],
      redoStack: []
    }
  };

  // Minimal produced confection for history
  const minimalProducedConfection = {
    confectionType: 'molded-bonbon' as const,
    variationId: 'test.truffle@2026-01-01-01' as ConfectionRecipeVariationId,
    yield: {
      numFrames: 1,
      bufferPercentage: 10 as Percentage
    },
    fillings: [],
    moldId: 'builtin.half-sphere' as unknown as import('../../../../packlets/common').MoldId,
    shellChocolateId: 'builtin.dark-70' as unknown as import('../../../../packlets/common').IngredientId
  };

  const confectionSession1: Session.IConfectionSessionEntity = {
    baseId: '2026-01-17-120000-c3d4e5f6' as BaseSessionId,
    sessionType: 'confection',
    confectionType: 'molded-bonbon',
    status: 'active',
    createdAt: '2026-01-17T12:00:00Z',
    updatedAt: '2026-01-17T12:00:00Z',
    sourceVariationId: 'test.truffle@2026-01-01-01' as ConfectionRecipeVariationId,
    history: {
      current: minimalProducedConfection,
      original: minimalProducedConfection,
      undoStack: [],
      redoStack: []
    },
    childSessionIds: {
      ['center' as SlotId]: 'user-sessions.2026-01-15-143025-a1b2c3d4' as SessionId
    }
  };

  // ============================================================================
  // create
  // ============================================================================

  describe('create', () => {
    test('creates empty library', () => {
      expect(SessionLibrary.create({ builtin: false })).toSucceed();
    });

    test('creates library with collections', () => {
      expect(
        SessionLibrary.create({
          builtin: false,
          collections: [
            {
              id: testCollectionId,
              isMutable: true,
              items: {
                /* eslint-disable @typescript-eslint/naming-convention */
                '2026-01-15-143025-a1b2c3d4': fillingSession1
                /* eslint-enable @typescript-eslint/naming-convention */
              }
            }
          ]
        })
      ).toSucceed();
    });
  });

  // ============================================================================
  // Cross-collection filling queries
  // ============================================================================

  describe('getSessionsForFilling', () => {
    test('returns sessions for a filling', () => {
      const lib = SessionLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: true,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              '2026-01-15-143025-a1b2c3d4': fillingSession1,
              '2026-01-16-100000-b2c3d4e5': fillingSession2
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      const sessions = lib.getSessionsForFilling('test.ganache' as FillingId);
      expect(sessions).toHaveLength(2);
    });

    test('returns empty array for unknown filling', () => {
      const lib = SessionLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: true,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              '2026-01-15-143025-a1b2c3d4': fillingSession1
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      expect(lib.getSessionsForFilling('test.unknown' as FillingId)).toHaveLength(0);
    });
  });

  describe('getSessionsForFillingRecipeVariation', () => {
    test('returns sessions for a specific variation', () => {
      const lib = SessionLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: true,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              '2026-01-15-143025-a1b2c3d4': fillingSession1
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      const sessions = lib.getSessionsForFillingRecipeVariation(
        'test.ganache@2026-01-01-01' as FillingRecipeVariationId
      );
      expect(sessions).toHaveLength(1);
      expect(sessions[0].baseId).toBe(fillingSession1.baseId);
    });

    test('returns empty array for unknown variation', () => {
      const lib = SessionLibrary.create({ builtin: false }).orThrow();
      expect(
        lib.getSessionsForFillingRecipeVariation('test.ganache@9999-99-99-01' as FillingRecipeVariationId)
      ).toHaveLength(0);
    });
  });

  // ============================================================================
  // Cross-collection confection queries
  // ============================================================================

  describe('getSessionsForConfection', () => {
    test('returns sessions for a confection', () => {
      const lib = SessionLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: true,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              '2026-01-17-120000-c3d4e5f6': confectionSession1
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      const sessions = lib.getSessionsForConfection('test.truffle' as ConfectionId);
      expect(sessions).toHaveLength(1);
    });

    test('returns empty array for unknown confection', () => {
      const lib = SessionLibrary.create({ builtin: false }).orThrow();
      expect(lib.getSessionsForConfection('test.unknown' as ConfectionId)).toHaveLength(0);
    });
  });

  describe('getSessionsForConfectionRecipeVariation', () => {
    test('returns sessions for a specific variation', () => {
      const lib = SessionLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: true,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              '2026-01-17-120000-c3d4e5f6': confectionSession1
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      const sessions = lib.getSessionsForConfectionRecipeVariation(
        'test.truffle@2026-01-01-01' as ConfectionRecipeVariationId
      );
      expect(sessions).toHaveLength(1);
    });

    test('returns empty array for unknown variation', () => {
      const lib = SessionLibrary.create({ builtin: false }).orThrow();
      expect(
        lib.getSessionsForConfectionRecipeVariation(
          'test.truffle@9999-99-99-01' as ConfectionRecipeVariationId
        )
      ).toHaveLength(0);
    });
  });

  // ============================================================================
  // Status queries
  // ============================================================================

  describe('getSessionsByStatus', () => {
    test('returns sessions with matching status', () => {
      const lib = SessionLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: true,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              '2026-01-15-143025-a1b2c3d4': fillingSession1,
              '2026-01-16-100000-b2c3d4e5': fillingSession2,
              '2026-01-17-120000-c3d4e5f6': confectionSession1
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      const active = lib.getSessionsByStatus('active');
      expect(active).toHaveLength(2); // fillingSession1 + confectionSession1

      const committed = lib.getSessionsByStatus('committed');
      expect(committed).toHaveLength(1); // fillingSession2
    });

    test('returns empty for status with no sessions', () => {
      const lib = SessionLibrary.create({ builtin: false }).orThrow();
      expect(lib.getSessionsByStatus('abandoned')).toHaveLength(0);
    });

    test('returns planning sessions', () => {
      const planningSession: Session.IFillingSessionEntity = {
        ...fillingSession1,
        baseId: '2026-01-18-100000-d4e5f6d7' as BaseSessionId,
        status: 'planning'
      };

      const lib = SessionLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: true,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              '2026-01-18-100000-d4e5f6d7': planningSession
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      const planning = lib.getSessionsByStatus('planning');
      expect(planning).toHaveLength(1);
      expect(planning[0].status).toBe('planning');
    });
  });

  describe('getActiveSessions', () => {
    test('returns active sessions', () => {
      const lib = SessionLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: true,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              '2026-01-15-143025-a1b2c3d4': fillingSession1,
              '2026-01-16-100000-b2c3d4e5': fillingSession2
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      expect(lib.getActiveSessions()).toHaveLength(1);
    });
  });

  // ============================================================================
  // CRUD
  // ============================================================================

  describe('getSession / hasSession / getAllSessions', () => {
    test('getSession returns session by ID', () => {
      const lib = SessionLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: true,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              '2026-01-15-143025-a1b2c3d4': fillingSession1
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      const compositeId = `${testCollectionId}.2026-01-15-143025-a1b2c3d4` as SessionId;
      expect(lib.getSession(compositeId)).toSucceedAndSatisfy((session) => {
        expect(session.baseId).toBe(fillingSession1.baseId);
      });
    });

    test('getSession returns confection session by ID', () => {
      const lib = SessionLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: true,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              '2026-01-17-120000-c3d4e5f6': confectionSession1
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      const compositeId = `${testCollectionId}.2026-01-17-120000-c3d4e5f6` as SessionId;
      expect(lib.getSession(compositeId)).toSucceedAndSatisfy((session) => {
        expect(session.baseId).toBe(confectionSession1.baseId);
        expect(session.sessionType).toBe('confection');
      });
    });

    test('hasSession returns true for existing session', () => {
      const lib = SessionLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: true,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              '2026-01-15-143025-a1b2c3d4': fillingSession1
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      expect(lib.hasSession(`${testCollectionId}.2026-01-15-143025-a1b2c3d4` as SessionId)).toBe(true);
    });

    test('hasSession returns false for non-existent session', () => {
      const lib = SessionLibrary.create({ builtin: false }).orThrow();
      expect(lib.hasSession(`${testCollectionId}.2026-01-01-000000-00000000` as SessionId)).toBe(false);
    });

    test('getAllSessions returns all sessions', () => {
      const lib = SessionLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: true,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              '2026-01-15-143025-a1b2c3d4': fillingSession1,
              '2026-01-16-100000-b2c3d4e5': fillingSession2
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      expect(lib.getAllSessions()).toHaveLength(2);
    });

    test('getAllSessions includes both filling and confection sessions', () => {
      const lib = SessionLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: true,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              '2026-01-15-143025-a1b2c3d4': fillingSession1,
              '2026-01-17-120000-c3d4e5f6': confectionSession1
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      const all = lib.getAllSessions();
      expect(all).toHaveLength(2);
      expect(all.filter((s) => s.sessionType === 'filling')).toHaveLength(1);
      expect(all.filter((s) => s.sessionType === 'confection')).toHaveLength(1);
    });
  });

  describe('addSession', () => {
    test('adds session to mutable collection', () => {
      const lib = SessionLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: true,
            items: {}
          }
        ]
      }).orThrow();

      expect(lib.addSession(testCollectionId, fillingSession1)).toSucceed();
      expect(lib.hasSession(`${testCollectionId}.${fillingSession1.baseId}` as SessionId)).toBe(true);
    });

    test('fails on duplicate session', () => {
      const lib = SessionLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: true,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              '2026-01-15-143025-a1b2c3d4': fillingSession1
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      expect(lib.addSession(testCollectionId, fillingSession1)).toFail();
    });
  });

  describe('upsertSession', () => {
    test('inserts new session', () => {
      const lib = SessionLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: true,
            items: {}
          }
        ]
      }).orThrow();

      expect(lib.upsertSession(testCollectionId, fillingSession1)).toSucceed();
      expect(lib.getAllSessions()).toHaveLength(1);
    });

    test('updates existing session', () => {
      const lib = SessionLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: true,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              '2026-01-15-143025-a1b2c3d4': fillingSession1
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      const updated: Session.IFillingSessionEntity = {
        ...fillingSession1,
        status: 'committed'
      };
      expect(lib.upsertSession(testCollectionId, updated)).toSucceed();

      const sessions = lib.getSessionsByStatus('committed');
      expect(sessions).toHaveLength(1);
    });
  });

  describe('removeSession', () => {
    test('removes session by composite ID', () => {
      const lib = SessionLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: true,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              '2026-01-15-143025-a1b2c3d4': fillingSession1
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      const compositeId = `${testCollectionId}.${fillingSession1.baseId}` as SessionId;
      expect(lib.removeSession(compositeId)).toSucceedAndSatisfy((removed) => {
        expect(removed.baseId).toBe(fillingSession1.baseId);
      });

      expect(lib.hasSession(compositeId)).toBe(false);
    });

    test('fails for non-existent session', () => {
      const lib = SessionLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: true,
            items: {}
          }
        ]
      }).orThrow();

      expect(lib.removeSession(`${testCollectionId}.2026-01-01-000000-00000000` as SessionId)).toFailWith(
        /not found/i
      );
    });

    test('fails for immutable collection', () => {
      const lib = SessionLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: false,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              '2026-01-15-143025-a1b2c3d4': fillingSession1
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      expect(lib.removeSession(`${testCollectionId}.${fillingSession1.baseId}` as SessionId)).toFailWith(
        /immutable/i
      );
    });
  });

  // ============================================================================
  // Index invalidation
  // ============================================================================

  describe('index invalidation', () => {
    test('indices reflect newly added sessions', () => {
      const lib = SessionLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: true,
            items: {}
          }
        ]
      }).orThrow();

      expect(lib.getSessionsForFilling('test.ganache' as FillingId)).toHaveLength(0);

      lib.addSession(testCollectionId, fillingSession1).orThrow();
      expect(lib.getSessionsForFilling('test.ganache' as FillingId)).toHaveLength(1);
    });

    test('indices reflect newly added confection sessions', () => {
      const lib = SessionLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: true,
            items: {}
          }
        ]
      }).orThrow();

      expect(lib.getSessionsForConfection('test.truffle' as ConfectionId)).toHaveLength(0);

      lib.addSession(testCollectionId, confectionSession1).orThrow();
      expect(lib.getSessionsForConfection('test.truffle' as ConfectionId)).toHaveLength(1);
      expect(
        lib.getSessionsForConfectionRecipeVariation(
          'test.truffle@2026-01-01-01' as ConfectionRecipeVariationId
        )
      ).toHaveLength(1);
    });

    test('indices reflect removed sessions', () => {
      const lib = SessionLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: true,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              '2026-01-15-143025-a1b2c3d4': fillingSession1
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      expect(lib.getSessionsForFilling('test.ganache' as FillingId)).toHaveLength(1);

      lib.removeSession(`${testCollectionId}.${fillingSession1.baseId}` as SessionId).orThrow();
      expect(lib.getSessionsForFilling('test.ganache' as FillingId)).toHaveLength(0);
    });

    test('indices reflect removed confection sessions', () => {
      const lib = SessionLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: true,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              '2026-01-17-120000-c3d4e5f6': confectionSession1
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      expect(lib.getSessionsForConfection('test.truffle' as ConfectionId)).toHaveLength(1);

      lib.removeSession(`${testCollectionId}.${confectionSession1.baseId}` as SessionId).orThrow();
      expect(lib.getSessionsForConfection('test.truffle' as ConfectionId)).toHaveLength(0);
    });

    test('indices reflect upserted sessions', () => {
      const lib = SessionLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: true,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              '2026-01-15-143025-a1b2c3d4': fillingSession1
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      expect(lib.getActiveSessions()).toHaveLength(1);

      const updated: Session.IFillingSessionEntity = {
        ...fillingSession1,
        status: 'committed'
      };
      lib.upsertSession(testCollectionId, updated).orThrow();

      expect(lib.getActiveSessions()).toHaveLength(0);
      expect(lib.getSessionsByStatus('committed')).toHaveLength(1);
    });

    test('indices reflect upserted confection sessions', () => {
      const lib = SessionLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: true,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              '2026-01-17-120000-c3d4e5f6': confectionSession1
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      expect(lib.getActiveSessions()).toHaveLength(1);

      const updated: Session.IConfectionSessionEntity = {
        ...confectionSession1,
        status: 'committed'
      };
      lib.upsertSession(testCollectionId, updated).orThrow();

      expect(lib.getActiveSessions()).toHaveLength(0);
      expect(lib.getSessionsByStatus('committed')).toHaveLength(1);
    });
  });

  // ============================================================================
  // createCollection
  // ============================================================================

  describe('createCollection', () => {
    test('creates new mutable collection', () => {
      const lib = SessionLibrary.create({ builtin: false }).orThrow();
      const newCollectionId = 'new-sessions' as CollectionId;

      expect(lib.createCollection(newCollectionId)).toSucceedWith(newCollectionId);

      expect(lib.addSession(newCollectionId, fillingSession1)).toSucceed();
    });

    test('fails on duplicate collection ID', () => {
      const lib = SessionLibrary.create({
        builtin: false,
        collections: [
          {
            id: testCollectionId,
            isMutable: true,
            items: {}
          }
        ]
      }).orThrow();

      expect(lib.createCollection(testCollectionId)).toFailWith(/already exists/i);
    });
  });
});

// ============================================================================
// createAsync Tests (with encryption support)
// ============================================================================

describe('SessionLibrary.createAsync', () => {
  test('creates empty library with builtin: false', async () => {
    const result = await SessionLibrary.createAsync({ builtin: false });
    expect(result).toSucceedAndSatisfy((lib) => {
      expect(lib.collections.size).toBe(0);
      expect(lib.size).toBe(0);
    });
  });

  test('fails when collection contains invalid session data', async () => {
    const files: FileTree.IInMemoryFile[] = [
      {
        path: '/data/sessions/invalid.yaml',
        contents: {
          items: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'invalid-session': {
              // Missing required fields like baseId, sessionType, status
              someField: 'invalid'
            }
          }
        }
      }
    ];

    const tree = FileTree.inMemory(files).orThrow();
    const rootDir = tree.getItem('/').orThrow();

    const fileSource: ISessionFileTreeSource = {
      directory: rootDir as FileTree.IFileTreeDirectoryItem,
      mutable: true
    };

    const result = await SessionLibrary.createAsync({
      builtin: false,
      fileSources: fileSource
    });

    expect(result).toFailWith(/discriminator property sessionType not present/i);
  });
});
