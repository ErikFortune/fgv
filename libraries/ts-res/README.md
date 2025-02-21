<div align="center">
  <h1>@fgv/ts-res</h1>
  Multidimensional Resource Runtime for Typescript
</div>

<hr/>

## Summary

Multidimensional resource runtime for Typescript

## Installation

with npm:
```sh
npm install @fgv/ts-res
```

## API Documentation
Extracted API documentation is [here](./docs/ts-res.md)

## Overview


### TL; DR
*Note:* This library uses the `Result` pattern, so the return value from any method that might fail is a `Result` object that must be tested for success or failure.  These examples use either [orThrow](https://github.com/ErikFortune/fgv/blob/main/libraries/ts-utils/docs/ts-utils.iresult.orthrow.md) or [orDefault](https://github.com/ErikFortune/fgv/blob/main/libraries/ts-utils/docs/ts-utils.iresult.ordefault.md) to convert an error result to either an exception or undefined.

