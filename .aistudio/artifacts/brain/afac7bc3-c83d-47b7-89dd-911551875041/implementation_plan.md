# Implementation Plan - AI Chat Agent Firestore Intent Recognition & Confirmation Prompt

## Proposed Changes

### 1. AI Chatbot Component (`src/components/GeminiChatBot.jsx`)
- **'Submit Issue' Intent Recognition**:
  - Update chat agent parsing to detect when a user is describing a maintenance issue.
  - Extract structured details (Category, Location/Building, Title, Description, Priority) from the message text and attached image.
- **Confirmation Prompt & Direct Firestore Write**:
  - When 'Submit Issue' intent is recognized, the AI Agent presents a summary card inside the chat bubble with a **[Confirm & Save to Firestore]** action button.
  - When the user clicks confirmation, the agent directly writes a new complaint record to the Firestore `complaints` collection (or calls the backend/Firestore), displaying the generated ticket ID and confirmation.

## Verification Plan
- Compile applet with `compile_applet`.
- Run linter with `lint_applet`.
