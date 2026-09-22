/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Converters as JsonConverters, JsonValue } from '@fgv/ts-json-base';
import { Converter, Converters, Result, captureResult, fail, failWithDetail, succeed } from '@fgv/ts-utils';
import {
  ITaskCommandDescriptor,
  ITaskCommandHandle,
  ITaskFailure,
  ITaskKindDescriptor,
  ITaskKindHandle,
  ITaskKindRegistry,
  ITaskSnapshot,
  TaskKind,
  TaskResult
} from '../types';

/**
 * Erases a typed {@link ITaskCommandDescriptor} into an {@link ITaskCommandHandle}.
 *
 * @remarks
 * This is the single point at which a command's parameter type leaves the type system,
 * and it leaves through a closure rather than a cast: `validate` captures the
 * descriptor's own schema and encoder, so the only way to produce canonical parameters
 * is to have passed that schema.
 * @public
 */
export function createTaskCommandHandle<P>(descriptor: ITaskCommandDescriptor<P>): ITaskCommandHandle {
  return {
    name: descriptor.name,
    idempotency: descriptor.idempotency,
    conditional: descriptor.conditional,
    validate: (parameters: unknown): Result<JsonValue> =>
      // `captureResult` because `encode` is host code: a descriptor whose encoder throws
      // must produce a failure, not escape the Result-valued boundary this handle
      // advertises. Same reasoning as the injected clock and ID factory.
      captureResult(() =>
        descriptor.parameters.convert(parameters).onSuccess((typed: P) => descriptor.encode(typed))
      )
        .onSuccess((encoded: Result<JsonValue>) => encoded)
        // The encoder's *output* is host data as much as its input was. Canonical
        // parameters are stored and deduplicated against, so an encoder returning
        // something unrepresentable must fail here rather than downstream.
        .onSuccess((encoded: JsonValue) => JsonConverters.jsonValue.convert(encoded))
        .withErrorFormat((message: string) => `command '${descriptor.name}': ${message}`)
  };
}

function _key(kind: TaskKind, detailVersion: number): string {
  return `${kind}@${detailVersion}`;
}

interface IRegistration {
  readonly kind: TaskKind;
  readonly detailVersion: number;
  /** Erased: validates unknown details through the registered converter and re-encodes them. */
  readonly details: Converter<JsonValue>;
  readonly commands: ReadonlyMap<string, ITaskCommandHandle>;
}

function _buildCommands(
  kind: TaskKind,
  handles: ReadonlyArray<ITaskCommandHandle>
): Result<ReadonlyMap<string, ITaskCommandHandle>> {
  const map: Map<string, ITaskCommandHandle> = new Map<string, ITaskCommandHandle>();
  for (const handle of handles) {
    if (map.has(handle.name)) {
      return fail(`${kind}: duplicate command '${handle.name}'`);
    }
    map.set(handle.name, handle);
  }
  return succeed(map);
}

/**
 * The default {@link ITaskKindRegistry}.
 *
 * @remarks
 * Heterogeneous registrations are stored as `Converter<JsonValue>` closures built with
 * `Converters.generic`, exactly as the agent-memory body registry stores its per-kind
 * converters. A `Converter<T>` is not structurally a `Converter<JsonValue>` — `map`
 * makes it invariant — so the generic wrapper is the type-safe bridge, and there is no
 * `any` and no cast anywhere on the path.
 * @public
 */
export class TaskKindRegistry implements ITaskKindRegistry {
  private readonly _registrations: Map<string, IRegistration>;
  private readonly _envelopeConverter: Converter<ITaskSnapshot>;
  private _frozen: boolean;

  private constructor(snapshot: Converter<ITaskSnapshot>) {
    this._registrations = new Map<string, IRegistration>();
    this._envelopeConverter = snapshot;
    this._frozen = false;
  }

  /**
   * Creates an empty registry. Each call returns an independent registry — this module
   * holds no shared mutable state and registers nothing at import.
   */
  public static create(snapshot: Converter<ITaskSnapshot>): Result<TaskKindRegistry> {
    return succeed(new TaskKindRegistry(snapshot));
  }

  /** {@inheritDoc ITaskKindRegistry.isFrozen} */
  public get isFrozen(): boolean {
    return this._frozen;
  }

  /** {@inheritDoc ITaskKindRegistry.register} */
  public register<T>(descriptor: ITaskKindDescriptor<T>): Result<ITaskKindHandle<T>> {
    const key: string = _key(descriptor.kind, descriptor.detailVersion);
    if (this._frozen) {
      return fail(`${key}: cannot register into a frozen registry`);
    }
    if (!Number.isSafeInteger(descriptor.detailVersion) || descriptor.detailVersion < 1) {
      return fail(`${key}: detail version must be a positive safe integer`);
    }
    if (this._registrations.has(key)) {
      return fail(`${key}: already registered`);
    }
    return _buildCommands(descriptor.kind, descriptor.commands ?? []).onSuccess((commands) => {
      const registration: IRegistration = {
        kind: descriptor.kind,
        detailVersion: descriptor.detailVersion,
        details: Converters.generic<JsonValue>((from: unknown) =>
          captureResult(() =>
            descriptor.details.convert(from).onSuccess((typed: T) => descriptor.encode(typed))
          )
            .onSuccess((encoded: Result<JsonValue>) => encoded)
            .onSuccess((encoded: JsonValue) => JsonConverters.jsonValue.convert(encoded))
        ),
        commands
      };
      this._registrations.set(key, registration);
      return succeed(this._createHandle(descriptor, registration));
    });
  }

  /** {@inheritDoc ITaskKindRegistry.has} */
  public has(kind: TaskKind, detailVersion: number): boolean {
    return this._registrations.has(_key(kind, detailVersion));
  }

  /** {@inheritDoc ITaskKindRegistry.freeze} */
  public freeze(): Result<number> {
    this._frozen = true;
    return succeed(this._registrations.size);
  }

  /** {@inheritDoc ITaskKindRegistry.convert} */
  public convert(snapshot: unknown): TaskResult<ITaskSnapshot> {
    const validated: Result<ITaskSnapshot> = this._envelopeConverter.convert(snapshot);
    if (validated.isFailure()) {
      return failWithDetail<ITaskSnapshot, ITaskFailure>(validated.message, {
        code: 'invalid',
        retry: 'after-host-action'
      });
    }
    const envelope: ITaskSnapshot['envelope'] = validated.value.envelope;
    const key: string = _key(envelope.kind, envelope.detailVersion);
    const registration: IRegistration | undefined = this._registrations.get(key);
    if (registration === undefined) {
      return failWithDetail<ITaskSnapshot, ITaskFailure>(`${key}: no registered task kind`, {
        code: 'unknown-kind-version',
        retry: 'after-host-action'
      });
    }
    return registration.details
      .convert(validated.value.details)
      .onSuccess((details: JsonValue) => succeed<ITaskSnapshot>({ envelope, details }))
      .withErrorFormat((message: string) => `${key}: ${message}`)
      .withFailureDetail<ITaskFailure>({ code: 'invalid', retry: 'after-host-action' });
  }

  private _createHandle<T>(
    descriptor: ITaskKindDescriptor<T>,
    registration: IRegistration
  ): ITaskKindHandle<T> {
    const key: string = _key(descriptor.kind, descriptor.detailVersion);
    const matches = (snapshot: { readonly envelope: ITaskSnapshot['envelope'] }): Result<true> => {
      if (
        snapshot.envelope.kind !== descriptor.kind ||
        snapshot.envelope.detailVersion !== descriptor.detailVersion
      ) {
        return fail(
          `${key}: handle cannot decode ${_key(snapshot.envelope.kind, snapshot.envelope.detailVersion)}`
        );
      }
      return succeed(true);
    };

    return {
      kind: descriptor.kind,
      detailVersion: descriptor.detailVersion,
      commandNames: Array.from(registration.commands.keys()),
      decode: (snapshot: ITaskSnapshot): Result<ITaskSnapshot<T>> =>
        matches(snapshot).onSuccess(() =>
          descriptor.details
            .convert(snapshot.details)
            .onSuccess((details: T) => succeed<ITaskSnapshot<T>>({ envelope: snapshot.envelope, details }))
            .withErrorFormat((message: string) => `${key}: ${message}`)
        ),
      encode: (snapshot: ITaskSnapshot<T>): Result<ITaskSnapshot> =>
        matches(snapshot).onSuccess(() =>
          // Validate before encoding, exactly as `decode` validates after. TypeScript
          // cannot stop a JS caller or an assertion handing over a `T` that violates the
          // converter's domain invariants, and an encoder that never re-checks would turn
          // that into a successful snapshot.
          //
          // The envelope gets the same treatment, through the registry's own snapshot
          // converter: `decode` receives an envelope that has already been validated,
          // whereas `encode` receives whatever the caller built. Returning that unchecked
          // would hand back a "successful" snapshot the common envelope converter rejects.
          captureResult(() =>
            descriptor.details
              .convert(snapshot.details)
              .onSuccess((validated: T) => descriptor.encode(validated))
          )
            .onSuccess((encoded: Result<JsonValue>) => encoded)
            .onSuccess((details: JsonValue) =>
              this._envelopeConverter.convert({ envelope: snapshot.envelope, details })
            )
            .withErrorFormat((message: string) => `${key}: ${message}`)
        ),
      getCommand: (name: string): Result<ITaskCommandHandle> => {
        const command: ITaskCommandHandle | undefined = registration.commands.get(name);
        return command === undefined ? fail(`${key}: no command '${name}'`) : succeed(command);
      }
    };
  }
}
