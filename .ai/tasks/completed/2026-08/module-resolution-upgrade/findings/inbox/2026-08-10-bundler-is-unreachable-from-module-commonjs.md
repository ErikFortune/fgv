# `moduleResolution: bundler` is unreachable from `module: commonjs` — D3 as briefed cannot land

**Severity:** blocks deliverable 3 as written. Not a defect; a costing error in the brief.

## What was assumed

The design amendment recommended, as step 3: "Move to `bundler` repo-wide and fix what it flags.
Cheap, and closes the class that has cost the most consumer pain." It was costed as the cheap rung
below `node16` specifically because it does **not** demand specifier changes.

## What is actually true

TypeScript refuses the pairing. Measured on `libraries/ts-random`, holding `module: commonjs` (the
value every one of the 29 rig-inheriting projects gets from `@rushstack/heft-node-rig`) and varying
only `moduleResolution`:

| `moduleResolution` | result |
|---|---|
| `node10` | **the only legal value** |
| `bundler` | `TS5095: Option 'bundler' can only be used when 'module' is set to 'preserve' or to 'es2015' or later.` |
| `node16` | `TS5110: Option 'module' must be set to 'Node16' when option 'moduleResolution' is set to 'Node16'.` |
| `nodenext` | `TS5110: Option 'module' must be set to 'NodeNext' ...` |

## Why it matters

**Every path off node10 requires changing `module`, and changing `module` changes the emit.** The
brief's grading assumed step 3 was cheap *because* it left the emit alone, and that step 4 was the
expensive one *because* it did not. That distinction does not survive contact: steps 3 and 4 share
the same prerequisite — settling what this repo emits.

The amendment's probe table is not wrong, but it is not applicable: it varied `module` and
`moduleResolution` together (`esnext`/`bundler`, `node16`/`node16`) and so never asked whether the
`bundler` row is reachable from where the repo actually sits.

## What this does not change

Deliverable 1 is unaffected and landed: `node10` is now stated in all 31 rig-inheriting projects
rather than inherited silently. That was the precondition, and it is still worth having — it is what
makes this constraint visible at each call site instead of hidden in an upstream default.

## Consequence for the stream

D3 and D4 collapse into one decision, gated on the dual-emit question (design § 2 Option D), not two
independently landable steps. See the sibling finding on what a type-check-only gate can and cannot
substitute for.
