# Finalize-sweep findings — items needing a human decision

**What this is.** A retroactive `/finalize-task` sweep over the stream corpus, closing the
gap between stream directories on disk and narrated entries in `docs/WORKSTREAMS.md`. Each
stream gets a `meta.yaml`, an antagonist pass that tries to refute it, and — where the
stream is genuinely un-narrated — a drafted ledger entry.

Most of what the sweep produces is bookkeeping and needs no attention. **This file is the
exception list**: things the sweep found that a person should decide, ordered by what looks
most likely to matter. It exists so the decisions are in one place rather than scattered
across six PR bodies.

**Started 2026-08-14.** Sweep scope: 22 completed streams with no ledger entry, plus a
triage of 9 `active/` streams that may be shipped-but-never-migrated.

> **Nothing here has been acted on.** Every item is a finding, not a change. Where the
> sweep *did* change something (a `meta.yaml`, a README amendment, a `TECH_DEBT.md` entry),
> that is in the PR diff and is not repeated here.

---

## Ordering

1. **Correctness / security** — something in shipped code may be wrong
2. **Unmet commitments** — a binding decision or acceptance criterion that was not met
3. **Lost work** — deferrals, lessons, and open questions recorded nowhere durable
4. **Bookkeeping decisions** — ledger shape, naming, what deserves an entry

---

## 1. Correctness / security

### 1.1 `argon2` is pinned below its own binding floor — `crypto-batch-2-argon2id`

`brief-phase-b.md` D1 set **`argon2` v0.45.0+** as binding ("where it conflicts with
`design.md`, this brief wins"). `libraries/ts-extras-argon2/package.json` ships
`"argon2": "~0.44.0"` — a tilde range that can never resolve to 0.45.0 or above. The pin
*style* also diverged from the signed-off design, which specified caret ranges (`^0.45.0`,
`^4.12.0`) reasoning that caret admits non-breaking patch and minor updates; both new
packages shipped tilde. Neither the version miss nor the style change is explained in any
artifact — `state.md` records "v0.44.0" matter-of-factly.

This compounds with D4, which made **ongoing version-sync fgv's responsibility** for a
memory-hard KDF on the grounds that fgv should concentrate the risk rather than have each
consumer re-derive it. `design.md` §8 proposed a cadence (quarterly `rush update` +
changelog review; immediate review on a security advisory). None of it was operationalized:
`docs/TECH_DEBT.md` does not mention argon2, `docs/FUTURE.md` carries only a later
unrelated API-surface ask, and `.github/dependabot.yml` is a generic weekly npm config that
predates the stream and names neither library.

**Decision needed:** whether to move the pin to the intended floor, and whether D4's
obligation gets an artifact or is formally dropped. An accepted standing obligation with no
artifact is indistinguishable from one nobody took.

---

## 2. Unmet commitments

### 2.1 HPKE browser coverage was 95%+ against a binding 100% criterion — `crypto-batch-2-hpke`

`brief-phase-b.md` required 100% coverage in **both** `ts-extras` and `ts-web-extras`.
PR #348's own description states "100% coverage in ts-extras; 95%+ in ts-web-extras". The
shortfall was disclosed at the time and then carried into no completion record — the
stream's README states 100% only on the Node row and is silent on the browser row, which
is accurate but reads as omission rather than distinction.

**Decision needed:** close the gap, or accept and record it. Low urgency — the package has
been in production use since. Flagged because it is a *binding criterion that was not met
and then went unrecorded*, which is the pattern worth catching, more than because 95% is
alarming.

### 2.2 A design's stated precondition was never discharged — `ai-assist-image-generation`

`design.md` Q9 asks for a specific action before the breaking `quality: 'high'` → `'hd'`
change could be called zero-cost: *"grep `personaility` and `ts-app-shell` for any usage of
`quality`… verify quality field usage in consumer repos before accepting the migration path
as zero-cost."* No artifact records that this was done — not the phase-B brief, not the
README, not the ledger — while `state.md` reports open questions as "(none)". The blanket
"none" is what buried it.

**Decision needed:** run the check now (cheap), or accept that the migration shipped
unverified and close the question. It has been months and no consumer breakage surfaced,
which is weak evidence it was fine.

---

## 3. Lost work

### 3.1 A TECH_DEBT trigger fired without the debt being paid — `ai-assist-image-generation`

The P3 entry (`resolveImageCapability` returning `| undefined` rather than `Result`) carries
the trigger "next substantive change to the provider registry or capability resolution
path". That trigger fired: #516 changed that very function to resolve `@aliases` before
prefix-matching. The debt was not paid, and the entry's line reference is now stale
(`registry.ts:328-339`; the function sits at 428-433).

Its sibling P2 was properly paid off by #619 and removed — so the mechanism works; this one
just was not noticed.

**Decision needed:** pay it, or re-trigger it with a sharper condition. Also worth asking
whether "next time this file is touched" is a workable trigger shape at all, given it
depends on whoever touches the file having read the debt ledger first.

### 3.2 Two lessons were surfaced in stream artifacts and never filed

Filed during this sweep as **L31** (audit response fixtures when parsing gets stricter,
from `ai-assist-thinking-config`) and **L32** (a polished design can be correct on
inventory and wrong on architecture — trust the signoff gate, from
`ai-assist-image-generation`, which recurred on its sibling stream).

No decision needed — recorded here because the *pattern* is the finding: in both cases
three of the stream's four lessons reached `lessons-pending.md` and one did not, with
nothing to catch the drop.

### 3.3 `lessons-pending.md` L1 has been open ~3 months

The parallel-phase-A lesson surfaced by `ai-assist-thinking-config` is captured but
uncodified; the most recent sweep took L38–L40 and did not reach it.

**Decision needed:** codify or close. Flagged because a pending-lessons file that
accumulates faster than it drains stops being a queue and becomes an archive.

---

## 4. Bookkeeping decisions

### 4.1 The ledger gap is 31, not the "~25" previously recorded

Measured 2026-08-14 as a set difference on stream ids: **68 directories, 41 ledger entries,
31 directories with no entry under their own name, 20 of those unmentioned entirely.** The
earlier figure was wrong twice over — `grep -c '^### '` counted two prose section headings
as streams, and subtracting totals instead of taking a set difference cancelled naming
mismatches against real gaps. Corrected in `WORKSTREAMS.md`, the `task-corpus-index` brief,
and the skill (whose step 8 had prescribed the naive count).

### 4.2 Some "gaps" are naming mismatches, not gaps

Confirmed so far: directory `ts-prompt-assist` is narrated as **`ts-prompt-assist-features`**;
directory `safer-fetch-s3` is narrated under **`fetch-primitive-threat-model`** (as its S3
sub-stream). These will be reported as un-narrated by any tool matching on id until either
the directory or the entry is renamed.

**Decision needed:** rename directories to match entries, rename entries to match
directories, or record the mapping (this sweep adds a `ledgerEntry:` field to `meta.yaml`
for the affected streams, which is the no-churn option).

### 4.3 Does every stream deserve a ledger entry?

The ledger is explicitly curated — "the ones worth narrating" — so 41-of-68 is partly by
design, not purely neglect. Several gap streams are one-file fixes whose own entry would
add noise. Where the sweep judges that, it drafts a sentence to fold into the parent
stream's entry instead, and says so.

**Decision needed:** confirm that judgment call is yours to make per-stream, or give a rule
(e.g. "anything with its own PR gets an entry").

---

*Sections below are appended per batch as the sweep proceeds.*
