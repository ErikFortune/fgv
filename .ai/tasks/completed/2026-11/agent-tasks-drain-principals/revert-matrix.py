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
DISPOSITION = PKG / 'src/packlets/broker/disposition.ts'
TYPES = PKG / 'src/packlets/types/delivery.ts'
PATTERN = ('drainPrincipals|drainDisposition|deliveryWithheld|withheldFaults|deliveryPump|receipts|accounting|'
           'storage/subscriptions|unit/delivery/disposition|dispositionFaults|retention')

# bindDelivery as it was before the review fix: existence and consumer decided before the binding.
_OLD_BIND = '''    const subscription: TaskResult<ITaskSubscription | undefined> = this._core.repository.subscription(
      params.subscriptionId
    );
    const consumer = ids.consumerId.convert(params.consumerId);
    if (subscription.isFailure()) {
      return propagateTask(subscription);
    }
    if (
      subscription.value === undefined ||
      consumer.isFailure() ||
      subscription.value.consumerId !== consumer.value
    ) {
      return denied();
    }
    const found: ITaskSubscription = subscription.value;
    return this._access(params).onSuccess((access) =>
      found.drainPrincipals.includes(access.principal)
        ? ok<IBoundTaskDelivery>(new BoundTaskDelivery(this._core, access, found.id))
        : denied()
    );
'''
_NEW_BIND_START = '    // The binding itself is decided before the subscription is read'

ROWS = [
    ('R1 bindDelivery ignores drain principals', BROKER,
     'found.drainPrincipals.includes(access.principal)\n            ? ok', 'true\n            ? ok'),
    ('R2 subscribe default is not the registrant', DELIVERY,
     'drainPrincipals: req.drainPrincipals ?? [access.principal],',
     "drainPrincipals: req.drainPrincipals ?? [access.principal, 'bob'],"),
    ('R3 legacy record is not registrant-only', TYPES,
     'return record.drainPrincipals ?? [record.registration.principalKey];',
     "return record.drainPrincipals ?? [record.registration.principalKey, 'bob'];"),
    ('R4 request list not de-duplicated / sorted', CONVERTERS,
     'const distinct: ReadonlyArray<string> = Array.from(new Set(value)).sort();',
     'const distinct: ReadonlyArray<string> = value;'),
    ('R5 request list may be empty', CONVERTERS,
     '    if (distinct.length === 0) {', '    if (false) {'),
    ('R6 pending: no first drain check', DELIVERY,
     "    return this._stillDrains('pending').thenOnSuccess(", "    return ok<true>(true).thenOnSuccess("),
    ('R7 pending: no final drain check', DELIVERY,
     "    return this._stillDrains('pending').onSuccess(() =>", "    return ok<true>(true).onSuccess(() =>"),
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
     "    found.principalKey === access.principal &&\n", ""),
    ('R16 setSubscriptionDrain: no subscribe grant asked', DELIVERY,
     "    (await access.allows({ action: 'subscribe', role: 'subject', scopes: found.selection.scopes }))",
     "    true"),
    ('R17 setSubscriptionDrain: no epoch fence', DELIVERY,
     "        access.epochIs(epoch)\n          ? ok(record)", "        true\n          ? ok(record)"),
    ('R18 setDrain: omitted identity not removed', RECORDS,
     "return this._replace(state, rest, {", "return this._replace(state, record, {"),
    ('R19 setDrain: no-op still writes', RECORDS,
     "        ) {\n          return ok(record);\n        }\n        return this._replace(state, rest",
     "        && false) {\n          return ok(record);\n        }\n        return this._replace(state, rest"),
    ('R20 replay ignores drain authority', RECORDS,
     "_resolvedDrain(specificationOf(record), record.registration.principalKey)",
     "_resolvedDrain({ ...specificationOf(record), drainPrincipals: registration.specification.drainPrincipals, policyIdentity: registration.specification.policyIdentity }, record.registration.principalKey)"),
    ('R21 selectors not required for setSubscriptionDrain', DELIVERY,
     "    found.selection.scopes.every((scope) => access.selects(scope)) &&\n    (await access.allows({ action: 'subscribe'",
     "    (await access.allows({ action: 'subscribe'"),
    # Review round: ordering, disposition authority, legacy identity, request cap, and two missing rows.
    ('R22 bindDelivery decides existence before the binding (oracle)', BROKER, None, None),
    ('R23 dispose: no drain-principal requirement before authorizing tasks', DISPOSITION,
     "_subscription(core, access, request.subscriptionId, what, 'drainers');",
     "_subscription(core, access, request.subscriptionId, what, 'drainers-or-registrant');"),
    ('R24 dispose/close: no in-writer drain re-check', DISPOSITION,
     "    _actsOn(access, drainPrincipalsOf(record), record.registration.principalKey, actors)\n      ? ok(record)",
     "    true\n      ? ok(record)"),
    ('R25 in-writer re-check reads the raw list, not the legacy rule', DISPOSITION,
     "_actsOn(access, drainPrincipalsOf(record), record.registration.principalKey, actors)",
     "_actsOn(access, record.drainPrincipals ?? [], record.registration.principalKey, actors)"),
    ('R26 closeSubscription disposing admits the registrant', DISPOSITION,
     "request.obligations === 'dispose' ? 'drainers' : 'drainers-or-registrant'", "'drainers-or-registrant'"),
    ('R27 closeSubscription retaining refuses the registrant', DISPOSITION,
     "(actors === 'drainers-or-registrant' && registrant === access.principal)", "false"),
    ('R28 closeSubscription retaining admits anyone', DISPOSITION,
     "(actors === 'drainers-or-registrant' && registrant === access.principal)",
     "actors === 'drainers-or-registrant'"),
    ('R29 pending registration compared without the legacy rule', RECORDS,
     "_resolvedDrain(pending.specification, pending.principalKey)", "pending.specification"),
    ('R30 live registration compared without the legacy rule', RECORDS,
     "_resolvedDrain(specificationOf(record), record.registration.principalKey)", "specificationOf(record)"),
    ('R31 request list capped before de-duplication', CONVERTERS,
     "maxDrainPrincipals * drainRequestEntriesPerPrincipal,", "maxDrainPrincipals,"),
    ('R32 request list: distinct principals not capped', CONVERTERS,
     "distinct.length <= maxDrainPrincipals\n", "true\n"),
    ('R33 stored list: strict ascending not required', CONVERTERS,
     "value.length > 0 && _ascending(value)\n        ? succeed(value)\n        : fail(`drain principals",
     "value.length > 0\n        ? succeed(value)\n        : fail(`drain principals"),
    ('R34 bind: a throwing policyIdentity is not captured', BROKER,
     "captureResult(() => authorization.policyIdentity)", "succeed(authorization.policyIdentity)"),
]


def run() -> int:
    proc = subprocess.run(
        ['npx', 'heft', 'test', '--test-path-pattern', PATTERN, '--disable-code-coverage'],
        cwd=PKG, capture_output=True, text=True, timeout=590)
    out = proc.stdout + proc.stderr
    if re.search(r'error TS\d+|\(TS\d+\)', out):
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
        if old is None:
            # R22: put the pre-fix bindDelivery body back in place of the fixed one.
            start = text.index(_NEW_BIND_START)
            end = text.index('  }\n', start)
            old = text[start:end]
            new = _OLD_BIND
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
