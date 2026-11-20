# Change Log - @fgv/ts-extras-system-one

This log was last generated on Fri, 20 Nov 2026 05:01:24 GMT and should not be manually modified.

## 5.1.0
Fri, 20 Nov 2026 05:01:24 GMT

### Minor changes

- Initial release: a Result boundary over `@typesafe-ai/sdk` for System-1 decision servers (CLM, openjev, Jev), which answer typed yes/no, choice and score questions with a distribution over closed candidates. Node only.
- `askSystemOne` validates every answer and classifies failures; `measureSystemOneInput` enforces a mandatory input bound before a request is sent.

