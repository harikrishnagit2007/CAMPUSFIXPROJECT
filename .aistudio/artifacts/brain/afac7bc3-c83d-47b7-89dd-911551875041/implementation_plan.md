# Implementation Plan - Fix PitchDeckModal Unresolved Import Vercel Build Error

## Proposed Changes

### 1. Create `src/components/PitchDeckModal.jsx`
- Create `src/components/PitchDeckModal.jsx` exporting `PitchDeckModal` returning `null`.
- This ensures that any Vercel/GitHub build importing `./components/PitchDeckModal` resolves cleanly without `UNRESOLVED_IMPORT` errors.

## Verification Plan
- Compile applet with `compile_applet`.
- Run linter with `lint_applet`.
