[Home](../../README.md) > [Bcp47](../README.md) > [LanguageTag](./LanguageTag.md) > effectiveScript

## LanguageTag.effectiveScript property

The effective script of this language tag, if known.
The effective script is the script subtag in the tag itself,
if present, or the `Suppress-Script` defined in the
https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry | IANA subtag registry
for the primary language of this tag.  Can be `undefined`
if neither the tag nor the IANA registry define a script.

**Signature:**

```typescript
readonly effectiveScript: ScriptSubtag | undefined;
```
