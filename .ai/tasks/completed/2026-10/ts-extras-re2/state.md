# State: `ts-extras-re2`

Worker-owned. Base `integration/asks` at `f85ed68b3` (branch head at kickoff; already contained the
current `integration/asks`, so no merge was needed).

## Dependency checks (brief decision 2) — all passed

Checked 2026-10-19 ~01:20 UTC with `npm view re2js` and the downloaded 2.8.8 tarball.

- **Version / age:** `re2js@2.8.8`, published 2026-10-17T23:00:12Z, ~26 h at check time. pnpm 11.12.0
  is the repo's package manager; its default `minimumReleaseAge` is 1 day and the repo sets no
  override. `rush add` and the repo-wide `rush install` both passed with the lockfile entry.
- **Licence:** MIT (package.json and LICENSE).
- **Runtime dependencies:** none. `engines.node >=20`. The package ships ESM, CJS and UMD builds;
  the CJS `main` loads under this repo's `moduleResolution: node10`.
- **Maintenance:** 49 published versions since 2023-07; 35 in 2026; latest two on 2026-10-17. Single
  maintainer (`leopard_me`). GitHub API was not reachable from this session (the repo is not
  attached), so stars, issues and commit history were not checked.
- Added with `rush add -p re2js@2.8.8` (Rush refuses `--exact` together with a version, and a bare
  version is written exactly: `"re2js": "2.8.8"`). The lockfile delta is only the new project.

## Naming (brief decision 3)

- `re2PatternValidator` — kept from the brief. It says the engine and the seam it fills
  (`SchemaPatternValidator`), and it reads correctly at the call site
  (`{ patternValidator: re2PatternValidator }`).
- `createRe2PatternValidator(options)` returns `Result<SchemaPatternValidator>`. It is a factory
  that can fail, because a limit can be invalid, so it follows the repo's `create…` convention.
- `DEFAULT_RE2_PATTERN_LIMITS` — exported so callers can derive tighter limits from the defaults.
- `IRe2PatternValidatorOptions` — named after the thing it configures.
- `re2PatternValidator` is an arrow constant, not a `createRe2PatternValidator().orThrow()` value,
  so the module has no top-level call (it stays `sideEffects: false`).

## Design decisions not stated in the brief

- **A translator, not a pass-through.** The brief asks for Unicode semantics "as closely as RE2
  allows". `ts-json-base`'s TSDoc asks a non-ECMA validator to "refuse what it would read
  differently". Handing the source to re2js unchanged would do neither. RE2's `.` matches `\r` and
  U+2028; its `\s` is ASCII; it accepts `(?i)`, `\Q…\E`, `\z`, POSIX classes and `\pL`; and it reads
  `[[:alpha:]]` as a POSIX class. So `ecmaPattern.ts` parses the source as an ECMA-262 `u`-mode
  pattern, in a single linear pass, and emits RE2 syntax that matches the same strings. Every
  literal that is not an ASCII alphanumeric is emitted as `\x{…}`, and `.`, `\s`, `\S`, `\d`, `\w`
  and their negations are emitted as explicit ranges. Anything it does not rewrite is refused.
  re2js's own `translateRegExp` was not used: it is a permissive converter, not a validator.
- **Refusing RE2-only syntax** that ECMA `u` rejects is also the safe direction. The wire forwards
  the source to readers that use ECMA.
- **`Script=` names.** These are emitted as a bare `\p{Name}`, which RE2 resolves in the same
  namespace as its categories and binary properties. So a deny-list (`RE2_NON_SCRIPT_NAMES`,
  copied from re2js 2.8.8's `unicodeTable` and `CATEGORIES` keys) stops `sc=Emoji` from becoming a
  binary property. It must be reviewed on every re2js bump; the README says so.
- **Defaults:** `maxSourceLength` is 1024 UTF-16 units and `maxProgramSize` is 10,000. Tool-schema
  patterns are short. A 10,000-instruction program still allows `.{0,1000}`-class patterns, and it
  bounds the per-character matching cost.
- **No compile cache.** A cache keyed by untrusted sources would need its own bound; compiling is
  cheap.

## Brief vs. reality

- The brief asks to document "`\d`/`\w` Unicode classes" as a dialect difference. **There is none.**
  ECMA-262 `\d`/`\w`/`\b` are ASCII without the `i` flag, and a JSON Schema pattern has no flags.
  RE2's are ASCII too. The README documents them as agreeing. A cross-check test pins `\d`, `\D`,
  `\w` and `\W` against V8 over every BMP code point and a sample of astral ones. The differences
  that actually exist are `.` and `\s`, which the translator rewrites.
- re2js 2.x has an opt-in `LOOKBEHINDS` flag. It is not set, and lookbehind is refused by the
  translator before compile anyway.
- re2js's `C`/`Cn` match V8's semantics; I checked every code point. The differences are only
  between Unicode versions: V8 in Node 22 uses 16.0 and re2js uses 17.

## Review

No `code-reviewer` subagent was available to this worker (sub-agents are restricted to
`web-fetch`). I did a self-review pass before measuring coverage and it changed three things:
`_hex` no longer wraps a value that cannot fail in a `Result`; type predicates that narrowed to
`never` were removed; and the source split no longer has an unreachable `?? 0`. **An independent
review at the gate is therefore the first independent review this code gets.** Areas worth
adversarial attention: the translator's class and quantifier state machine, and the `Script=`
deny-list.

## Open questions

None blocking.
