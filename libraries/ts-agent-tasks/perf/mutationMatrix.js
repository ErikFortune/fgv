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
 *   M…        run only the named rows
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

function m(name, file, from, to) {
  return { name, file, from, to };
}

const MUTATIONS = [
  m(
    'M1 skip the pending-inventory write',
    S + 'repository.ts',
    'this._writeFile(manifestName, manifestEncoded.text, operationId).onSuccess(() => {',
    'ok(true).onSuccess(() => {'
  ),
  m(
    'M2 mark live before writing the record',
    S + 'repository.ts',
    "        (writeRecord\n          ? this._writeFile(recordName('task', taskId), built.encoded.text, operationId).onSuccess(() =>\n              this._relist(operationId)\n            )",
    "        (writeRecord\n          ? this._writeFile(manifestName, manifestEncoded.text, operationId)\n              .onSuccess(() => this._writeFile(recordName('task', taskId), built.encoded.text, operationId))\n              .onSuccess(() => this._relist(operationId))"
  ),
  m(
    "M3 treat visibility 'unknown' as unchanged",
    S + 'repository.ts',
    "    if (visibility === 'unchanged') {",
    "    if (visibility !== 'replaced') {"
  ),
  m(
    'M4 never fence (every failure treated as unchanged)',
    S + 'repository.ts',
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
    S + 'repository.ts',
    '    return this._writeFile(name, read.encoded.text, operationId)\n      .onSuccess(() => this._encodeManifest(this._manifest))\n      .onSuccess((encoded) => this._writeFile(manifestName, encoded.text, operationId));',
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
    S + 'repository.ts',
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
    S + 'repository.ts',
    '    if (fingerprintOf(text.value) === this._manifestFingerprint) {',
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
  )
];

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

function runSuites(pkg) {
  const out = spawnSync(
    'node_modules/.bin/heft',
    ['test', '--clean', '--disable-code-coverage', '--test-path-pattern', 'storage|capacity'],
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
    const file = path.join(args.pkg, row.file);
    const source = fs.readFileSync(file, 'utf8');
    const count = occurrences(source, row.from);
    let result;
    if (count !== 1) {
      result = { verdict: `UNVERIFIED: pattern found ${count} times`, red: [] };
    } else if (args.check) {
      result = { verdict: 'pattern ok', red: [] };
    } else {
      fs.writeFileSync(
        file,
        source.replace(row.from, () => row.to)
      );
      try {
        result = classify(runSuites(args.pkg));
      } finally {
        fs.writeFileSync(file, source);
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
