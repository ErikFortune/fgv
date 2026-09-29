/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 *
 * Mutation matrix for the T3 storage protections (`src/packlets/storage`, plus the storage and
 * capacity converters).
 *
 * Deliberately NOT a jest test. Each row neuters one protection, rebuilds, runs the storage and
 * capacity suites, records how many tests went red, and restores the file. It takes the better
 * part of an hour and edits source in place, so it runs on demand and its output is pasted into
 * the stream's `result.md`.
 *
 *   node perf/mutationMatrix.js [--check] [--pkg <dir>] [--out <file.json>] [M1 M2 ...]
 *
 *   --check   only confirm every pattern occurs exactly once in the current source; no builds
 *   --pkg     run against a copy of this package instead of the package itself (recommended:
 *             the run edits source, so a copy keeps the working tree clean while it runs; give
 *             the copy a `node_modules` symlink to this package's)
 *   --out     write the results as JSON
 *   M…        run only the named rows (T8b's rows are named T8b-…, T9's T9-…, I1a's I1a-…)
 *
 * The one rule that matters: a row whose pattern is not found exactly once, or whose mutant does
 * not build, is reported UNVERIFIED — never as "nothing went red". A mutation that silently fails
 * to apply looks exactly like a protection nothing depends on (F2's lesson, on its two flushes).
 * A row that builds and leaves every test green is reported `0 red`, and is a finding: either the
 * protection is untested or it is not load-bearing.
 *
 * When a refactor moves a protected line, re-point its row here rather than deleting it; `--check`
 * lists the rows that have gone stale.
 */

/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const S = 'src/packlets/storage/';
const C = 'src/packlets/converters/';

/** The suites a row runs: the storage and capacity suites unless the row names others. */
const STORAGE = 'storage|capacity';

function m(name, file, from, to, tests = STORAGE) {
  return { name, edits: [{ file, from, to }], tests };
}

/**
 * A row for a guard that a later layer deliberately backs up: reverting the guard alone is masked by
 * construction, so the row reverts the guard **and** its backstop, and names both. The backstop has
 * its own single-edit row.
 */
function paired(name, edits, tests = STORAGE) {
  return { name, edits, tests };
}

/** T8b's rows run these suites: the saturation journeys live in delivery. */
const T8B = 'storage|capacity|delivery/(saturation|lifetime)';
const T = 'src/packlets/types/';

const MUTATIONS = [
  m(
    'M1 skip the pending-inventory write',
    S + 'repository.ts',
    'this._files.write(manifestName, manifestEncoded.text, operationId).onSuccess(() => {',
    'ok(true).onSuccess(() => {'
  ),
  m(
    'M2 mark live before writing the record',
    S + 'repository.ts',
    "        (writeRecord\n          ? this._files\n              .write(recordName('task', taskId), built.encoded.text, operationId)\n              .onSuccess(() => this._files.relist(operationId))",
    "        (writeRecord\n          ? this._files\n              .write(manifestName, manifestEncoded.text, operationId)\n              .onSuccess(() => this._files.write(recordName('task', taskId), built.encoded.text, operationId))\n              .onSuccess(() => this._files.relist(operationId))"
  ),
  m(
    "M3 treat visibility 'unknown' as unchanged",
    S + 'committedFiles.ts',
    "    if (visibility === 'unchanged') {",
    "    if (visibility !== 'replaced') {"
  ),
  m(
    'M4 never fence (every failure treated as unchanged)',
    S + 'committedFiles.ts',
    "    if (visibility === 'unchanged') {",
    '    if (visibility.length > 0) {'
  ),
  m(
    'M5 no operation replay (precondition decides)',
    S + 'repository.ts',
    '      if (operationId !== undefined) {\n        const stored',
    "      if (operationId === ('never' as OperationId)) {\n        const stored"
  ),
  m(
    'M6 drop the operation-superset check',
    S + 'commitRules.ts',
    "      return fail(`operation '${op.operationId}' is dedup evidence and cannot be dropped`);",
    '      continue;'
  ),
  m(
    'M7 skip the flush-boundary rewrite on replay',
    S + 'committedFiles.ts',
    '    return this.write(name, read.encoded.text, operationId)\n      .onSuccess(() => this.encodeManifest(this._manifest))\n      .onSuccess((encoded) => this.write(manifestName, encoded.text, operationId));',
    '    return ok<true>(true);'
  ),
  m(
    'M8 double-charge on pending -> live',
    S + 'repository.ts',
    "                [taskKey(taskId), recordEntry],\n                ['repository', manifestEntry(manifestEncoded.bytes, profile)]",
    "                [taskKey(taskId), recordEntry],\n                [`again:${taskId}`, recordEntry],\n                ['repository', manifestEntry(manifestEncoded.bytes, profile)]"
  ),
  m(
    'M9 no strict UTF-8 in durable mode',
    S + 'recordStore.ts',
    "return succeed(new RecordStore(root, guarantee, guarantee !== 'session'));",
    'return succeed(new RecordStore(root, guarantee, false));'
  ),
  m(
    'M10 initialize adopts a non-empty root',
    S + 'openRepository.ts',
    '    if (acquired.names.length > 0) {\n      return refuse(',
    '    if (acquired.names.length > 999999) {\n      return refuse('
  ),
  m(
    'M11 durable accepted on a session-only root',
    S + 'recordStore.ts',
    'if (!capabilities.atomicReplace || !capabilities.guarantees.includes(guarantee)) {',
    'if (!capabilities.atomicReplace) {'
  ),
  m(
    'M12 ledger ignores pending-entry claims',
    S + 'projection.ts',
    '  return ledgerEntry(entry.id, used, entry.capacityClaims, recordLimit);',
    '  return ledgerEntry(entry.id, used, [], recordLimit);'
  ),
  m(
    'M13 in-place lowering allowed',
    S + 'repository.ts',
    '    if (lowered.length > 0) {',
    '    if (lowered.length > 999999) {'
  ),
  m(
    'M14 archive does not consume the closeout claim',
    S + 'repository.ts',
    "claims = spendClaim(claims, 'terminal-closeout', growth, true);",
    "claims = spendClaim(claims, 'terminal-closeout', growth, false);"
  ),
  m(
    'M15 admission never refuses on a limit',
    S + 'ledger.ts',
    '        if (committedAfter > limits[dimension]) {',
    '        if (committedAfter > Number.MAX_SAFE_INTEGER) {'
  ),
  m(
    'M16 open does not complete a pending entry whose record landed',
    S + 'openRepository.ts',
    '      completed.push(taskId);',
    '      pending.set(taskId, entry);'
  ),
  m(
    'M17 open does not reclaim interrupted working files',
    S + 'recordStore.ts',
    '    return this.root.cleanupAtomicTemporaries();',
    '    return succeed<ReadonlyArray<string>>([]);'
  ),
  m(
    'M18 terminal state not absorbing',
    S + 'commitRules.ts',
    '    isTerminalTaskStatus(previous.lifecycle.status) &&\n    !canonicallyEqual(previous.lifecycle, next.lifecycle)',
    "    isTerminalTaskStatus(previous.lifecycle.status) &&\n    previous.id === ('never' as TaskId)"
  ),
  m(
    'M19 committed updates mutable',
    S + 'commitRules.ts',
    "      return fail(`update '${update.id}' is immutable once committed`);",
    '      byId.delete(update.id);\n      continue;'
  ),
  m(
    'M20 a write failure is ignored (success before the boundary)',
    S + 'repository.ts',
    "          .onSuccess(() => this._writeFile(recordName('task', taskId), built.encoded.text, operationId))\n          .onSuccess(() => {\n            this._cache.delete(taskId);",
    "          .onSuccess(() => {\n            this._writeFile(recordName('task', taskId), built.encoded.text, operationId);\n            return ok<true>(true);\n          })\n          .onSuccess(() => {\n            this._cache.delete(taskId);"
  ),
  m(
    'M21 first resolution may change catalog metadata',
    S + 'commitRules.ts',
    '    if (!canonicallyEqual(_catalog(reference), _catalog(next))) {',
    "    if (!canonicallyEqual(_catalog(reference), _catalog(next)) && reference.id === ('never' as TaskId)) {"
  ),
  m(
    'M22 open accepts a pending entry whose record carries other claims',
    S + 'openRepository.ts',
    '      if (!sameClaims || sameCreation.isFailure()) {',
    '      if (sameCreation.isFailure()) {'
  ),
  m(
    'M23 per-task operations: no closeout holdback',
    S + 'repository.ts',
    '    if (count <= limit - heldBack) {',
    '    if (count <= limit) {'
  ),
  m(
    'M24 observation replay ignores a differing projection',
    S + 'repository.ts',
    '          if (!canonicallyEqual(semantic(current), semantic(draft))) {',
    '          if (semantic(current) === undefined) {'
  ),
  m(
    'M25 profile admits a per-task operation limit below creation + closeout',
    C + 'capacityConverters.ts',
    'return value.perOwner.maxOperationsPerTask < held + 1',
    'return value.perOwner.maxOperationsPerTask < 0'
  ),
  m(
    'M26 raiseCapacityLimits skips admission',
    S + 'repository.ts',
    ".admit(new Map([['repository', manifestEntry(encoded.bytes, profile)]]), profile)",
    '.admit(new Map(), profile)'
  ),
  m(
    'M27 pending completion ignores the creation request',
    S + 'openRepository.ts',
    '      if (!sameClaims || sameCreation.isFailure()) {',
    '      if (!sameClaims) {'
  ),
  m(
    'M28 registration replay finds any operation by id',
    S + 'repository.ts',
    '        sameOperation(record.operations[0], offered) && firstRecordType(record) === identity.recordType;',
    '        record.operations.some((op) => sameOperation(op, offered)) && firstRecordType(record) === identity.recordType;'
  ),
  m(
    'M29 read-back compares revision only',
    S + 'committedFiles.ts',
    '            if (fingerprintOf(text) !== projection.fingerprint) {',
    "            if (fingerprintOf(text) === 'never') {"
  ),
  m(
    'M30 registry freeze result ignored',
    S + 'openRepository.ts',
    '    if (frozen.isFailure()) {\n      ownership.value.release();',
    "    if (frozen.isFailure() && frozen.message === 'never') {\n      ownership.value.release();"
  ),
  m(
    'M31 pending entries count as live parents',
    S + 'openRepository.ts',
    "    manifest.tasks.filter((entry) => entry.state === 'live').map((entry) => entry.id)",
    '    manifest.tasks.map((entry) => entry.id)'
  ),
  m(
    'M32 unresolved read skips quarantine',
    S + 'repository.ts',
    '        return this._registry.has(reference.kind, reference.detailVersion)\n          ? ok<',
    '        return true\n          ? ok<'
  ),
  m(
    'M33 list drops directories',
    S + 'recordStore.ts',
    '      return succeed(children.map((child) => child.name));',
    '      return succeed(Array.from(files.keys()));'
  ),
  m(
    'M34 open skips per-value bounds',
    S + 'openRepository.ts',
    '      checkBounds(record, profile)\n        .onSuccess(() => checkOperationCount(record, profile))',
    '      succeed<true>(true)\n        .onSuccess(() => checkOperationCount(record, profile))'
  ),
  m(
    'M35 replay identity omits the catalog operation name',
    S + 'commitRules.ts',
    "    operation: op.type === 'catalog' ? op.operation : undefined,",
    '    operation: undefined,'
  ),
  m(
    'M36 bounds not re-checked after normalization',
    S + 'repository.ts',
    '      const rebounded: Result<true> = checkBounds(normalized, this.profile);',
    "      const rebounded: Result<true> = [succeed<true>(true), fail<true>('x')][0];"
  ),
  m(
    'M37 a resolved record may carry no operations',
    C + 'storageConverters.ts',
    '  if (value.operations.length < 1) {\n    return fail(`task ${envelope.id}: a record carries',
    '  if (value.operations.length < 0) {\n    return fail(`task ${envelope.id}: a record carries'
  ),
  m(
    'M38 operation identity omits the principal',
    S + 'commitRules.ts',
    '    principalKey: op.principalKey,\n',
    ''
  ),
  m(
    'M39 open does not validate record claims',
    S + 'openRepository.ts',
    '    if (claimed.isFailure()) {',
    "    if (claimed.isFailure() && taskId === ('never' as TaskId)) {"
  ),
  m(
    'M40 open does not validate pending-entry claims',
    S + 'openRepository.ts',
    '        if (pendingClaims.isFailure()) {',
    "        if (pendingClaims.isFailure() && taskId === ('never' as TaskId)) {"
  ),
  m(
    'M41 pending join by claim ids only',
    S + 'openRepository.ts',
    "      const sameClaims: boolean = canonicallyEqual(\n        withOwnership(entry.capacityClaims, 'live'),\n        record.capacityClaims\n      );",
    "      const sameClaims: boolean = canonicallyEqual(\n        withOwnership(entry.capacityClaims, 'live').map((c) => c.claimId),\n        record.capacityClaims.map((c) => c.claimId)\n      );"
  ),
  m(
    'M42 registration replay rewrites a quarantined record',
    S + 'repository.ts',
    '      if (!live.known) {',
    "      if (!live.known && taskId === ('never' as TaskId)) {"
  ),
  m(
    'M43 any purpose may resolve a task',
    S + 'commitRules.ts',
    "    if (purpose !== 'observation') {\n      return fail(`first resolution",
    "    if (purpose === ('never' as string)) {\n      return fail(`first resolution"
  ),
  m(
    'M44 source revision may move outside observations',
    S + 'commitRules.ts',
    "  if (purpose !== 'observation' && !canonicallyEqual(current.sourceRevision, draft.sourceRevision)) {",
    "  if (purpose === ('never' as string) && !canonicallyEqual(current.sourceRevision, draft.sourceRevision)) {"
  ),
  m(
    'M45 maintenance may change semantic state',
    S + 'commitRules.ts',
    "  if (purpose === 'maintenance' && !canonicallyEqual(_semantic(current), _semantic(draft))) {",
    "  if (purpose === 'maintenance' && _semantic(current) === undefined) {"
  ),
  m(
    'M46 pending manifest growth not counted',
    S + 'repository.ts',
    "              [taskKey(taskId), pendingEntry(entry, taskRecordLimit(profile))],\n              ['repository', manifestEntry(manifestEncoded.bytes, profile)]",
    '              [taskKey(taskId), pendingEntry(entry, taskRecordLimit(profile))]'
  ),
  m(
    'M47 profile fit ignores the per-record bound',
    C + 'capacityConverters.ts',
    "      charge.dimension === 'record-bytes'\n        ? Math.min(",
    "      charge.dimension === ('never' as string)\n        ? Math.min("
  ),
  m(
    'M48 registration may overwrite an unnamed record file',
    S + 'repository.ts',
    '    return listed.value.includes(name)\n      ? taskFailure(',
    "    return listed.value.includes('never')\n      ? taskFailure("
  ),
  m(
    'M49 a claim may omit a bundle dimension',
    S + 'claims.ts',
    '    if (!claim.charges.some((c) => c.dimension === max.dimension)) {',
    '    if (!claim.charges.some((c) => c.dimension === max.dimension) && max.amount < 0) {'
  ),
  m(
    'M50 open accepts any first operation',
    S + 'openRepository.ts',
    '    const bounded: Result<IStoredCatalogOperation> = checkCreationEvidence(record).onSuccess((creation) =>',
    '    const bounded: Result<IStoredCatalogOperation> = succeed(\n      record.operations[0] as IStoredCatalogOperation\n    ).onSuccess((creation) =>'
  ),
  m(
    'M51 an observation may change the catalog or archive',
    S + 'commitRules.ts',
    "  if (purpose === 'observation') {\n",
    "  if (purpose === ('never' as string)) {\n"
  ),
  m(
    'M52 a pending retry matches on id and request only',
    S + 'repository.ts',
    '      if (!canonicallyEqual(pendingIdentity(pending), identity)) {',
    '      if (!canonicallyEqual(pendingIdentity(pending).request, identity.request)) {'
  ),
  m(
    'M53 a replay may report uncommitted operations',
    S + 'repository.ts',
    '          if (offered === undefined || !sameOperation(stored, offered) || !allCommitted) {',
    '          if (offered === undefined || !sameOperation(stored, offered)) {'
  ),
  m(
    'M54 the manifest is rewritten without checking it',
    S + 'committedFiles.ts',
    '    if (fingerprintOf(text.value) === this._fingerprint) {',
    '    if (fingerprintOf(text.value).length > 0) {'
  ),
  m(
    'M55 any task may hold a first-resolution claim',
    S + 'claims.ts',
    "  if (claim.purpose === 'first-resolution' && !expected.external) {",
    "  if (claim.purpose === 'first-resolution' && !expected.external && expected.archived && !expected.archived) {"
  ),
  m(
    'M56 registration replay ignores the first-record type',
    S + 'repository.ts',
    '        sameOperation(record.operations[0], offered) && firstRecordType(record) === identity.recordType;',
    '        sameOperation(record.operations[0], offered);'
  ),
  m(
    'M57 pending entries without a record are not checked',
    S + 'openRepository.ts',
    '        const pendingClaims: Result<true> = checkPendingIdentity(entry, profile).onSuccess(() =>',
    '        const pendingClaims: Result<true> = succeed<true>(true).onSuccess(() =>'
  ),
  m(
    'M58 a resumed registration overwrites an appeared file',
    S + 'repository.ts',
    '    if (landed.isFailure()) {\n      return taskFailure(',
    '    if (landed.isFailure()) {\n      if (name.length > 0) {\n        return this._writeRegistration(taskId, operationId, draft, entry);\n      }\n      return taskFailure('
  ),
  m(
    'M59 first resolution may archive',
    S + 'commitRules.ts',
    '    return draft.archived\n      ? fail(`an observation cannot archive a task; that takes a catalog operation`)',
    '    return draft.archived && !draft.archived\n      ? fail(`an observation cannot archive a task; that takes a catalog operation`)'
  ),
  m(
    'M60 open completion does not re-check the manifest',
    S + 'openRepository.ts',
    '  if (current.value !== scanned.text) {',
    "  if (current.value === ('never' as string)) {"
  ),
  m(
    'M61 a durable claim ignores session holders of the path',
    S + 'rootOwnership.ts',
    '  if (itemOwners.has(root) || durablePaths.has(path) || (durable && sessions > 0)) {',
    '  if (itemOwners.has(root) || (!durable && durablePaths.has(path))) {'
  ),
  m(
    'M62 a resumed registration never completes a landed record',
    S + 'repository.ts',
    '    if (!listed.value.includes(name)) {\n      return this._writeRegistration(taskId, operationId, draft, entry);',
    '    if (!listed.value.includes(name) || name.length > 0) {\n      return this._writeRegistration(taskId, operationId, draft, entry);'
  ),
  m(
    'M63 a throwing identity callback escapes',
    S + 'failures.ts',
    '  return captureResult(() => environment.newId()).onSuccess((minted) => minted);',
    '  return environment.newId();'
  ),
  m(
    'M64 close releases the root under an active writer',
    S + 'repository.ts',
    "    if (this._writer !== undefined) {\n      return taskFailure('close: a writer",
    "    if (this._writer === ('never' as unknown)) {\n      return taskFailure('close: a writer"
  ),
  m(
    'M65 an unresolved record may carry extra operations',
    C + 'storageConverters.ts',
    '  if (value.operations.length !== 1) {',
    '  if (value.operations.length < 1) {'
  ),
  m(
    'M66 a replacement may reorder the creation operation',
    S + 'commitRules.ts',
    '  if (next[0].operationId !== current[0].operationId) {',
    "  if (next[0].operationId === ('never' as string)) {"
  ),
  m(
    'M67 open ignores the per-task operation limit',
    S + 'openRepository.ts',
    '        .onSuccess(() => checkOperationCount(record, profile))\n',
    ''
  ),
  m(
    'M68 open completion accepts a later record revision',
    S + 'openRepository.ts',
    '        record.recordRevision !== 1\n          ? fail<true>',
    '        record.recordRevision === -1\n          ? fail<true>'
  ),
  m(
    'M69 raising a profile leaves existing record limits stale',
    S + 'ledger.ts',
    '      this._entries.set(key, { ...entry, recordLimit: recordLimitOf(key) });',
    '      this._entries.set(key, { ...entry, recordLimit: recordLimitOf(key) > 0 ? entry.recordLimit : 0 });'
  ),
  m(
    'M70 commit purpose and operation id are trusted',
    S + 'repository.ts',
    '          this._commitKind\n            .convert(request)\n            .onSuccess((converted) =>',
    "          (this._commitKind ? succeed<ICommitKind>(request as unknown as ICommitKind) : fail<ICommitKind>('x'))\n            .onSuccess((converted) =>"
  ),
  m(
    'M71 claim minting bypasses the captured host id',
    S + 'claims.ts',
    '  const mint = (): Result<CapacityClaimId> => mintId(environment).onSuccess(',
    '  const mint = (): Result<CapacityClaimId> => (true ? environment.newId() : mintId(environment)).onSuccess('
  ),
  m(
    'M72 initialize bypasses the captured host id',
    S + 'openRepository.ts',
    '          mintId(params.environment)',
    '          (true ? params.environment.newId() : mintId(params.environment))'
  ),
  m(
    'M73 the first-record type ignores a first-resolution claim',
    S + 'commitRules.ts',
    "    record.capacityClaims.some((c) => c.purpose === 'first-resolution')\n",
    '    false\n'
  ),
  m(
    'M74 open holds no operations back for closeout',
    S + 'commitRules.ts',
    '  const held: number = archived ? 0 : terminal ? 1 : 2;',
    '  const held: number = (archived ? 0 : terminal ? 1 : 2) * 0;'
  ),
  m(
    'M75 a pending entry may name a non-creation operation',
    S + 'commitRules.ts',
    '  if (!creations.has(entry.operation)) {',
    '  if (!creations.has(entry.operation) && entry.operation.length < 0) {'
  ),
  m(
    'M76 a pending unresolved entry may name any creation',
    S + 'commitRules.ts',
    "  if (entry.recordType === 'unresolved' && entry.operation !== 'register-external') {",
    "  if (entry.recordType === 'unresolved' && entry.operation.length < 0) {"
  ),
  m(
    'M77 a pending request is not bounded at open',
    S + 'commitRules.ts',
    '    encoded.bytes > profile.encoded.maxOperationRequestBytes\n      ? fail<true>(\n          `the pending request',
    '    encoded.bytes < 0\n      ? fail<true>(\n          `the pending request'
  ),
  m(
    'M78 open treats every record as externally registered',
    S + 'openRepository.ts',
    "        external: bounded.value.operation === 'register-external',",
    '        external: bounded.value.operation.length > 0,'
  ),
  m(
    'M79 open treats every pending entry as externally registered',
    S + 'openRepository.ts',
    "              external: entry.operation === 'register-external',",
    '              external: entry.operation.length > 0,'
  ),
  m(
    'M80 open completion ignores a failed manifest re-read',
    S + 'openRepository.ts',
    '  if (current.isFailure()) {\n    return taskFailure(\n      `open: ${manifestName} cannot be re-read',
    "  if (current.isFailure() && current.message === 'never') {\n    return taskFailure(\n      `open: ${manifestName} cannot be re-read"
  ),
  m(
    'M81 a resume finishes over a landed record at a later revision',
    S + 'repository.ts',
    '            record.recordRevision === 1 &&',
    '            record.recordRevision > 0 &&'
  ),
  m(
    "M82 a resume ignores the landed record's identity",
    S + 'repository.ts',
    '            canonicallyEqual(registrationIdentity(record, creation), pendingIdentity(entry)) &&\n            canonicallyEqual(record.capacityClaims',
    '            creation !== undefined &&\n            canonicallyEqual(record.capacityClaims'
  ),
  m(
    "M83 a resume ignores the landed record's claims",
    S + 'repository.ts',
    "            canonicallyEqual(record.capacityClaims, withOwnership(entry.capacityClaims, 'live'))\n              ? succeed<IReadRecord>",
    '            record.capacityClaims !== undefined\n              ? succeed<IReadRecord>'
  ),
  m(
    'M84 registration replay ignores the principal',
    S + 'repository.ts',
    '        principalKey: identity.principalKey,',
    '        principalKey: (record.operations[0] as IStoredCatalogOperation).principalKey,'
  ),
  m(
    'M85 ownership ignores the item that already holds the root',
    S + 'rootOwnership.ts',
    '  if (itemOwners.has(root) || durablePaths.has(path) || (durable && sessions > 0)) {',
    '  if ((itemOwners.has(root) && durable && !durable) || durablePaths.has(path) || (durable && sessions > 0)) {'
  ),
  m(
    'M86 a session claim ignores a durable holder of the path',
    S + 'rootOwnership.ts',
    '  if (itemOwners.has(root) || durablePaths.has(path) || (durable && sessions > 0)) {',
    '  if (itemOwners.has(root) || (durable && durablePaths.has(path)) || (durable && sessions > 0)) {'
  ),
  m(
    'M87 release leaks a session holder of the path',
    S + 'rootOwnership.ts',
    '      } else {\n        sessionPaths.delete(path);\n      }',
    '      } else {\n        sessionPaths.set(path, remaining + 1);\n      }'
  ),
  m(
    "M88 a commit's operation id is not validated",
    S + 'repository.ts',
    '        operationId: state.converters.ids.operationId\n',
    '        operationId: Converters.string as unknown as Converter<OperationId>\n'
  ),
  m(
    'M89 the manifest is limited as a task record',
    S + 'projection.ts',
    "  if (key === 'repository') {",
    "  if (key === 'never') {"
  ),
  m(
    'M90 a consumer record is limited as a task record',
    S + 'projection.ts',
    "  if (key.startsWith('consumer:')) {",
    "  if (key.startsWith('never:')) {"
  ),
  m(
    'M91 a source record is limited as a task record',
    S + 'projection.ts',
    "  if (key.startsWith('source:')) {",
    "  if (key.startsWith('never:')) {"
  ),
  m(
    'M92 a raised profile does not reach status',
    S + 'ledger.ts',
    '    this._profile = profile;\n    for (const [key',
    '    this._profile = this._profile ?? profile;\n    for (const [key'
  ),

  // ---- T8b: the derived update maximum, the raised profile, and what the saturation journeys prove.
  m(
    'T8b-1 reservations use maxUpdateBytes again',
    T + 'capacityProfile.ts',
    '    .onSuccess((derived) => succeed(Math.min(derived, profile.encoded.maxUpdateBytes)))',
    '    .onSuccess(() => succeed(profile.encoded.maxUpdateBytes))',
    T8B
  ),
  m(
    'T8b-2 the per-record ceiling caps the consumer bound at 8 MiB',
    T + 'capacityProfile.ts',
    "  'record-bytes': 32 * MiB,",
    "  'record-bytes': 8 * MiB,",
    T8B
  ),
  m(
    'T8b-3 reclaimableByCleanup is static per dimension',
    S + 'ledger.ts',
    "      if (key.startsWith('task:') && entry.reserved[dimension] > 0) {",
    "      if (key === 'never' && entry.reserved[dimension] > 0) {",
    T8B
  ),
  m(
    'T8b-4 archive keeps its closeout remainder reserved',
    S + 'repository.ts',
    "        claims = spendClaim(claims, 'terminal-closeout', growth, true);",
    "        claims = spendClaim(claims, 'terminal-closeout', growth, false);",
    T8B
  ),
  m(
    "T8b-5 a subscription's baselines are not charged",
    S + 'subscriptions.ts',
    "  used['resident-payload-bytes'] = state.baselineBytes;",
    "  used['resident-payload-bytes'] = 0;",
    T8B
  ),
  m(
    'T8b-6 a pending registration holds no reservation',
    S + 'projection.ts',
    '  return ledgerEntry(entry.id, used, entry.capacityClaims, recordLimit);',
    '  return ledgerEntry(entry.id, used, [], recordLimit);',
    T8B
  ),
  m(
    'T8b-7 a raise may grow what existing reservations cover',
    S + 'graphRules.ts',
    '    grown.length === 0',
    '    grown.length >= 0',
    T8B
  ),
  m(
    'T8b-8 a landed activation freezes nothing',
    S + 'repository.ts',
    '    const frozen: SubscriptionId | undefined = this._records.frozenBy(before, next);',
    '    const frozen: SubscriptionId | undefined = undefined;',
    T8B
  )
];

/** T9's rows run the stop suites, and the storage-converter suite for the record invariants. */
const T9 = 'broker/stop|storage/stop|converters/storage';
const B = 'src/packlets/broker/';

const T9_ROWS = [
  m(
    'T9-1 a new intent need not be the authoritative subtree (a skipped child)',
    S + 'stopRules.ts',
    '    return canonicallyEqual(ids, captured)',
    '    return canonicallyEqual(captured, captured)',
    T9
  ),
  m(
    'T9-2 the broker captures all but the last descendant',
    B + 'stopRequests.ts',
    '    for (const target of subtree.value) {',
    '    for (const target of subtree.value.slice(0, -1)) {',
    T9
  ),
  m(
    'T9-3 storage lets a latched task move out of the stopped set',
    S + 'stopRules.ts',
    'latchRefusesMove(latches, from, to)',
    'latchRefusesMove([], from, to)',
    T9
  ),
  m(
    'T9-4 storage registers a child under a latched parent',
    S + 'stopRules.ts',
    '  return parentId !== undefined && book.isLatched(parentId)',
    "  return parentId !== undefined && book.isLatched('' as TaskId)",
    T9
  ),
  m(
    'T9-5 storage lets a latched list complete',
    S + 'stopRules.ts',
    "op.operation === 'complete-list' && latches.length > 0",
    "op.operation === 'complete-list' && latches.length < 0",
    T9
  ),
  m(
    'T9-6 a marked command need not be a live attempt (dispatch after release)',
    S + 'stopRules.ts',
    "          return fail(`command '${op.operationId}' is not a live attempt of stop ${op.stop.intentId}`);",
    '          continue;',
    T9
  ),
  m(
    'T9-7 a new external command is recorded under a latch',
    S + 'stopRules.ts',
    "external && latches.length > 0 && op.dispatch !== 'settled'",
    "external && latches.length < 0 && op.dispatch !== 'settled'",
    T9
  ),
  m(
    'T9-8 a command recorded before the latch is sent under it',
    S + 'stopRules.ts',
    "      op.dispatch === 'possibly-sent' &&\n      latches.length > 0",
    "      op.dispatch === 'possibly-sent' &&\n      latches.length < 0",
    T9
  ),
  m(
    'T9-9 an intent may be dropped',
    S + 'stopRules.ts',
    '  if (after.length < before.length) {',
    '  if (after.length < 0) {',
    T9
  ),
  m(
    'T9-10 storage archives a latched task',
    S + 'stopRules.ts',
    '  return standing === undefined',
    '  return standing === undefined || taskId.length > 0',
    T9
  ),
  m(
    'T9-11 (M3) any observation is exempt from the freeze, native too',
    S + 'stopRules.ts',
    "  if (purpose === 'observation' && external) {",
    "  if (purpose === 'observation') {",
    T9
  ),
  m(
    'T9-12 (A3) a stop reserves nothing for its attempts',
    S + 'stopLedger.ts',
    "      bundle[dimension] * (dimension === 'record-bytes' ? facts.unlandedOn : facts.unlandedOf);",
    "      0 * bundle[dimension] * (dimension === 'record-bytes' ? facts.unlandedOn : facts.unlandedOf);",
    T9
  ),
  m(
    "T9-13 (A3) a target's operation slot is not preflighted",
    S + 'stopAdmission.ts',
    '    if (facts.unlandedOn + facts.latching > was.unlandedOn + was.latching) {',
    '    if (facts.unlandedOn < 0) {',
    T9
  ),
  m(
    'T9-14 (A3) the committed task holds no slot for its attempts and release',
    S + 'repository.ts',
    '(archived ? 0 : terminal ? 1 : 2) + stop.value.held',
    '(archived ? 0 : terminal ? 1 : 2) + 0 * stop.value.held',
    T9
  ),
  m(
    'T9-15 reopen derives no stop reservation',
    S + 'openRepository.ts',
    '  for (const taskId of holders) {',
    '  for (const taskId of holders.slice(holders.length)) {',
    T9
  ),
  m(
    'T9-16 the index feeds no stop content to the latch book',
    S + 'taskIndex.ts',
    '      this.stops.put(id, stop);',
    '      this.stops.put(id, undefined);',
    T9
  ),
  m(
    'T9-17 two stops may share an attempt key',
    S + 'taskIndex.ts',
    '      const collision: string | undefined = this.stops.collision(id, stop);',
    '      const collision: string | undefined = undefined;',
    T9
  ),
  m(
    'T9-18 (H1) findings under a moved policy count as revalidated',
    B + 'stopPump.ts',
    '    if (!ctx.epochIs(epoch)) {\n      return ok({ intent: now, fresh: false });',
    '    if (!ctx.epochIs(epoch)) {\n      return ok({ intent: now, fresh: true });',
    T9
  ),
  m(
    'T9-19 (M1) a freeze refusal names the stop root',
    B + 'catalogOperations.ts',
    '`stop-active: task ${taskId} is under a stop latch; ${what}`',
    '`stop-active: task ${taskId} is under a stop latch of ${core.repository.stopLatches(taskId)[0]?.rootId}; ${what}`',
    T9
  ),
  m(
    'T9-20 (M2) a capacity refusal at acceptance is returned as storage gave it',
    B + 'stopRequests.ts',
    '  if (capacity === undefined || capacity.recordId === undefined) {',
    '  if (capacity === undefined || capacity.dimension !== undefined) {',
    T9
  ),
  m(
    'T9-21 (M4) abandoning a stop command drops its marker',
    B + 'disposition.ts',
    '      ...(command.stop !== undefined ? { stop: command.stop } : {})',
    '      ...(command.stop !== undefined ? {} : {})',
    T9
  ),
  m(
    'T9-22 (L1) a violation not yet re-confirmed does not block',
    B + 'stopPump.ts',
    "return isStopBlocker(target.state) || (target.violation !== undefined && target.state !== 'confirmed');",
    'return isStopBlocker(target.state);',
    T9
  ),
  m(
    'T9-23 (L2) a dispatch-boundary denial is not re-attempted',
    B + 'stopPump.ts',
    "          return this._supersede(i, 'denied');",
    "          return ok(this._with(i, 'denied'));",
    T9
  ),
  m(
    'T9-24 a bounded pass that did not visit every target can be satisfied',
    B + 'stopPump.ts',
    "  return complete && targets.every((target) => target.state === 'confirmed') ? 'satisfied' : 'pending';",
    "  return targets.every((target) => target.state === 'confirmed') ? 'satisfied' : 'pending';",
    T9
  ),
  m(
    'T9-25 no epoch recheck before a native stop write',
    B + 'stopPump.ts',
    '      // After the last await and immediately before the write.\n      if (!this._ctx.epochIs(this._epoch)) {',
    '      // After the last await and immediately before the write.\n      if (this._epoch.length < 0) {',
    T9
  ),
  // The broker's own check is backed by storage's forward-by-one rule (T9-66): a stale pass's
  // supersession is refused as a conflict, which ends the pass unfinished exactly as the check does.
  // Reverting the check alone is masked by that design, so this row reverts both.
  paired(
    'T9-26 an attempt another caller superseded is written anyway (with its storage backstop)',
    [
      {
        file: B + 'stopPump.ts',
        from: '        root.value.intent.targets[i].attempt === this.targets[i].attempt',
        to: '        root.value.intent.targets[i].attempt >= 0'
      },
      {
        file: S + 'stopRules.ts',
        from: '    if (b.attempt === a.attempt ? b.operationId !== a.operationId : b.attempt !== a.attempt + 1) {',
        to: '    if (b.attempt < 0) {'
      }
    ],
    T9
  ),
  m(
    'T9-27 a stop command whose intent no longer latches is still sent',
    B + 'externalCommands.ts',
    '      : latches.some((l) => l.rootId === marker.rootId && l.intentId === marker.intentId)',
    '      : latches.length === 0 || latches.some((l) => l.rootId === marker.rootId)',
    T9
  ),
  m(
    'T9-28 presentation never degrades a confirmed target that left the stopped set',
    B + 'stopRequests.ts',
    "      target.state === 'confirmed' &&",
    "      target.state === 'confirmed' && target.attempt < 0 &&",
    T9
  ),
  m(
    'T9-29 stable-stop evidence needs no revalidation by this broker instance',
    B + 'stopRequests.ts',
    "    : intent.state === 'satisfied' && unrevalidated",
    "    : intent.state === 'satisfied' && unrevalidated && degraded",
    T9
  ),
  m(
    'T9-30 a conflict is re-attempted without refreshing the precondition',
    B + 'stopPump.ts',
    "        if ((await observeTask(this._core, record.task.envelope.id)).isFailure()) {\n          return ok(this._with(i, 'refused'));\n        }\n",
    '',
    T9
  ),
  m(
    'T9-31 a terminal external target waits on its source',
    B + 'stopPump.ts',
    '    if (isTerminalTaskStatus(record.task.envelope.lifecycle.status)) {',
    "    if (isTerminalTaskStatus('running')) {",
    T9
  ),
  m(
    'T9-32 the broker does not pre-check the latch (storage refuses instead)',
    B + 'catalogOperations.ts',
    '  return core.repository.stopLatches(taskId).length === 0',
    '  return core.repository.stopLatches(taskId).length >= 0',
    T9
  ),
  m(
    "T9-33 a stop's command is sent under ordinary command authority",
    B + 'externalCommands.ts',
    '  return command.stop !== undefined',
    '  return command.request.command.length < 0',
    T9
  ),
  m(
    'T9-34 the largest reservation a bundle can derive is not checked',
    S + 'stopLedger.ts',
    "  return _safe(ceiling, 'stop reservation').onSuccess(() => succeed(bundle));",
    '  return succeed(bundle);',
    T9
  ),
  m(
    'T9-35 storage lets the summary record a target confirmed that is not stopped',
    S + 'stopRules.ts',
    "    if (b.state === 'confirmed' && !canonicallyEqual(a, b) && !confirmable(was.mode, b)) {",
    "    if (b.state === 'confirmed' && !canonicallyEqual(a, b) && b.attempt < 0) {",
    T9
  ),
  m(
    'T9-36 the summary records a confirmation the target no longer holds',
    B + 'stopPump.ts',
    "  return ok(record?.recordType === 'resolved' && targetStopped(mode, record) ? found : mine);",
    '  return ok(record === undefined ? mine : found);',
    T9
  ),
  m(
    'T9-37 a conflict is re-attempted when its refresh failed',
    B + 'stopPump.ts',
    '        if ((await observeTask(this._core, record.task.envelope.id)).isFailure()) {',
    '        if ((await observeTask(this._core, record.task.envelope.id)).isFailure() && record.archived) {',
    T9
  ),
  m(
    'T9-38 a command recorded before a latch is resent under it',
    B + 'externalCommands.ts',
    "    return latches.length > 0 ? 'held' : undefined;",
    "    return latches.length < 0 ? 'held' : undefined;",
    T9
  ),
  m(
    'T9-39 open accepts a latching stop that does not name its subtree',
    S + 'openRepository.ts',
    '        if (!canonicallyEqual(tree.orDefault([]), named)) {',
    '        if (!canonicallyEqual(named, named)) {',
    T9
  ),
  m(
    'T9-40 a raise may make every stop unreservable',
    S + 'graphRules.ts',
    '  if (stops.isFailure()) {',
    '  if (stops.isFailure() && profile.profileVersion < 0) {',
    T9
  ),
  m(
    'T9-41 initialize accepts a profile under which no stop can be reserved',
    S + 'openRepository.ts',
    '.onSuccess((profile) => stopAttemptBundle(profile).onSuccess(() => succeed(profile)))',
    '.onSuccess((profile) => succeed(profile))',
    T9
  ),
  m(
    "T9-42 a landed command is this stop's when only its intent id matches",
    B + 'stopPump.ts',
    '      op.stop?.rootId === this._intent.rootId &&',
    '      op.stop?.rootId !== undefined &&',
    T9
  ),
  m(
    'T9-43 an unvisited target overwrites newer progress in the summary',
    B + 'stopPump.ts',
    '  if (!visited || found.attempt !== mine.attempt) {',
    '  if (found.attempt !== mine.attempt) {',
    T9
  ),
  m(
    'T9-44 a bounded pass that learned nothing withdraws the verdict',
    B + 'stopPump.ts',
    '      state: learned ? _derive(targets, pass.complete, topologyHeld) : now.state',
    '      state: _derive(targets, pass.complete, topologyHeld)',
    T9
  ),
  m(
    'T9-45 an archived record may hold a latching stop',
    C + 'storageConverters.ts',
    '  if (standing !== undefined) {',
    '  if (standing !== undefined && standing.id.length < 0) {',
    T9
  ),
  m(
    'T9-46 an external target is confirmed without stable-stop evidence',
    S + 'stopAdmission.ts',
    '      target.stableSourceEvidence !== undefined)',
    '      target.attempt > 0)',
    T9
  ),
  m(
    'T9-47 a feed-confirmed command loses its stop marker',
    B + 'observations.ts',
    '      ...kept,\n      receipt: contradicted',
    "      type: 'command',\n      operationId: op.operationId,\n      request: op.request,\n      principalKey: op.principalKey,\n      dispatch: op.dispatch,\n      receipt: contradicted",
    T9
  ),
  m(
    "T9-48 a native key held by something else is taken as this stop's refusal",
    B + 'stopPump.ts',
    '    return this._isOwn(storedOperation(after, this.targets[i].operationId))',
    '    return this._isOwn(storedOperation(after, this.targets[i].operationId)) || !after.archived',
    T9
  ),
  m(
    "T9-49 a target's command key may be the stop's own operation id",
    C + 'stopConverters.ts',
    '    if (target.operationId === intent.id) {',
    '    if (target.operationId === intent.id && intent.id.length < 0) {',
    T9
  ),
  m(
    'T9-50 two stops of one record may share a command key',
    C + 'stopConverters.ts',
    '    if (shared !== undefined) {',
    '    if (shared !== undefined && intent.id.length < 0) {',
    T9
  ),
  m(
    'T9-51 a registration may carry a stop',
    S + 'stopRules.ts',
    "  if (draft.recordType === 'resolved' && (draft.stops ?? []).length > 0) {",
    "  if (draft.recordType === 'resolved' && (draft.stops ?? []).length < 0) {",
    T9
  ),
  m(
    'T9-52 free text is sized at three bytes per unit',
    S + 'stopLedger.ts',
    'const worstBytesPerUnit: number = 6;',
    'const worstBytesPerUnit: number = 3;',
    T9
  ),
  m(
    'T9-53 the resend gate does not recheck the latches',
    B + 'externalCommands.ts',
    '    return withheld !== undefined ? ok(withheld) : read;',
    '    return withheld !== undefined && epoch.length < 0 ? ok(withheld) : read;',
    T9
  ),
  m(
    "T9-54 storage lets a raw commit release a terminal root's cancel",
    S + 'stopRules.ts',
    "    if (was.mode === 'cancel' && confirmable(was.mode, was.targets[0])) {",
    "    if (was.mode === 'cancel' && confirmable(was.mode, was.targets[0]) && now.id.length < 0) {",
    T9
  ),
  m(
    'T9-55 storage settles a cancel from its summary alone',
    S + 'stopRules.ts',
    "      was.targets.every((target) => target.state === 'confirmed' && confirmable(was.mode, target));",
    "      was.targets.every((target) => target.state === 'confirmed');",
    T9
  ),
  m(
    'T9-56 a raw release may rewrite the report it keeps',
    S + 'stopRules.ts',
    '    if (!canonicallyEqual({ ...was, state: now.state }, now)) {',
    '    if (!canonicallyEqual({ ...was, state: now.state }, now) && now.id.length < 0) {',
    T9
  ),
  m(
    'T9-57 a stop command may land under an attempt that holds no reservation',
    S + 'stopRules.ts',
    '          !attempt.funded ||',
    '          (!attempt.funded && attempt.taskId.length < 0) ||',
    T9
  ),
  m(
    'T9-58 a presentation is returned about an intent that has since moved',
    B + 'stopRequests.ts',
    '    if (canonicallySame(now, current)) {',
    '    if (canonicallySame(now, now)) {',
    T9
  ),
  m(
    'T9-59 a presentation is returned across a policy change',
    B + 'stopRequests.ts',
    '    if (!ctx.epochIs(epoch)) {',
    '    if (!ctx.epochIs(epoch) && epoch.length < 0) {',
    T9
  ),
  m(
    'T9-60 a presentation is returned about a root this principal can no longer see',
    B + 'stopRequests.ts',
    '    if (!(await ctx.sees(subjectOf(again.value!)))) {',
    '    if (!(await ctx.sees(subjectOf(again.value!))) && epoch.length < 0) {',
    T9
  ),
  m(
    'T9-61 a raw settlement may rewrite the report it keeps',
    S + 'stopRules.ts',
    '      canonicallyEqual({ ...was, state: now.state }, now) &&',
    '      (canonicallyEqual({ ...was, state: now.state }, now) || now.id.length > 0) &&',
    T9
  ),
  m(
    'T9-62 a confirmed target may be rolled back to pending under the same attempt',
    S + 'stopRules.ts',
    "      (b.state === 'pending' || b.state === 'unexamined')",
    "      (b.state === 'pending' || b.state === 'unexamined') &&\n      a.taskId.length < 0",
    T9
  ),
  m(
    'T9-63 open keeps an unsettled stop command that is not its stop attempt',
    S + 'stopBook.ts',
    '        if (!command.settled && latching && !own) {',
    '        if (!command.settled && latching && !own && taskId.length < 0) {',
    T9
  ),
  m(
    'T9-64 open treats a command of a released stop as a stray',
    S + 'stopBook.ts',
    '        const latching: boolean = this.latchingOf(command.rootId).some((i) => i.id === command.intentId);',
    '        const latching: boolean = this.latchingOf(command.rootId).length >= 0;',
    T9
  ),
  m(
    "T9-65 open treats a superseded attempt's settled command as a stray",
    S + 'stopBook.ts',
    "        settled: op.dispatch === 'settled'",
    '        settled: op.dispatch.length < 0',
    T9
  ),
  m(
    'T9-66 storage lets an attempt move other than forward by one, with a new key',
    S + 'stopRules.ts',
    '    if (b.attempt === a.attempt ? b.operationId !== a.operationId : b.attempt !== a.attempt + 1) {',
    '    if (b.attempt < 0) {',
    T9
  )
];

MUTATIONS.push(...T9_ROWS);

/** I1a's rows run the tool suites, the public-surface suite and the renderer and its converters. */
const I1A = 'tools/|publicSurface|context/|converters/contextConverters';
const TL = 'src/packlets/tools/';

const I1A_ROWS = [
  m(
    'I1a-1 task_query execute trusts its arguments',
    TL + 'taskTools.ts',
    '      schema\n        .convert(args)\n',
    '      succeed(args as ITaskQueryToolArgs)\n',
    I1A
  ),
  m(
    'I1a-2 task_inspect execute trusts its arguments',
    TL + 'taskTools.ts',
    '      taskInspectSchema\n        .convert(args)\n',
    '      succeed(args as ITaskInspectToolArgs)\n',
    I1A
  ),
  m(
    'I1a-3 a limit above the context budget reaches the view',
    TL + 'taskTools.ts',
    '  if (limit < 1 || limit > maxItems) {',
    '  if (limit < 1 && limit > maxItems) {',
    I1A
  ),
  m(
    "I1a-4 the query request skips the view's request converter",
    TL + 'taskTools.ts',
    '  return ctx.renderer.converters.broker.boundQuery\n    .convert({',
    '  return Converters.generic<IBoundTaskQuery>((from) => succeed(from as IBoundTaskQuery))\n    .convert({',
    I1A
  ),
  m(
    'I1a-5 tasks the text omitted are not named',
    TL + 'presentation.ts',
    '        omitted: ids.filter((id) => !shown.has(id)),',
    '        omitted: ids.filter((id) => id.length < 0),',
    I1A
  ),
  m(
    'I1a-6 tasks the text abbreviated are not named',
    TL + 'presentation.ts',
    "        abbreviated: ids.filter((id) => shown.get(id) === 'abbreviated'),",
    '        abbreviated: ids.filter((id) => id.length < 0),',
    I1A
  ),
  m(
    'I1a-7 details are returned whatever their size',
    TL + 'presentation.ts',
    '          : details.length <= budget.maxDetailsChars',
    '          : details.length >= 0',
    I1A
  ),
  m(
    'I1a-8 failure messages are not truncated',
    TL + 'taskTools.ts',
    '  if (full.length <= maxMessageChars) {',
    '  if (full.length >= 0) {',
    I1A
  ),
  m(
    'I1a-9 truncation may split a surrogate pair',
    TL + 'taskTools.ts',
    '    ? maxMessageChars - 1\n    : maxMessageChars;',
    '    ? maxMessageChars\n    : maxMessageChars;',
    I1A
  ),
  m(
    'I1a-10 what a view threw reaches the model',
    TL + 'taskTools.ts',
    '      return fail(`${tool}: the task view failed`);',
    '      return fail(`${tool}: ${message}`);',
    I1A
  ),
  m(
    "I1a-11 a view's rejection escapes the capture",
    TL + 'taskTools.ts',
    '  return (await captureAsyncResult(async () => (await ask()).onSuccess(present)))',
    '  return succeed(await ask().then((r) => r.onSuccess(present)))',
    I1A
  ),
  m(
    'I1a-12 a page with more after it is rendered as complete input',
    TL + 'presentation.ts',
    "completeness: whole ? 'complete' : 'partial' }",
    "completeness: whole ? 'complete' : 'complete' }",
    I1A
  ),
  m(
    'I1a-13 a budget below the framing reserve is accepted at build time',
    TL + 'taskTools.ts',
    '      valid.context.maxChars < renderer.framingReserve',
    '      valid.context.maxChars < 0',
    I1A
  ),
  m(
    'I1a-14 the tool budget admits surplus properties',
    TL + 'taskTools.ts',
    '  return Converters.strictObject<ITaskToolBudget>({',
    '  return Converters.object<ITaskToolBudget>({',
    I1A
  ),
  m(
    'I1a-15 an inspected task with no room is reported complete',
    TL + 'presentation.ts',
    "        presentation: _presentations(context).get(inspection.envelope.id) ?? 'omitted',",
    "        presentation: _presentations(context).get(inspection.envelope.id) ?? 'complete',",
    I1A
  ),
  m(
    'I1a-16 an inspected unresolved task with no room is reported complete',
    TL + 'presentation.ts',
    "          presentation: _presentations(context).get(inspection.reference.id) ?? 'omitted'",
    "          presentation: _presentations(context).get(inspection.reference.id) ?? 'complete'",
    I1A
  ),
  m(
    'I1a-17 a rendered unresolved diagnostic is not counted as shown',
    TL + 'presentation.ts',
    "    shown.set(diagnostic.id, 'complete');",
    "    shown.set(diagnostic.id.length < 0 ? diagnostic.id : '', 'complete');",
    I1A
  ),
  m(
    'I1a-18 the renderer requires a binding a bound view never emits',
    C + 'contextConverters.ts',
    '      binding: values.sourceBinding.optional(),',
    '      binding: values.sourceBinding,',
    I1A
  ),
  m(
    "I1a-19 a classified failure's host message reaches the model",
    TL + 'taskTools.ts',
    '`${tool}: ${code}: ${modelFacingFailures[code]}`',
    '`${tool}: ${code}: ${result.message}`',
    I1A
  ),
  m(
    "I1a-20 a view's issue text reaches the model",
    TL + 'presentation.ts',
    '        issues: page.issues.length > 0 ? [pageIssueLine] : []',
    '        issues: page.issues',
    I1A
  ),
  m(
    "I1a-21 a view's cursor reaches the model unchecked",
    TL + 'viewAnswers.ts',
    '      nextCursor: converters.queries.pageCursor.optional(),',
    '      nextCursor: (Converters.generic((v: unknown) => succeed(v)) as never),',
    I1A
  ),
  m(
    "I1a-22 a view's failure code is trusted",
    TL + 'taskTools.ts',
    '  const code: TaskFailureCode | undefined = ctx.renderer.converters.failures.failureCode\n    .convert(result.detail?.code)\n    .orDefault();',
    '  const code: TaskFailureCode | undefined = result.detail?.code;',
    I1A
  ),
  m(
    "I1a-23 a page's completeness is trusted",
    TL + 'viewAnswers.ts',
    "      completeness: Converters.enumeratedValue<IBoundTaskPage['completeness']>(['complete', 'partial']),",
    '      completeness: (Converters.generic((v: unknown) => succeed(v)) as never),',
    I1A
  ),
  m(
    "I1a-24 a page's freshness is trusted",
    TL + 'viewAnswers.ts',
    "      freshness: Converters.enumeratedValue<IBoundTaskPage['freshness']>([\n        'native-current',\n        'source-projection'\n      ]),",
    '      freshness: (Converters.generic((v: unknown) => succeed(v)) as never),',
    I1A
  ),
  m(
    "I1a-25 an inspection's command names are trusted",
    TL + 'viewAnswers.ts',
    "    commands: boundedArrayOf(converters.commands.commandName, maxInspectionCommands, 'commands')",
    '    commands: (Converters.generic((v: unknown) => succeed(v)) as never)',
    I1A
  ),
  m(
    "I1a-26 an inspection's archived flag is trusted",
    TL + 'viewAnswers.ts',
    '    archived: Converters.boolean,',
    '    archived: (Converters.generic((v: unknown) => succeed(v)) as never),',
    I1A
  ),
  m(
    "I1a-27 an inspection's state is trusted",
    TL + 'viewAnswers.ts',
    "    state: Converters.literal('resolved'),",
    '    state: (Converters.generic((v: unknown) => succeed(v)) as never),',
    I1A
  ),
  m(
    'I1a-28 a page may hold more tasks than were asked for',
    TL + 'viewAnswers.ts',
    '        value.items.length + value.unresolved.length > limit',
    '        value.items.length + value.unresolved.length > limit + 1000',
    I1A
  ),
  m(
    "I1a-29 a page's issues are trusted",
    TL + 'viewAnswers.ts',
    "      issues: boundedArrayOf(Converters.string, maxPageIssues, 'page issues')",
    '      issues: (Converters.generic((v: unknown) => succeed(v)) as never)',
    I1A
  ),
  m(
    'I1a-30 a page may carry fields it does not have',
    TL + 'viewAnswers.ts',
    '    Converters.strictObject<IBoundTaskPage>({',
    '    Converters.object<IBoundTaskPage>({',
    I1A
  ),
  m(
    'I1a-31 an inspection is read without being converted',
    TL + 'taskTools.ts',
    "_answer(ctx.answers.inspection, answer, 'inspection')",
    "_answer((Converters.generic((v: unknown) => succeed(v)) as never), answer, 'inspection')",
    I1A
  )
];

MUTATIONS.push(...I1A_ROWS);

function parseArgs(argv) {
  const args = { check: false, pkg: path.resolve(__dirname, '..'), out: undefined, only: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--check') {
      args.check = true;
    } else if (arg === '--pkg') {
      args.pkg = path.resolve(argv[++i]);
    } else if (arg === '--out') {
      args.out = path.resolve(argv[++i]);
    } else {
      args.only.push(arg);
    }
  }
  return args;
}

function occurrences(text, pattern) {
  return text.split(pattern).length - 1;
}

function runSuites(pkg, tests) {
  const out = spawnSync(
    'node_modules/.bin/heft',
    ['test', '--clean', '--disable-code-coverage', '--test-path-pattern', tests],
    { cwd: pkg, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 }
  );
  return `${out.stdout}${out.stderr}`;
}

function classify(text) {
  if (
    text.includes('build:typescript] Error') ||
    (text.includes('build encountered an error') && !text.includes('[test:jest]'))
  ) {
    const errors = text
      .split('\n')
      .filter((line) => line.includes('Error'))
      .slice(0, 3);
    return { verdict: 'UNVERIFIED: did not build', red: errors };
  }
  const red = Array.from(new Set(Array.from(text.matchAll(/● (.+)/g), (match) => match[1].trim()))).sort();
  const failures = /Failures: (\d+)/.exec(text);
  return { verdict: `${failures ? failures[1] : '?'} red`, red };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const rows = MUTATIONS.filter(
    (row) => args.only.length === 0 || args.only.includes(row.name.split(' ')[0])
  );
  const results = [];
  for (const row of rows) {
    const files = row.edits.map((edit) => {
      const file = path.join(args.pkg, edit.file);
      return { ...edit, file, source: fs.readFileSync(file, 'utf8') };
    });
    const miss = files.find((edit) => occurrences(edit.source, edit.from) !== 1);
    let result;
    if (miss !== undefined) {
      result = { verdict: `UNVERIFIED: pattern found ${occurrences(miss.source, miss.from)} times`, red: [] };
    } else if (args.check) {
      result = { verdict: 'pattern ok', red: [] };
    } else {
      // Edits to one file apply in turn, each against the text the previous one left.
      const mutated = new Map();
      for (const edit of files) {
        const text = mutated.has(edit.file) ? mutated.get(edit.file) : edit.source;
        mutated.set(
          edit.file,
          text.replace(edit.from, () => edit.to)
        );
      }
      for (const [file, text] of mutated) {
        fs.writeFileSync(file, text);
      }
      try {
        result = classify(runSuites(args.pkg, row.tests));
      } finally {
        for (const edit of files) {
          fs.writeFileSync(edit.file, edit.source);
        }
      }
    }
    results.push({ name: row.name, ...result });
    console.log(`${row.name}: ${result.verdict}`);
    for (const test of result.red) {
      console.log(`    ${test}`);
    }
  }
  if (args.out !== undefined) {
    fs.writeFileSync(args.out, `${JSON.stringify(results, undefined, 1)}\n`);
  }
  const unverified = results.filter((r) => r.verdict.startsWith('UNVERIFIED') || r.verdict === '0 red');
  console.log(`\n${results.length} rows; ${unverified.length} UNVERIFIED or 0 red`);
  process.exitCode = unverified.length > 0 ? 1 : 0;
}

main();
