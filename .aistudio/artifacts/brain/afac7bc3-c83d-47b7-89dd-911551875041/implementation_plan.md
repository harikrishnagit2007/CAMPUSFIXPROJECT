# Implementation Plan - Video Background Integration & Demo Fill Cleanup

The goal of this task is to integrate the provided video URL as a full-screen, background video on the Login Page (`AuthPage.jsx`) with a subtle dark overlay for visual contrast, and remove the "Demo Fill" option for Student logins.

## Proposed Changes

### 1. Full-Screen Background Video Integration (`AuthPage.jsx`)
- Wrap the main wrapper in `AuthPage.jsx` with a relative container (`position: relative`, `overflow: hidden`, `minHeight: 100vh`).
- Render a HTML5 `<video>` element set to `autoPlay`, `loop`, `muted`, and `playsInline` pointing to `https://videotourl.com/videos/1793713749379-671ad0a0-c664-44e3-aed7-741103a67a90.mp4`.
- Apply `position: absolute`, `inset: 0`, `width: 100%`, `height: 100%`, `objectFit: cover`, and `zIndex: 0`.
- Add a dark overlay div (`background: rgba(15, 23, 42, 0.68)`, `zIndex: 1`) over the video to ensure WCAG-compliant contrast and crisp text legibility.
- Elevate the login form container (`zIndex: 10`, `position: relative`) with a clean card container.

### 2. Demo Fill Option Cleanup (`AuthPage.jsx`)
- Update the "Demo Fill" button logic in the login form.
- Specifically hide/remove the "⚡ Demo Fill" button when the selected portal is `STUDENT` (`selectedPortal !== 'STUDENT'`).
- Ensure student logins require typing valid credentials or using Google Auth directly.

---

## Verification Plan

### Automated Build & Compilation
- Run `compile_applet` to verify React compilation without syntax or JSX errors.

### Manual / Browser Verification
- Open the application on the Login page (`AuthPage.jsx`).
- Verify that the background video plays seamlessly in a loop behind a subtle dark overlay.
- Confirm that all login form text, portal selector tabs, inputs, and buttons are clear and readable.
- Check that switching to the "Student" portal hides the "⚡ Demo Fill" button.
