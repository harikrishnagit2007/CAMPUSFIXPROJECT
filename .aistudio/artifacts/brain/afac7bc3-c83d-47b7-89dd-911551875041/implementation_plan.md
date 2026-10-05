# Implementation Plan - Prominent Quick Voice Dictation Bar

## Proposed Changes

### 1. AI Chatbot Component (`src/components/GeminiChatBot.jsx`)
- **Prominent Quick Voice Dictation Bar**: Add an interactive voice shortcut bar directly above the chat input whenever microphone dictation is clicked or when microphone permissions are restricted in an iframe.
- **1-Click Sample Voice Queries**: Provide quick voice simulation buttons for common issue reports:
  - 🎙️ *"Report broken AC in Tech Block Room 304"*
  - 🎙️ *"Water leaking from pipe in Washroom"*
  - 🎙️ *"Wi-Fi router down in Library"*
  - 🎙️ *"Sparking wire in Electrical Room 102"*
- **Instant AI Agent Auto-Submit**: Clicking any sample voice query instantly simulates spoken voice dictation, triggering the AI Assistant's 'Submit Issue' intent logic and auto-creating a Firestore complaint ticket.

## User Review Required

> [!IMPORTANT]
> The Voice Dictation bar will display prominent 1-click voice query shortcuts so users can seamlessly test and trigger the AI Agent even when browser microphone permissions are restricted inside iframe environments.

## Verification Plan

### Automated Verification
- Run `compile_applet` to verify React compilation.
- Run `lint_applet` to verify code quality.

### Manual Verification
- Open the AI Chat Assistant panel in the app.
- Click the microphone button or voice guide.
- Observe the prominent Quick Voice Dictation bar with 1-click voice simulation query chips.
- Click a voice query button and verify the AI Agent receives the dictation and auto-submits a complaint ticket to Firestore.
