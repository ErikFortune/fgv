/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { ITaskEnvelope } from '../types';

/**
 * The optional envelope fields a change can set or remove.
 * @public
 */
export type OptionalEnvelopeField = 'description' | 'parentId' | 'responsibility' | 'progress' | 'binding';

/**
 * New values for optional envelope fields. A key that is present replaces the field; present
 * with `undefined`, it removes it. A key that is absent leaves the field as it was.
 * @public
 */
export type OptionalEnvelopeChanges = { readonly [K in OptionalEnvelopeField]?: ITaskEnvelope[K] };

/**
 * An envelope with some optional fields replaced or removed, every other field carried over.
 * @remarks
 * Built field by field, so a removed field is absent — never present as `undefined` — and the
 * result has exactly the envelope's shape.
 * @public
 */
export function withEnvelopeFields(envelope: ITaskEnvelope, changes: OptionalEnvelopeChanges): ITaskEnvelope {
  const description = 'description' in changes ? changes.description : envelope.description;
  const parentId = 'parentId' in changes ? changes.parentId : envelope.parentId;
  const responsibility = 'responsibility' in changes ? changes.responsibility : envelope.responsibility;
  const progress = 'progress' in changes ? changes.progress : envelope.progress;
  const binding = 'binding' in changes ? changes.binding : envelope.binding;
  return {
    schemaVersion: envelope.schemaVersion,
    id: envelope.id,
    kind: envelope.kind,
    detailVersion: envelope.detailVersion,
    revision: envelope.revision,
    title: envelope.title,
    ...(description !== undefined ? { description } : {}),
    ...(parentId !== undefined ? { parentId } : {}),
    stopPolicy: envelope.stopPolicy,
    ...(responsibility !== undefined ? { responsibility } : {}),
    scopes: envelope.scopes,
    lifecycle: envelope.lifecycle,
    ...(progress !== undefined ? { progress } : {}),
    attention: envelope.attention,
    ...(binding !== undefined ? { binding } : {}),
    recovery: envelope.recovery,
    observation: envelope.observation,
    createdAt: envelope.createdAt,
    changedAt: envelope.changedAt
  };
}
