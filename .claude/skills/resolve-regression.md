---
description: Resolve a regression in the Chocolate Lab web application using lite TDD with Playwright
user_invocable: true
---

# Resolve Regression in Chocolate Lab Web

You are resolving a regression in the Chocolate Lab web application. Follow this structured workflow to ensure the fix is correct and the regression is protected against in the future.

## Context

- **App**: `apps/chocolate-lab-web` - React web application
- **Plans**: Technical and UX plans are `.md` files in the app directory - consult them for intended behavior
- **UI Library**: `libraries/chocolate-lab-ui` - Chocolate Lab-specific components
- **App Shell**: `libraries/ts-app-shell` - Shared React app shell primitives
- **Data Layer**: `libraries/ts-chocolate` - Core data model and runtime entities
- **Existing E2E tests**: `apps/chocolate-lab-web/e2e/`
- **Playwright config**: `apps/chocolate-lab-web/playwright.config.ts`

## Workflow: Lite TDD for Regressions

### Phase 1: Understand the Regression

1. Read the user's description carefully. Identify what *used to work* and what *broke*.
2. Check recent git history (`git log --oneline -20`) to identify likely culprits.
3. Review the relevant plan documents in `apps/chocolate-lab-web/` to understand intended behavior.
4. Trace the code path from the UI component through `chocolate-lab-ui` and into `ts-chocolate` if needed.

### Phase 2: Write a Failing Test First

Before fixing anything, create a Playwright test that demonstrates the regression:

1. **Assess test feasibility** - Is this regression testable with Playwright in a reasonable amount of effort?
   - If yes, proceed to write the test
   - If no (e.g., purely internal state issue, would require extensive new test infrastructure), ask the user whether to invest in the test or fix directly

2. **Add `data-testid` attributes** to any UI elements that need them for the test. This is expected and encouraged - it makes future tests easier too.

3. **Write the test** in `apps/chocolate-lab-web/e2e/app.spec.ts` (or a new spec file if the scope warrants it). Follow the patterns in existing tests:
   - Use `page.getByTestId()` for element selection
   - Use `waitUntil: 'networkidle'` for navigation
   - Write clear test descriptions that explain what regressed

4. **Build reusable helpers** when the setup is non-trivial. Check existing helpers at the top of `app.spec.ts` first.

5. **Run the test and verify it fails** with `rushx test:e2e` from the app directory. This confirms the test actually catches the regression.

### Phase 3: Fix the Regression

1. Make the minimal fix needed. Don't refactor surrounding code.
2. These four packages are all new code - **compatibility is not a concern**. If the right fix involves changing an interface or removing a deprecated path, do it and fix consumers.
3. Follow all repo coding standards: Result pattern, no `any`, proper error context.
4. If the fix touches `ts-chocolate`, `ts-app-shell`, or `chocolate-lab-ui`, rebuild before testing: `rush build`

### Phase 4: Verify the Fix

1. Run the Playwright test again and confirm it passes.
2. Run the full e2e suite: `rushx test:e2e` from the app directory.
3. If the fix touched library code, run that library's tests too: `cd libraries/<lib> && rushx test`

### Phase 5: Test Quality Review

Invoke the `@senior-sdet` subagent to review the Playwright test for:
- Correctness and reliability (no flaky selectors, proper waits)
- Reusable helper opportunities
- Whether the test adequately protects against the specific regression
- Whether the `data-testid` attributes follow consistent naming conventions

## Important Reminders

- **Correctness over speed** - A correct fix with a good test is worth more than a quick patch
- **No compatibility shims** - These are new libraries; break interfaces if needed and fix consumers
- **Balance effort** - If the Playwright test would take disproportionately long compared to the fix, discuss with the user first
- **Webpack quirk** - If the dev server doesn't pick up library changes, kill and restart it
- **Build order** - Library changes need `rush build` before the app sees them
