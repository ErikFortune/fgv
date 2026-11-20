"""Apply one ordering revert at a time, rebuild, run the named test file, record red/green, restore."""
import subprocess, sys, os, re

PKG = '/home/user/fgv/.claude/worktrees/agent-a8a69b01a9d2b6a74/libraries/ts-agent-memory'
STORE = 'src/packlets/store/fileTreeMemoryStore.ts'
SEQ = 'src/packlets/store/storeSeq.ts'
ORCH = 'src/packlets/ingest/orchestrator.ts'
CW = 'lib/test/unit/store/conditionalWrite.test.js'
OT = 'lib/test/unit/ingest/orchestrator.test.js'

FLAT_CHECK = """      if (refusal !== undefined) {
        return succeed(refusal);
      }
      if (dedupScope === 'content') {"""
NOOP = """      if (
        existing !== undefined &&
        existing.envelope.contentHash === hash &&"""
COHORT = """      return this._admissionCohort(scope, record.envelope.kind, idStem)"""

VCHECK = """    if (refusal !== undefined) {
      return succeed(refusal);
    }
    const policy: IWritePolicy = this._policyFor(kind);"""

REVERTS = [
    ('R1 flat check after cross-id content dedup', STORE,
     [(FLAT_CHECK, "      if (dedupScope === 'content') {"),
      (NOOP, "      if (refusal !== undefined) {\n        return succeed(refusal);\n      }\n" + NOOP)],
     CW, 'the check precedes cross-id content dedup'),
    ('R2 flat check after same-id no-op', STORE,
     [(FLAT_CHECK, "      if (dedupScope === 'content') {"),
      (COHORT, "      if (refusal !== undefined) {\n        return succeed(refusal);\n      }\n" + COHORT)],
     CW, 'the check precedes the same-id no-op'),
    ('R3 versioned check after entity dedup', STORE,
     [(VCHECK, "    const policy: IWritePolicy = this._policyFor(kind);"),
      ("      return policy.admit(record, versions).thenOnSuccess((decision) => {",
       "      if (refusal !== undefined) {\n        return Promise.resolve(succeed<IPutOutcome | WriteRefusal>(refusal));\n      }\n      return policy.admit(record, versions).thenOnSuccess((decision) => {")],
     CW, 'compares with the current version, before entity dedup'),
    ('R4 check not serialized by the write lock', STORE,
     [("    const result: Promise<Result<T>> = this._writeTail.then(() =>\n      this._session.checkWritable().thenOnSuccess(task)\n    );",
       "    const result: Promise<Result<T>> = Promise.resolve(this._session.checkWritable().thenOnSuccess(task));")],
     CW, 'exactly one wins'),
    ('R5 delete ignores expected', STORE,
     [("      checkExpectation(expected, current, label) ??\n", "")],
     CW, 'a matching seq deletes; a stale one conflicts'),
    ('R6 seq issued even when the high-water write fails', SEQ,
     [("""      .onFailure((m) => {
        // A failed write may have torn the slot; treat it as unreadable so it is the next target.
        this._slots[slot] = undefined;
        return fail(`memory store: cannot advance the seq high-water mark: ${m}`);
      })""", "      .onFailure(() => succeed(true))")],
     CW, 'is persisted before the seq it covers is used'),
    ('R6b no high-water persistence (derive from disk only)', SEQ,
     [("    if (seq <= this._reserved) {", "    if (seq <= this._reserved || true) {")],
     CW, 'not re-issued after a reopen'),
    ('R7 reopen ignores the persisted mark', SEQ,
     [("    this._issued = this._reserved;", "    this._issued = 0;")],
     CW, 'resumes past the persisted mark'),
    ('R8a ingest passes no expected', ORCH,
     [("expected === undefined ? undefined : { expected }", "undefined")],
     OT, 'a target written after the snapshot is a per-candidate conflict'),
    ('R8b ingest ignores its own in-pass writes', ORCH,
     [("written.get(entityKey) ?? plan.mergeExpected", "plan.mergeExpected")],
     OT, 'two candidates merging into one target in one pass both merge'),
    ('R8c ingest expects the named (superseded) version', ORCH,
     [("    if (!targetAddr.isVersioned) {\n      return target.envelope.seq;", "    if (targetAddr.isVersioned || !targetAddr.isVersioned) {\n      return target.envelope.seq;")],
     OT, 'a versioned merge'),
    ('R12 conditional put dedups onto another id and reports success', STORE,
     [("          return target.expected === undefined", "          return target.expected === undefined || true")],
     CW, 'a dedup onto another id is a duplicate'),
    ('R12b ingest does not map duplicate to deduped', ORCH,
     [("      if (failure?.code === 'duplicate') {", "      if (failure?.code === 'duplicate' && false) {")],
     OT, 'a merge whose content already exists elsewhere'),
    ('R13 open fails on any unreadable slot', SEQ,
     [("if ((a.present || b.present) && a.reserved === undefined && b.reserved === undefined) {",
       "if ((a.present && a.reserved === undefined) || (b.present && b.reserved === undefined)) {")],
     CW, 'a torn slot beside a good one'),
    ('R14 no alternation: always write slot a', SEQ,
     [("    const slot: 0 | 1 = a === undefined ? 0 : b === undefined ? 1 : a <= b ? 0 : 1;",
       "    const slot: 0 | 1 = a === undefined || true ? 0 : b === undefined ? 1 : a <= b ? 0 : 1;")],
     CW, 'torn slot beside|alternation survives'),
    ('R15 a directory on a slot name is not refused', SEQ,
     [("    if (item.type === 'directory') {", "    if (item.type === 'directory' && item.name === '') {")],
     CW, 'is refused at open'),
]


def run(cmd):
    return subprocess.run(cmd, cwd=PKG, shell=True, capture_output=True, text=True)


def main():
    only = sys.argv[1:]
    rows = []
    for name, path, edits, testfile, testname in REVERTS:
        if only and not any(name.startswith(o) for o in only):
            continue
        full = os.path.join(PKG, path)
        original = open(full).read()
        patched = original
        for old, new in edits:
            if patched.count(old) != 1:
                rows.append((name, 'PATCH-MISS', old[:60]))
                break
            patched = patched.replace(old, new)
        else:
            open(full, 'w').write(patched)
            try:
                b = run('npx tsc -p tsconfig.json --outDir lib --noEmit false 2>&1 | tail -3')
                t = run(f"npx jest {testfile} --coverage=false -t {repr(testname)} 2>&1")
                m = re.search(r'Tests:\s+(.*)', t.stdout)
                summary = m.group(1) if m else t.stdout[-300:]
                why = re.findall(r'(?:Received|Expected)[^\n]*', t.stdout)[:2]
                rows.append((name, 'RED' if 'failed' in summary else 'GREEN', summary + ' :: ' + ' / '.join(w.strip() for w in why)))
            finally:
                open(full, 'w').write(original)
    run('npx tsc -p tsconfig.json --outDir lib --noEmit false')
    for r in rows:
        print(' | '.join(r))


main()
