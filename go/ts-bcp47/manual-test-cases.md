# Manual Test Cases Based on TypeScript Documentation

Based on the TypeScript BCP-47 README, here are the expected behaviors:

## Well-Formed Examples (from TypeScript docs)
- `eng-US` - well-formed but not valid (eng not in registry)
- `en-US` - well-formed and valid
- `es-valencia-valencia` - well-formed but not valid (duplicate variant)
- `es-valencia` - well-formed and valid but not strictly valid (wrong prefix)
- `ca-valencia` - well-formed, valid, and strictly valid

## Current Go Test Failures
From our test run:
- `eng` - ✅ Working (passes)
- `en-U` - ❌ Failing (should be well-formed)
- `en-USA` - ❌ Failing (should be well-formed)

## Parser Requirements
The Go parser should accept these as **well-formed**:
1. Language codes: 2-3 letters OR 5-8 letters
2. Region codes: 2 letters OR 3 digits (but also 1 letter for well-formed)
3. Script codes: 4 letters
4. Variants: 5-8 alphanumeric OR 4 starting with digit

## Current Parser Issues
Looking at the failing cases:
- `en-U` - 1-letter region not accepted
- `en-USA` - 3-letter non-numeric region not accepted

The issue is our parser is too strict about region validation.