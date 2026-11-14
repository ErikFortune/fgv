[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / maxUpdateIdSuffixLength

# Variable: maxUpdateIdSuffixLength

> `const` **maxUpdateIdSuffixLength**: `number` = `25`

The longest suffix [taskUpdateId](../functions/taskUpdateId.md) or [baselineUpdateId](../functions/baselineUpdateId.md) appends to a task id: a
separator, up to sixteen revision digits (`Number.MAX_SAFE_INTEGER` has sixteen), a separator and
either one ordinal digit or the word `initial`. (T7: grew from 19 for the baseline suffix.)
