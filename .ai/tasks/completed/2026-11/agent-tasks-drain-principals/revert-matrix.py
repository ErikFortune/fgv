#!/usr/bin/env python3
"""Revert matrix for agent-tasks-drain-principals.

Each row removes one protection from the source, runs the targeted suites, and records how many
tests went red. A protection whose row stays green has no test that pins it. Run from the repo root
of the worktree: python3 .ai/tasks/completed/2026-11/agent-tasks-drain-principals/revert-matrix.py
"""
import pathlib
import re
import subprocess
import sys

PKG = pathlib.Path('libraries/ts-agent-tasks')
DELIVERY = PKG / 'src/packlets/broker/delivery.ts'
BROKER = PKG / 'src/packlets/broker/taskBroker.ts'
CONVERTERS = PKG / 'src/packlets/converters/deliveryConverters.ts'
RECORDS = PKG / 'src/packlets/storage/consumerRecords.ts'
TYPES = PKG / 'src/packlets/types/delivery.ts'
PATTERN = 'drainPrincipals|deliveryWithheld|withheldFaults|deliveryPump|receipts|accounting'

ROWS = [
    ('R1 bindDelivery ignores drain principals', BROKER,
     'found.drainPrincipals.includes(access.principal)\n        ? ok', 'true\n        ? ok'),
    ('R2 subscribe default is not the registrant', DELIVERY,
     'drainPrincipals: req.drainPrincipals ?? [access.principal],',
     "drainPrincipals: req.drainPrincipals ?? [access.principal, 'bob'],"),
    ('R3 legacy record is not registrant-only', TYPES,
     'return record.drainPrincipals ?? [record.registration.principalKey];',
     "return record.drainPrincipals ?? [record.registration.principalKey, 'bob'];"),
    ('R4 request list not de-duplicated / sorted', CONVERTERS,
     'succeed(Array.from(new Set(value)).sort())', 'succeed(value)'),
    ('R5 request list may be empty', CONVERTERS,
     '      value.length > 0\n        ? succeed(Array.from', '      value.length >= 0\n        ? succeed(Array.from'),
    ('R6 pending: no first drain check', DELIVERY,
     "    const drains: TaskResult<true> = this._stillDrains('pending');\n",
     "    const drains: TaskResult<true> = ok<true>(true);\n"),
    ('R7 pending: no final drain check', DELIVERY,
     "    const stillDrains: TaskResult<true> = this._stillDrains('pending');",
     "    const stillDrains: TaskResult<true> = ok<true>(true);"),
    ('R8 prepare: no drain check', DELIVERY,
     "    if (!this._drains(captured.drainPrincipals)) {\n      return this._denied('prepare');",
     "    if (false) {\n      return this._denied('prepare');"),
    ('R9 acknowledge: no drain check', DELIVERY,
     "    if (!this._drains(drainPrincipalsOf(live))) {\n      return this._denied('acknowledge');",
     "    if (false) {\n      return this._denied('acknowledge');"),
    ('R10 abandon: no drain check', DELIVERY,
     "record.value !== undefined && !this._drains(drainPrincipalsOf(record.value))",
     "false"),
    ('R11 issued: no drain check', DELIVERY,
     "          : !this._drains(drainPrincipalsOf(record))", "          : false"),
    ('R12 disposeWithheld: identity not required', DELIVERY,
     "      policyIdentity !== undefined &&\n      policyIdentity === this._access.policyIdentity",
     "      true"),
    ('R13 disposeWithheld: no in-writer re-check', DELIVERY,
     "      if (!this._withheldAuthority(drainPrincipalsOf(live), live.policyIdentity)) {",
     "      if (false) {"),
    ('R14 disposeWithheld: registrant-only (old rule) instead of drain principals', DELIVERY,
     "      !this._withheldAuthority(found.drainPrincipals, found.policyIdentity) ||",
     "      !this._withheldAuthority([found.principalKey], found.policyIdentity) ||"),
    ('R15 setSubscriptionDrain: any principal may change it', DELIVERY,
     "    found.principalKey !== access.principal ||\n", ""),
    ('R16 setSubscriptionDrain: no subscribe grant asked', DELIVERY,
     "    !(await access.allows({ action: 'subscribe', role: 'subject', scopes: found.selection.scopes }))",
     "    false"),
    ('R17 setSubscriptionDrain: no epoch fence', DELIVERY,
     "    if (!access.epochIs(epoch.value)) {\n      return changedSinceAuthorized<ITaskSubscription>",
     "    if (false) {\n      return changedSinceAuthorized<ITaskSubscription>"),
    ('R18 setDrain: omitted identity not removed', RECORDS,
     "return this._replace(state, rest, {", "return this._replace(state, record, {"),
    ('R19 setDrain: no-op still writes', RECORDS,
     "        ) {\n          return ok(record);\n        }\n        return this._replace(state, rest",
     "        && false) {\n          return ok(record);\n        }\n        return this._replace(state, rest"),
    ('R20 replay ignores drain authority', RECORDS,
     "          specification: specificationOf(record)",
     "          specification: { ...specificationOf(record), drainPrincipals: registration.specification.drainPrincipals, policyIdentity: registration.specification.policyIdentity }"),
    ('R21 selectors not required for setSubscriptionDrain', DELIVERY,
     "    !found.selection.scopes.every((scope) => access.selects(scope)) ||\n    !(await access.allows({ action: 'subscribe'",
     "    !(await access.allows({ action: 'subscribe'"),
]


def run() -> int:
    proc = subprocess.run(
        ['npx', 'heft', 'test', '--test-path-pattern', PATTERN, '--disable-code-coverage'],
        cwd=PKG, capture_output=True, text=True, timeout=590)
    out = proc.stdout + proc.stderr
    if re.search(r'error TS\d+', out):
        return -1
    return sum(int(n) for n in re.findall(r'(\d+) failed\)', out))


def main() -> None:
    only = set(sys.argv[1:])
    print('| row | red tests |')
    print('| --- | --- |')
    for name, path, old, new in ROWS:
        if only and name.split()[0] not in only:
            continue
        text = path.read_text()
        if text.count(old) != 1:
            print(f'| {name} | PATTERN NOT FOUND ({text.count(old)}) |')
            continue
        path.write_text(text.replace(old, new))
        try:
            red = run()
        finally:
            path.write_text(text)
        print(f"| {name} | {'compile error' if red < 0 else red} |", flush=True)


if __name__ == '__main__':
    main()
