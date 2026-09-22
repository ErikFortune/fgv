/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { JsonSchema, JsonValue } from '@fgv/ts-json-base';
import { Converter, Converters, Result, fail, succeed } from '@fgv/ts-utils';
import {
  ITaskKindDescriptor,
  ITaskKindHandle,
  TaskKind,
  TaskKindRegistry,
  createTaskCommandHandle,
  taskListDescriptor,
  trackedTaskDescriptor
} from '../../../index';
import { converters, hostileShape, minimalEnvelope, trackedSnapshot } from '../../helpers/fixtures';

interface IWidgetDetails {
  readonly width: number;
}

const widgetKind: TaskKind = 'test.widget' as TaskKind;

const widgetDetails: Converter<IWidgetDetails> = Converters.strictObject<IWidgetDetails>({
  width: Converters.number
}).withConstraint(
  (value: IWidgetDetails): Result<IWidgetDetails> =>
    value.width > 0 ? succeed(value) : fail('width must be positive')
);

function widgetDescriptor(detailVersion: number = 1): ITaskKindDescriptor<IWidgetDetails> {
  return {
    kind: widgetKind,
    detailVersion,
    details: widgetDetails,
    encode: (value: IWidgetDetails): Result<JsonValue> => succeed({ width: value.width })
  };
}

function newRegistry(): TaskKindRegistry {
  return TaskKindRegistry.create(converters.envelopes.snapshot).orThrow();
}

function widgetSnapshot(details: JsonValue, detailVersion: number = 1): Record<string, JsonValue> {
  return { envelope: { ...minimalEnvelope(), kind: 'test.widget', detailVersion }, details };
}

describe('registration', () => {
  test('registers a kind and returns a typed handle', () => {
    const registry: TaskKindRegistry = newRegistry();
    expect(registry.register(widgetDescriptor())).toSucceedAndSatisfy((handle) => {
      expect(handle.kind).toBe(widgetKind);
      expect(handle.detailVersion).toBe(1);
      expect(registry.has(widgetKind, 1)).toBe(true);
    });
  });

  test('rejects a duplicate (kind, version) registration', () => {
    const registry: TaskKindRegistry = newRegistry();
    expect(registry.register(widgetDescriptor())).toSucceed();
    expect(registry.register(widgetDescriptor())).toFailWith(/test\.widget@1: already registered/i);
  });

  test('the same kind at a different version is a separate registration', () => {
    const registry: TaskKindRegistry = newRegistry();
    expect(registry.register(widgetDescriptor(1))).toSucceed();
    expect(registry.register(widgetDescriptor(2))).toSucceed();
    expect(registry.has(widgetKind, 2)).toBe(true);
    expect(registry.has(widgetKind, 3)).toBe(false);
  });

  test('rejects a detail version that is not a positive safe integer', () => {
    const registry: TaskKindRegistry = newRegistry();
    expect(registry.register(widgetDescriptor(0))).toFailWith(/positive safe integer/i);
    expect(registry.register(widgetDescriptor(1.5))).toFailWith(/positive safe integer/i);
  });

  test('rejects duplicate command names within one kind', () => {
    const registry: TaskKindRegistry = newRegistry();
    const command = createTaskCommandHandle<Record<string, never>>({
      name: 'grow',
      parameters: JsonSchema.object({}),
      encode: (): Result<JsonValue> => succeed({}),
      idempotency: 'none',
      conditional: false
    });
    expect(registry.register({ ...widgetDescriptor(), commands: [command, command] })).toFailWith(
      /duplicate command 'grow'/i
    );
  });

  test('each registry is independent — nothing is registered at import', () => {
    const a: TaskKindRegistry = newRegistry();
    const b: TaskKindRegistry = newRegistry();
    expect(a.register(widgetDescriptor())).toSucceed();
    expect(a.has(widgetKind, 1)).toBe(true);
    expect(b.has(widgetKind, 1)).toBe(false);
    expect(b.register(widgetDescriptor())).toSucceed();
  });
});

describe('freezing', () => {
  test('freeze reports the registration count and closes the registry', () => {
    const registry: TaskKindRegistry = newRegistry();
    expect(registry.register(widgetDescriptor())).toSucceed();
    expect(registry.isFrozen).toBe(false);
    expect(registry.freeze()).toSucceedWith(1);
    expect(registry.isFrozen).toBe(true);
    expect(registry.register(widgetDescriptor(2))).toFailWith(/frozen registry/i);
  });

  test('freezing twice is harmless and still reports the count', () => {
    const registry: TaskKindRegistry = newRegistry();
    expect(registry.freeze()).toSucceedWith(0);
    expect(registry.freeze()).toSucceedWith(0);
  });
});

describe('convert', () => {
  test('validates the envelope and the details of a registered kind', () => {
    const registry: TaskKindRegistry = newRegistry();
    expect(registry.register(widgetDescriptor())).toSucceed();
    expect(registry.convert(widgetSnapshot({ width: 4 }))).toSucceedAndSatisfy((snapshot) => {
      expect(snapshot.envelope.kind).toBe('test.widget');
      expect(snapshot.details).toEqual({ width: 4 });
    });
  });

  test('an unknown kind cannot be treated as a validated current type', () => {
    const registry: TaskKindRegistry = newRegistry();
    expect(registry.convert(trackedSnapshot())).toFailWith(/fgv\.tracked@1: no registered task kind/i);
  });

  test('an unknown *version* of a known kind fails the same way', () => {
    const registry: TaskKindRegistry = newRegistry();
    expect(registry.register(widgetDescriptor(1))).toSucceed();
    expect(registry.convert(widgetSnapshot({ width: 4 }, 2))).toFailWith(
      /test\.widget@2: no registered task kind/i
    );
  });

  test('reports unknown-kind-version in the classified detail', () => {
    const registry: TaskKindRegistry = newRegistry();
    expect(registry.convert(trackedSnapshot())).toFailWithDetail(/fgv\.tracked@1: no registered task kind/i, {
      code: 'unknown-kind-version',
      retry: 'after-host-action'
    });
  });

  test('a malformed envelope is invalid, not unknown-kind', () => {
    const registry: TaskKindRegistry = newRegistry();
    expect(registry.convert({ envelope: { id: 'x' }, details: {} })).toFailWithDetail(
      /schemaVersion not found/i,
      { code: 'invalid', retry: 'after-host-action' }
    );
  });

  test('details that fail the registered converter are invalid', () => {
    const registry: TaskKindRegistry = newRegistry();
    expect(registry.register(widgetDescriptor())).toSucceed();
    expect(registry.convert(widgetSnapshot({ width: -1 }))).toFailWithDetail(
      /test\.widget@1: width must be positive/i,
      { code: 'invalid', retry: 'after-host-action' }
    );
  });

  test('conversion enforces domain invariants the schema alone would not', () => {
    const registry: TaskKindRegistry = newRegistry();
    expect(registry.register(widgetDescriptor())).toSucceed();
    expect(registry.convert(widgetSnapshot({ width: 0 }))).toFail();
    expect(registry.convert(widgetSnapshot({ width: 1 }))).toSucceed();
  });

  test('an unknown details property is rejected, not dropped', () => {
    const registry: TaskKindRegistry = newRegistry();
    expect(registry.register(widgetDescriptor())).toSucceed();
    expect(registry.convert(widgetSnapshot({ width: 4, height: 9 }))).toFail();
  });

  test('a __proto__ key in details reaches the registered converter neutralized', () => {
    const registry: TaskKindRegistry = newRegistry();
    expect(registry.register(widgetDescriptor())).toSucceed();
    const details: JsonValue = hostileShape({ width: 4 }, '"__proto__":{"width":99}') as JsonValue;
    expect(registry.convert(widgetSnapshot(details))).toSucceedAndSatisfy((snapshot) => {
      // The key is removed on the way through the JSON converter rather than honored,
      // so nothing downstream sees a polluted prototype or a width of 99.
      expect(snapshot.details).toEqual({ width: 4 });
      expect(Object.getOwnPropertyNames(snapshot.details)).toEqual(['width']);
      expect(Object.getPrototypeOf(snapshot.details)).toBe(Object.prototype);
    });
  });
});

describe('typed handles', () => {
  test('decode yields the registered type', () => {
    const registry: TaskKindRegistry = newRegistry();
    const handle: ITaskKindHandle<IWidgetDetails> = registry.register(widgetDescriptor()).orThrow();
    const snapshot = converters.envelopes.snapshot.convert(widgetSnapshot({ width: 7 })).orThrow();
    expect(handle.decode(snapshot)).toSucceedAndSatisfy((typed) => {
      expect(typed.details.width).toBe(7);
    });
  });

  test('a handle refuses a snapshot of another kind', () => {
    const registry: TaskKindRegistry = newRegistry();
    const handle: ITaskKindHandle<IWidgetDetails> = registry.register(widgetDescriptor()).orThrow();
    const snapshot = converters.envelopes.snapshot.convert(trackedSnapshot()).orThrow();
    expect(handle.decode(snapshot)).toFailWith(/test\.widget@1: handle cannot decode fgv\.tracked@1/i);
  });

  test('a handle refuses another *version* of its own kind', () => {
    const registry: TaskKindRegistry = newRegistry();
    const handle: ITaskKindHandle<IWidgetDetails> = registry.register(widgetDescriptor(1)).orThrow();
    const snapshot = converters.envelopes.snapshot.convert(widgetSnapshot({ width: 7 }, 2)).orThrow();
    expect(handle.decode(snapshot)).toFailWith(/handle cannot decode test\.widget@2/i);
  });

  test('decode then encode round-trips through the registered codec', () => {
    const registry: TaskKindRegistry = newRegistry();
    const handle: ITaskKindHandle<IWidgetDetails> = registry.register(widgetDescriptor()).orThrow();
    const snapshot = converters.envelopes.snapshot.convert(widgetSnapshot({ width: 7 })).orThrow();
    expect(handle.decode(snapshot)).toSucceedAndSatisfy((typed) => {
      expect(handle.encode(typed)).toSucceedWith(snapshot);
    });
  });

  test('encode refuses a snapshot whose envelope names another kind', () => {
    const registry: TaskKindRegistry = newRegistry();
    const handle: ITaskKindHandle<IWidgetDetails> = registry.register(widgetDescriptor()).orThrow();
    const foreign = { envelope: minimalEnvelope(), details: { width: 3 } };
    const typed = converters.envelopes.snapshot.convert(foreign).orThrow();
    expect(handle.encode({ envelope: typed.envelope, details: { width: 3 } })).toFailWith(
      /handle cannot decode fgv\.tracked@1/i
    );
  });

  test('decode reports the converter failure with the kind that rejected it', () => {
    const registry: TaskKindRegistry = newRegistry();
    const handle: ITaskKindHandle<IWidgetDetails> = registry.register(widgetDescriptor()).orThrow();
    const snapshot = converters.envelopes.snapshot.convert(widgetSnapshot({ width: 4 })).orThrow();
    expect(handle.decode({ envelope: snapshot.envelope, details: { width: 'wide' } })).toFailWith(
      /test\.widget@1/i
    );
  });

  test('encode reports a failing encoder', () => {
    const registry: TaskKindRegistry = newRegistry();
    const handle: ITaskKindHandle<IWidgetDetails> = registry
      .register({
        ...widgetDescriptor(),
        encode: (): Result<JsonValue> => fail('encoder refused')
      })
      .orThrow();
    const snapshot = converters.envelopes.snapshot.convert(widgetSnapshot({ width: 4 })).orThrow();
    expect(handle.encode({ envelope: snapshot.envelope, details: { width: 4 } })).toFailWith(
      /test\.widget@1: encoder refused/i
    );
  });
});

describe('command handles', () => {
  interface IGrowParameters {
    readonly by: number;
  }

  const growSchema: JsonSchema.ISchemaValidator<IGrowParameters> = JsonSchema.object({
    by: JsonSchema.integer({ description: 'how much to grow by' })
  });

  function growHandle(): ReturnType<typeof createTaskCommandHandle> {
    return createTaskCommandHandle<IGrowParameters>({
      name: 'grow',
      parameters: growSchema,
      encode: (parameters: IGrowParameters): Result<JsonValue> => succeed({ by: parameters.by }),
      idempotency: 'source-key',
      conditional: true
    });
  }

  test('a registered command is reachable by name and reports its dispatch traits', () => {
    const registry: TaskKindRegistry = newRegistry();
    const handle: ITaskKindHandle<IWidgetDetails> = registry
      .register({ ...widgetDescriptor(), commands: [growHandle()] })
      .orThrow();
    expect(handle.commandNames).toEqual(['grow']);
    expect(handle.getCommand('grow')).toSucceedAndSatisfy((command) => {
      expect(command.idempotency).toBe('source-key');
      expect(command.conditional).toBe(true);
    });
  });

  test('an unregistered command name fails', () => {
    const registry: TaskKindRegistry = newRegistry();
    const handle: ITaskKindHandle<IWidgetDetails> = registry.register(widgetDescriptor()).orThrow();
    expect(handle.commandNames).toEqual([]);
    expect(handle.getCommand('grow')).toFailWith(/test\.widget@1: no command 'grow'/i);
  });

  test('validate runs the registered schema and re-encodes canonical parameters', () => {
    const command = growHandle();
    expect(command.validate({ by: 3 })).toSucceedWith({ by: 3 });
  });

  test('validate rejects parameters the schema does not admit', () => {
    const command = growHandle();
    expect(command.validate({ by: 'a lot' })).toFailWith(/command 'grow'/i);
    expect(command.validate({})).toFailWith(/command 'grow'/i);
  });

  test('validate surfaces an encoder failure under the command name', () => {
    const command = createTaskCommandHandle<IGrowParameters>({
      name: 'grow',
      parameters: growSchema,
      encode: (): Result<JsonValue> => fail('cannot encode'),
      idempotency: 'none',
      conditional: false
    });
    expect(command.validate({ by: 3 })).toFailWith(/command 'grow': cannot encode/i);
  });
});

describe('built-in kinds', () => {
  test('both built-ins register into a fresh registry', () => {
    const registry: TaskKindRegistry = newRegistry();
    expect(registry.register(trackedTaskDescriptor())).toSucceed();
    expect(registry.register(taskListDescriptor())).toSucceed();
    expect(registry.freeze()).toSucceedWith(2);
  });

  test('a registered tracked snapshot converts', () => {
    const registry: TaskKindRegistry = newRegistry();
    expect(registry.register(trackedTaskDescriptor())).toSucceed();
    expect(registry.convert(trackedSnapshot())).toSucceedAndSatisfy((snapshot) => {
      expect(snapshot.details).toEqual({});
    });
  });

  test('an empty command registry is supported', () => {
    const registry: TaskKindRegistry = newRegistry();
    const handle = registry.register(trackedTaskDescriptor()).orThrow();
    expect(handle.commandNames).toEqual([]);
  });
});
