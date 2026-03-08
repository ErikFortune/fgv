# Active Development Guidelines

This document covers guidelines specific to the libraries and applications currently under active development. These rules supplement the general coding standards.

## Active Development Scope

### The Chocolate Lab Application
- **App**: `apps/chocolate-lab-web` - React web application
- **Plans**: Technical and UX plans are in `.md` files in the app directory
- **Playwright tests**: `apps/chocolate-lab-web/e2e/`

### Supporting Libraries (all new, all actively developed)
| Library | Path | Purpose |
|---------|------|---------|
| `ts-chocolate` | `libraries/ts-chocolate` | Core data model and runtime entities |
| `ts-app-shell` | `libraries/ts-app-shell` | Shared React app shell primitives |
| `chocolate-lab-ui` | `libraries/chocolate-lab-ui` | Chocolate Lab-specific React components |
| `chocolate-lab-web` | `apps/chocolate-lab-web` | The web application |

### Other Libraries (production, handle with care)
Everything else under `libraries/` is in production. See [Compatibility Rules](#compatibility-rules).

---

## Compatibility Rules

### New Libraries: No Compatibility Burden

The four active-development packages (`ts-chocolate`, `ts-app-shell`, `chocolate-lab-ui`, `chocolate-lab-web`) are **all new code**. Compatibility is **not** a consideration:

- **Do not** preserve deprecated values, types, or re-exports
- **Do not** add backwards-compatibility shims or renamed aliases
- **Do not** leave dead code "just in case"
- If a change is necessary or appropriate, **break compatibility and fix consumers** rather than accumulating cruft
- Trying to preserve compatibility in new code leads to bloat and confusion

### Production Libraries: Be Careful

All other libraries under `libraries/` are in production:

- Breaking changes require careful consideration of downstream impact
- **When in doubt, ask** before making breaking changes
- Follow semantic versioning principles
- Check for consumers before removing or renaming exports

---

## Testing Philosophy During Active Development

### Prioritize Functional Breadth Over Measured Coverage

The repo requires 100% coverage to merge to `main`, but during active development:

1. **Focus on functional correctness** - Write tests that verify behavior, not just hit lines
2. **Coverage metrics come later** - Once code settles down, fill coverage gaps systematically
3. **Don't skip tests** - Still write tests, just prioritize breadth of behavior over coverage percentage

### Playwright E2E Tests

The app has a growing set of Playwright tests in `apps/chocolate-lab-web/e2e/`. Key considerations:

- **Recent addition** - Most existing UI code was not written with Playwright in mind
- **Test IDs needed** - Adding tests often requires updating UI components with `data-testid` attributes
- **Growing investment** - Each test we add and each helper we write makes the next test easier
- **Helpers and fixtures** - Build reusable test helpers rather than duplicating setup code

### Balance Effort vs Value

- Don't spend an hour writing tests for a 5-minute fix
- Use judgment about when a Playwright test adds enough value to justify the markup and helper work
- When in doubt, ask

---

## General Principles

### Correctness Over Convenience

Prioritize correctness over ease, convenience, or brevity:

- Follow all repo guidelines including Result pattern with chaining
- Don't take shortcuts that sacrifice type safety or error handling
- A correct, slightly verbose solution is better than a clever but fragile one
