# Baseline

The minimum `release` branch commit that all branches in the current
wave must descend from. Bumped by the orchestrator when a new wave
launches or when a cleanup batch lands that must be in the base
going forward.

---

**Current baseline**: *(not yet pinned — pin with the first wave's
base commit when you launch the first workstream)*

To pin:
```
git log --oneline -1 release   # get the commit sha
# then update this file:
# **Current baseline**: <sha> — <YYYY-MM-DD> — <one-line description>
```
