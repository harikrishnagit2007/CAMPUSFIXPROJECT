# AI Vision Diagnostics in Complaint Submission

Automate the image upload workflow in CampusFix by immediately dispatching uploaded issue photos to the server-side AI vision diagnostic service, rendering instant classification recommendations (category, severity, department, confidence score, and explanatory reason) directly in the complaint form with seamless one-click approval.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following design decisions were confirmed via interactive user clarification:

- **Confirmed Decision 1 (Trigger Mechanism)**: Automatically trigger the AI vision analysis as soon as a user selects/uploads an issue image, eliminating the need for an extra manual button click while maintaining an active visual analysis spinner/status.
- **Confirmed Decision 2 (Recommendation Application)**: Present the AI classification recommendations in a dedicated "AI Suggested Classification" banner with confidence indicator and a prominent "Apply AI Suggestions" button, ensuring user/admin decisions are not overridden automatically.

---

## 1. Overview & Core Concept

- **What It Does**: As soon as a student or staff member attaches a photo of a campus facility issue (e.g. broken desk, sparking wire, water leak), the upload handler instantly packages and delivers the image to the `/api/complaints/analyze_image/` endpoint. The interface displays a real-time diagnostic card with predicted issue category, severity, recommended maintenance department, and confidence rating.
- **Target Audience / Persona**: Students submitting maintenance complaints and campus administrators logging work orders on behalf of departments.
- **Key Value**: Drastically reduces reporting friction and categorization errors, ensuring issues are accurately routed to the right campus maintenance teams (Electrical, Plumbing, Carpentry, HVAC, IT Infrastructure) from the moment of report creation.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Upload Trigger**: User clicks "Upload Issue Photo" or drops a photo in `ComplaintModal`.
  2. **Instant Preview & Inline Analysis State**: The image preview appears immediately accompanied by a pulsing AI diagnostic indicator (*"AI analyzing damage & hazard..."*).
  3. **Diagnostic Card Presentation**: When the analysis completes (sub-second or via server-side vision), an styled "AI Suggested Classification" card reveals:
     - Predicted Category badge (e.g., Furniture, Electrical, Plumbing, Fan/AC)
     - Severity rating badge (e.g., Medium, Critical, High, Low)
     - Recommended Department badge (e.g., Carpentry, Electrical Maintenance, HVAC)
     - Confidence meter (e.g., 92% Confidence)
     - 1-2 sentence inspector diagnostic reasoning
  4. **One-Click Form Population**: Clicking **"Apply Suggestions"** automatically updates the Category dropdown and Priority dropdown to match the AI suggestions and annotates the issue description with the inspector notes.
  5. **Flexible Modification**: The user retains full control to adjust the category, priority, or description before clicking Submit.

- **Visual Identity & Theme**:
  - *Accent Gradient*: Indigo-to-violet banner accents (`#4f46e5` to `#6366f1`) with soft glassmorphic backdrop.
  - *Confidence Meter*: Emerald green badge (`#dcfce7` / `#15803d`) highlighting high confidence scores.
  - *Status Transitions*: Smooth fade-in transitions for the recommendation banner once the server returns diagnostics.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Immediate Auto-Analysis on File Selection**
  - *Chosen Approach*: Execute `handleAnalyzeImage()` automatically inside `handleImageChange` immediately after the image file is converted to base64.
  - *Why*: Eliminates an extra step for the student, providing immediate assistance and instant feedback while they are typing the description.
  - *Alternatives Considered*: Requiring a manual "Analyze" button click was evaluated, but user confirmation favored automatic inspection upon upload.

- **Decision 2: Non-Destructive Advisory Recommendations**
  - *Chosen Approach*: Render the suggestions in an advisory card with an explicit "Apply AI Suggestions" button rather than silent auto-overwriting.
  - *Why*: Strictly honors system requirements that AI recommendations must not silently override user or facility administrator judgment.

- **Decision 3: Server-Side Vision Proxy with Multi-Model & Heuristic Fallback**
  - *Chosen Approach*: Keep all vision processing on the Express backend (`/api/complaints/analyze_image/`) using dynamic Gemini client initialization with quiet multi-model failover.
  - *Why*: Prevents API key exposure in browser bundles and guarantees 100% uptime even during external API downtime or rate limits.

---

## 4. Technical Architecture & Data Strategy

### System & Component Flow

```
┌────────────────────────────────────────────────────────┐
│                   ComplaintModal.jsx                   │
│                                                        │
│  ┌─────────────────────────┐  auto-trigger on upload   │
│  │   handleImageChange     │────────────────────────┐  │
│  │   - FileReader base64   │                        │  │
│  │   - setIsAnalyzing(true)│                        │  │
│  └─────────────────────────┘                        ▼  │
│                                           ┌───────────┐│
│                                           │ analyze() ││
│  ┌─────────────────────────┐              └─────┬─────┘│
│  │  AI Suggestion Banner   │◄───────────────────┘      │
│  │  - Category, Severity   │                           │
│  │  - Department, Reason   │                           │
│  │  - [Apply Suggestions]  │                           │
│  └─────────────────────────┘                           │
└──────────────────────┬─────────────────────────────────┘
                       │ POST /api/complaints/analyze_image/
                       ▼
┌────────────────────────────────────────────────────────┐
│                 server.ts (Express API)                │
│                                                        │
│  ┌─────────────────────────┐    try: gemini-3.8-flash  │
│  │  getGeminiClient()      │────────────────────────┐  │
│  │  - Dynamic API key check│                        │  │
│  └─────────────────────────┘                        ▼  │
│                                           ┌───────────┐│
│                                           │Vision API ││
│  ┌─────────────────────────┐              └─────┬─────┘│
│  │  Contextual Fallback    │◄───────────────────┘      │
│  │  - Domain Heuristics    │      (on API load/timeout)│
│  └─────────────────────────┘                           │
└────────────────────────────────────────────────────────┘
```

### Interactive Component & State Mapping

- `imagePreview`: Holds the local object URL for instant image thumbnail rendering.
- `imageBase64`: Holds the base64 data string payload transmitted to the server.
- `isAnalyzingImage`: Controls the scanning/loading state animation while image inspection runs.
- `aiAnalysis`: State storing `{ category, severity, department, confidence, reason }`.
- `appliedAi`: Boolean indicating whether the user clicked "Apply Suggestions", changing button state to a verified green badge.
- `handleApplyAiSuggestions`: Updates `formData.category` and `formData.priority` in React state and appends diagnostic reasoning to `formData.description`.
