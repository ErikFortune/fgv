# Stream brief: `ts-app-shell-styling-hardening`

**Status:** 🟢 ready to commission
**Integration branch:** `ts-app-shell-styling-hardening` (off `release`) → squash to `release` at close
**Workflow shape:** single implementation PR onto integration branch
**Package surface:** `@fgv/ts-app-shell` (`messages` packlet primarily — icon SVGs, `MessagesContextProvider`) + README setup section + `.ai/instructions/LIBRARY_CAPABILITIES.md`

---

## Mission

Harden `@fgv/ts-app-shell` against the most common consumer misconfiguration: forgetting to add the package's `lib/**/*.{js,jsx}` glob to their Tailwind `content` array. When that happens today, Tailwind tree-shakes every geometry utility used inside ts-app-shell (`h-3.5`, `w-3.5`, `absolute`, `left-2`, `top-1/2`, `-translate-y-1/2`, `p-1`, …) while still resolving theme tokens (`text-muted`, `bg-surface`) because the consumer uses those in their own source. Result: the `messages` panel renders correctly *except* for invisible icon buttons, off-screen-sized magnifying-glass overlay, and other geometry-dependent affordances. Silent, hard to diagnose, awful user experience.

**Origin.** 2026-05-29 cross-repo debugging session: personaility at `@fgv/ts-app-shell@5.1.0-32` reported "no filter button visible." DOM inspection confirmed the buttons exist with the correct class names (`h-3.5 w-3.5 text-muted`) but no CSS rules behind them; clicking near them surfaced a giant magnifying-glass icon overlaying the page (search input's absolutely-positioned icon, sized to defaults). Diagnosis: personaility hasn't followed the ts-app-shell README's "add `./node_modules/@fgv/ts-app-shell/lib/**/*.{js,jsx}` to your `content` array" step. README is correct but easy to miss; failure mode is silent and misleading.

**Gap-then-fix posture.** The fix is on personaility's side (one line in `tailwind.config.js`), but the failure mode is bad enough that the next consumer will hit it too. The right move is to make ts-app-shell **defensively rendered** (Layer 1) and **self-diagnosing** (Layer 2) so this misconfiguration surfaces immediately and the worst visual symptoms don't manifest.

---

## Locked design — two layers

### Layer 1 — Defensive geometry on icon buttons

The geometry-critical sites are small and well-bounded: Heroicon SVGs that *must* render at a fixed pixel size, plus a handful of absolutely-positioned overlays. Add inline `style={{ width, height }}` (plus `position`/`left`/`top` where applicable) alongside the Tailwind classes so the elements size correctly even when Tailwind's geometry utilities are absent.

Concrete sites (verified from current `StatusBar.tsx` source):

| Site | Current classes | Add inline style |
|---|---|---|
| Header toolbar icons (Funnel, Copy, X, Check) | `className="h-3.5 w-3.5 text-muted"` | `style={{ width: 14, height: 14 }}` |
| Per-row copy icon | `className="h-3 w-3 text-muted"` | `style={{ width: 12, height: 12 }}` |
| Search input MagnifyingGlassIcon | `className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted"` | `style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14 }}` |
| Search clear-button `×` | `className="absolute right-2 top-1/2 -translate-y-1/2 ..."` | `style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}` |

**Scope discipline:** Only the icon SVGs and absolutely-positioned overlays where Tailwind absence produces *catastrophic* layout failure (off-screen-sized icons, page-overflowing positioned elements). Do **not** inline-style the entire `messages` packlet. The Tailwind preset is the canonical styling path; Layer 1 is purely a "don't break catastrophically when the consumer forgets the content path" guard.

**Apply across the `messages` packlet** — `StatusBar.tsx` is the worst offender but the per-row copy icon in `MessageRow.tsx` (or wherever it lives) has the same risk. Sweep the packlet for `<HeroIcon className="h-N w-N ...">` and `<HeroIcon className="absolute ...">` patterns. Out of scope: other packlets (sidebar, column-cascade, modal) unless the agent surfaces an equally-catastrophic site there — if so, surface as an open question rather than expanding scope unilaterally.

### Layer 2 — Self-diagnosing probe + message

On `MessagesContextProvider` mount, emit one diagnostic message if Tailwind geometry utilities aren't loaded:

```tsx
React.useEffect(() => {
  if (probeHasRun.current) return;
  probeHasRun.current = true;

  const probe = document.createElement('div');
  probe.className = 'h-3.5';
  probe.setAttribute('aria-hidden', 'true');
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.style.pointerEvents = 'none';
  document.body.appendChild(probe);

  // Read in a rAF so the browser applies CSS first
  requestAnimationFrame(() => {
    const height = probe.getBoundingClientRect().height;
    probe.remove();
    if (height === 0) {
      addMessage('warning',
        '@fgv/ts-app-shell styles are not fully loaded. ' +
        'Some icons may not render correctly. ' +
        'See setup docs for the required Tailwind content-path entry.',
        {
          action: {
            label: 'Open setup docs',
            href: 'https://github.com/ErikFortune/fgv/tree/release/libraries/ts-app-shell#setup'
          }
        }
      );
    }
  });
}, [addMessage]);
```

**Design notes:**
- **Idempotent.** A `useRef` boolean (or module-level `Set` keyed by provider instance) guards against double-firing under StrictMode double-render or HMR. Probe runs once per provider lifecycle.
- **Always-on, not dev-only.** A misconfigured production bundle is exactly when the consumer's own dev team is least likely to be watching the console — the in-app message is the only signal that will land. Cost is one DOM measurement on mount.
- **Uses the canonical `addMessage(level, text, options?)` API** (post-#424 two-axis model). Level `'warning'` drives both filterability and styling (warning yellow severity derived from `'warning'` level via `deriveSeverityFromLevel`).
- **`action.href` points at the README anchor.** Add an explicit `## Setup` heading anchor to README if it isn't already a stable target.
- **Probe element styling** uses inline styles (not classes) so the probe itself is unaffected by the very failure it's detecting.

### Layer 3 — README setup discoverability nudges

Small README touch-ups to make the "you must add this content path" requirement harder to miss:

1. Move the setup section above any feature documentation; lead with a `> ⚠️ **Required setup**` callout before the Tailwind snippet.
2. Add a stable `## Setup` anchor for the Layer-2 message's `href`.
3. Add a short "Troubleshooting" section: "If icons appear missing or oversized, your Tailwind config is missing the `@fgv/ts-app-shell` content path. See Setup above."

---

## Acceptance criteria

- [ ] **Layer 1 applied** to every catastrophically-sized icon/overlay in the `messages` packlet (StatusBar header icons, per-row copy icon, search overlay icon + clear button). Inline styles set the pixel dimensions and positioning that Tailwind classes would have set. No other ts-app-shell packlets touched unless the agent surfaces an equally-bad site (open question first).
- [ ] **Layer 2 probe** in `MessagesContextProvider` mounts a 0-height-on-no-Tailwind test element, measures it on next frame, and emits exactly one `'warning'` message with an `action.href` to the README setup anchor when Tailwind is absent. Idempotent under StrictMode and HMR.
- [ ] **Layer 3 README** has a top-of-document "Required setup" callout, a stable `## Setup` anchor, and a "Troubleshooting" section referencing the missing-content-path symptom.
- [ ] **Functional test** for the probe: render `MessagesContextProvider` in a jsdom environment with a stylesheet that *does not* size `h-3.5`, assert one warning message lands with the expected `href`. Then render with a stylesheet that *does* size `h-3.5`, assert no message lands.
- [ ] **Functional test** for Layer 1: snapshot the icon SVGs render with `width`/`height` inline attributes set (smoke-level check that the defensive style props are wired).
- [ ] **No `any` types.** All Result-pattern conformance preserved. `addMessage` call uses the canonical API.
- [ ] `rushx build` passes in `libraries/ts-app-shell`.
- [ ] **`rushx lint` passes** in `libraries/ts-app-shell` (load-bearing — see `CODING_STANDARDS.md`).
- [ ] `rushx test` passes with 100% coverage in `libraries/ts-app-shell`.
- [ ] **`rushx fixlint` was run before the final commit.**
- [ ] `LIBRARY_CAPABILITIES.md` updated: under the `StatusBar` entry, note "ts-app-shell self-diagnoses missing Tailwind content-path setup via an in-panel warning message on mount."

---

## Out of scope

- **Ship pre-compiled CSS as an alternative to Tailwind.** The Tailwind preset + theme.css path is the canonical distribution; the failure mode is a *consumer-side* config gap, not a missing distribution channel. Adding a second styling-distribution channel is a separate (heavier) discussion if it ever comes up.
- **Inline-style every Tailwind class in ts-app-shell.** The whole point of the preset is consumers run Tailwind. Layer 1 is *only* for the catastrophic-failure-mode sites.
- **Other packlets** (sidebar, column-cascade, modal, theme provider). The visible bug is in `messages`; if the agent finds an equally-catastrophic site elsewhere it surfaces as an open question.
- **Reworking the README from scratch.** Layer 3 is targeted nudges, not a rewrite.
- **Personaility-side config change.** The consumer fix (add the content path entry) is upstream of this stream — Erik forwards that pointer separately so personaility is unblocked while this stream lands.
- **`MessagesContext`'s `maxMessages` cap / per-row format / time-of-day formatting** — orthogonal to the diagnostic question.

---

## Reading list (start here)

1. `libraries/ts-app-shell/src/packlets/messages/StatusBar.tsx` — the icon SVG sites that need Layer 1.
2. `libraries/ts-app-shell/src/packlets/messages/MessagesContext.tsx` — where Layer 2 hooks into provider mount; confirms `addMessage` signature and `IMessage.action` shape.
3. `libraries/ts-app-shell/src/packlets/messages/types.ts` (or wherever `IMessage` / `ICreateMessageOptions` live) — confirm the `action: { label, href }` field shape.
4. `libraries/ts-app-shell/README.md` — current setup section to nudge.
5. `libraries/ts-app-shell/tailwind-preset.cjs` and `theme.css` — confirm the canonical setup path the diagnostic message points at.
6. `.ai/instructions/LIBRARY_CAPABILITIES.md` — update the `StatusBar` description.

## Reference for design context

- Cross-repo trigger: 2026-05-29 personaility debug session — `9 of 74 messages` panel rendered with invisible filter/copy/X icon buttons and a viewport-overflowing magnifying-glass overlay. DOM proved the classes were in the markup; CSS bundle proved Tailwind hadn't generated the geometry rules. Root cause: missing `content` path entry on personaility's Tailwind config.
- Post-#424 messages packlet model: `IMessage.level: MessageLogLevel` (filter axis), `severity?: MessageSeverity` (display axis); `addMessage(level, text, options?)`; level→severity derivation via `deriveSeverityFromLevel`.

---

## PRs

| Phase | PR | Status |
|---|---|---|
| Substrate prep | (this PR) | open → integration branch |
| Implementation | TBD | not yet commissioned |
