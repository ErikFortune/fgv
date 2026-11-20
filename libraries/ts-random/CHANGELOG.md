# Change Log - @fgv/ts-random

This log was last generated on Fri, 20 Nov 2026 05:01:24 GMT and should not be manually modified.

## 5.1.0
Fri, 20 Nov 2026 05:01:24 GMT

### Minor changes

- Initial release: seeded, reproducible pseudo-random generation for test data, sampling, shuffles and procedural content. Not cryptographically secure — use `ICryptoProvider.generateRandomBytes` from `@fgv/ts-extras` for tokens, salts or keys.
- `Generator.PseudoRandomGenerator`: floats, integers, inclusive ranges, weighted booleans, strings and picks from candidate pools, reproducible from a string or numeric seed.
- Weighted choice: `pickWeighted` on the generator, and the pure `pickWeightedAt(unit, candidates)` for the same choice from a hash or stored draw.
- `GeneratorData` corpora: character classes (`Chars`) and word lists (`Words`) for readable identifiers and fixtures.

