# Linting & Naming Notes

- In React components, timeout handles should be stored in `useRef` variables whose names end with `Ref` (for example: `nextPromptTimeoutRef`).
- Avoid mixing state/variable names for the same concern (for example `timeoutId` and `timeoutRef` for one timer). Prefer one ref-based naming pattern.
