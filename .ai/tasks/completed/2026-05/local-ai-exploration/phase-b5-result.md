# B-5 Result: testbed shell + CLI integration (+ ts-app-shell theme & styling)

**Branch:** `claude/local-ai-exploration-b5-shell` → PR #411 → `local-ai-exploration`
**Outcome:** the testbed shell + CLI now run the registered scenarios, the app is themed (light/dark), and both scenarios pass a maintainer manual pass.

## Why this phase existed
B-1 scaffolded the testbed shell/CLI; B-3/B-4a added two scenarios + tested their components in isolation but never wired the shell/CLI to run them. The #410 promotion review caught it. B-5 closes the gap before re-promotion.

## What shipped

### Shell + CLI wiring (the core B-5 task)
- **Web shell** (`src/web/App.tsx`): clickable, keyboard-accessible sidebar with selected state; a `ScenarioHost` that builds a real `IScenarioContext` (logger wired to the ts-app-shell StatusBar via `useLogReporter`; in-memory `dataTree`) and drives the `web.initialize` lifecycle (loading → error → ready → mount `web.component`); `no-web` handling; `key`-based remount per scenario. Coordinates with the scenarios' module-level pipeline cache so `initialize()` doesn't double-load.
- **CLI** (`src/cli.ts`): `--scenario <id>` dispatch to `scenario.cli.run(ctx)`; handles missing/unknown id, no-cli-impl, run failure (non-zero exits); bare invocation lists scenarios; `--help` rewritten.

### Gap-fix: `@fgv/ts-app-shell` default theme (upstream extension)
The testbed is the first consumer of ts-app-shell's *visual* components and surfaced that the library ships **no theme** — its components use ~54 custom semantic Tailwind tokens with nothing defining them. Per gap-then-fix, fixed upstream rather than burying guessed tokens in the sample:
- `libraries/ts-app-shell/src/styles/theme.css` — every token as a `--fgv-*` CSS variable, `:root` (light) + `.dark` (dark), WCAG-AA contrast.
- `libraries/ts-app-shell/tailwind-preset.cjs` — maps all 54 token names → vars; `darkMode: 'class'`.
- Heft `config/typescript.json` to emit the CSS asset to `lib/`; `package.json` exports (`./tailwind-preset`, `./theme.css`); README theming docs; `minor` change file. Additive — no breaking changes.

### Testbed consumes the theme + styling
- `tailwind.config.js` adds the preset + a content glob for ts-app-shell's compiled classes; `src/web/index.css` imports `theme.css` + Tailwind directives; `index.tsx` imports it.
- `ThemeProvider` wraps the app; a light/dark **toggle** in the top bar (via `useTheme`).
- Shell chrome (top bar, sidebar selection, main, status bar) and both scenarios' internals styled with the semantic tokens.

### Folded-in #410 review fixes
Dead manual-mock deletion; `App.test.tsx` rationale; `conventions.md` coverage-mechanism wording; testbed + facade READMEs de-scaffolded; facade `package.json` descriptions; `ts-web-extras-transformers` `build` script aligned to `heft build`.

## Runtime issues caught by the manual pass (and why)
The automated gates (jsdom tests + webpack compile) were necessary but not sufficient; the maintainer manual pass caught two browser-only issues:
1. **Dev-server overlay** showed the benign `@huggingface/transformers` `import.meta` *warning* full-screen, reading as a startup error → scoped `ignoreWarnings` + dev overlay set to errors-only.
2. **Embedding scenario crashed on load** ("text may not be null or undefined") and then "extractor is not a function" on search. Root cause: the `FeatureExtractionPipeline` is a callable object; `setExtractor(pipeline)` made React invoke it as a functional state updater (`pipeline(null)` → tokenizer with null). Fixed with the updater form `setExtractor(() => pipeline)`. The jsdom test used a non-callable `{}` mock, which never exercised React's functional-updater path — added a regression test with a callable mock asserting the component never invokes the pipeline directly.

## Gates
- [x] `rush build` green
- [x] `rushx lint` clean (testbed + ts-app-shell)
- [x] `rushx test` — testbed 136 @ 100%; ts-app-shell 77 @ 100%
- [x] production `build:web` compiles; Tailwind generates real utilities (inlined via style-loader); Node facade excluded
- [x] **Maintainer manual pass — functional + visual, light + dark — complete** (Erik): classifier and embedding scenarios run end-to-end; sidebar selection, theme toggle, and both scenarios' styling confirmed.

## Lessons (for the loop)
- **jsdom mocks of callable pipelines must themselves be callable** — otherwise React's functional-updater path (and similar callable-value gotchas) go untested. Generalizes beyond this scenario.
- **`build:web` compiling ≠ runtime correctness.** For browser-mounted scenarios, a maintainer manual pass is load-bearing; two real defects escaped every automated gate.
- **ts-app-shell shipped no theme** — its first visual consumer had to surface it. Now fixed; future consumers get a coherent default + dark mode for free.

## Next (orchestrator)
Re-run cluster-close: artifact finalization (active → completed), sibling-sweep over the updated delta (now includes B-5 + the ts-app-shell theme), fresh promotion PR `local-ai-exploration` → `release` (merge-commit). The deferred follow-ups (generate/text-gen scenario, ai-image port, the toggle-icon Heroicons option, palette retuning) remain tracked.
