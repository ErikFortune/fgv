[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / defaultTaskCapacityLimits

# Variable: defaultTaskCapacityLimits

> `const` **defaultTaskCapacityLimits**: [`TaskCapacityLimits`](../type-aliases/TaskCapacityLimits.md)

The default repository-wide limits.

## Remarks

Engineering defaults chosen in T8 (2026-09-26): a best guess, documented, with room to tune —
**not measured safe maxima for any particular host**. M1 (T8, 2026-09-26) qualified the
*structure* they rest on — minimal archived residency, release of terminal presentation on
archive, and cold-open and rebuild peaks bounded independently of archived history — but no
measurement holds a repository at these ceilings. In particular the heap cost of a full
`resident-payload-bytes` budget is unmeasured; M1's terminal cohort retained about 1.4 heap bytes
per encoded presentation byte, which a host should expect to apply before relying on it.

**What the defaults admit.** Limits are checked together and the first to fill governs. Every
registration reserves its terminal closeout (`maximumClosureCharges`), about 976 KiB of
`logical-bytes`, so under these defaults **`logical-bytes` binds first**: at most 536 plain tracked
registrations of minimal size, fewer with larger tasks, commands in flight or subscriptions holding
baselines. The
`non-archived-tasks` limit of 1,000 is therefore not reachable under the default profile; it is
a ceiling for a host that raises `logical-bytes`, `audience-links` and `acknowledgement-ids`
(each 224 per registration), not a promise this profile keeps.

**Tuning.** Every limit here may be raised: an existing repository through the writer's
`raiseCapacityLimits` (the profile is stored at initialization and a stored limit can be
raised, never lowered, in v1); a new repository by passing an explicit profile to
`initialize`. The bounds a reservation is computed from — envelope, details, stored operation,
audience per update, evidence and receipt size — are the exception: an existing repository refuses
to raise them, since the claims it already holds would no longer cover their work. The default binds only repositories created without one, so changing it later
never reinterprets an existing repository.
