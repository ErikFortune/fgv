# @fgv/ts-random

Seeded, reproducible pseudo-random generation for TypeScript, plus character-class and word-list
corpora. The same seed replays the same sequence, and a generator can be cloned or forked so a
sub-sequence stays reproducible regardless of what the parent draws next. Fallible entry points
return `Result<T>` from `@fgv/ts-utils`.

**Not cryptographically secure.** The generator is mulberry32 over a 32-bit state. Never use it for
tokens, session ids, salts, nonces, passwords or key material; use
`ICryptoProvider.generateRandomBytes` from `@fgv/ts-extras` for those.

## Installation

```sh
npm install @fgv/ts-random
```

## Usage

```ts
import { Generator, GeneratorData } from '@fgv/ts-random';

const rng = Generator.PseudoRandomGenerator.create({ seed: 'demo' }).orThrow();

rng.nextInt(10); // [0, 10)
rng.nextInRange(1, 6); // inclusive of both bounds
rng.nextString(8, GeneratorData.Chars.hexDigits);

const { Words } = GeneratorData;
rng.pickSequential({ how: 'sequence', candidates: [Words.Adjectives, Words.Animals] }).join('-');

const child = rng.createChild('fixtures'); // reproducible independently of the parent's later draws
```

An omitted seed defaults to `Date.now()`, which is not reproducible; pass one wherever a run needs
to be replayed.

| export | what it is |
|---|---|
| `Generator.PseudoRandomGenerator` | draws: `nextFloat`, `nextInt`, `nextInRange`, `nextBoolean`, `nextString`, `pickNext`, `pickWeighted`, `pickSequential`, `pickRandom`; forks with `clone` and `createChild` |
| `Generator.SeededRandomSource` | the underlying seeded state, with a substitutable step function |
| `Generator.pickWeightedAt` | weighted choice as a pure function of a unit value in `[0, 1]` |
| `GeneratorData.Chars` | character classes (`hexDigits`, `base64Url`, `alphanumeric`, …) |
| `GeneratorData.Words` | word lists (`Adjectives`, `Animals`, `Cities`, `FirstNames`, …) |

See [CAPABILITIES.md](./CAPABILITIES.md) for the full surface, including the shape of the `pick*`
parameters and the weighted-pick rules.

## License

MIT — see [LICENSE](./LICENSE).
