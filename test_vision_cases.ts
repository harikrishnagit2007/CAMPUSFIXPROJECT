import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
});

export const VISION_PROMPT = `You are an expert college campus facility & physical maintenance inspector.
Analyze this uploaded image carefully.

First, determine if the image actually shows a physical campus facility maintenance issue, physical damage, breakdown, hazard, or cleanliness issue (such as damaged electrical switch/wiring, leaking plumbing pipes/faucets, broken desks/chairs/furniture, ceiling fan/AC leak, broken classroom projector, network cable damage, dirty facilities, etc.).

CRITICAL INSTRUCTIONS FOR UNRELATED IMAGES:
If the image is NOT a physical campus maintenance issue (for example: a laptop/computer screenshot, an online test or examination screen, code, a food receipt/restaurant bill, a selfie or personal portrait, outdoor scenic landscape, vehicle, animals, artwork, solid color, etc.):
- Set "isMaintenanceIssue": false
- For "detectedIssue": State precisely and truthfully what is actually visible in the image (e.g. "Laptop screenshot showing examination portal", "Food receipt / restaurant bill", "Personal portrait photo").
- Set "category": "Other"
- For "description": Describe what is genuinely visible on the screen or image without inventing any damage.
- Set "severity": "Low"
- Set "department": "General Administration"
- For "reason": Explain clearly: "Not a campus maintenance issue. The image depicts [explain visible contents] rather than campus facility damage."

CRITICAL INSTRUCTIONS FOR GENUINE MAINTENANCE ISSUES:
If the image DOES depict a real campus facility issue:
- Set "isMaintenanceIssue": true
- For "detectedIssue": Describe the specific defect seen (e.g. "Damaged wall electrical outlet with exposed wiring", "Active pipe joint water leak", "Broken chair leg/armrest").
- For "category": Select strictly the best matching category from: ['Electrical', 'Furniture', 'Classroom', 'Wi-Fi/Network', 'Plumbing', 'Cleaning', 'Projector', 'Fan/AC', 'Other']
- For "description": Detail the visible damage, hazard, or defect.
- For "severity": Choose from ['Low', 'Medium', 'High', 'Critical'] (use Critical for imminent hazards like exposed live electricity, gas, or severe flooding).
- For "department": Recommend the appropriate department (e.g. 'Electrical Maintenance', 'Civil & Plumbing', 'Carpentry', 'HVAC & Climate Control', 'IT Infrastructure', 'Housekeeping & Cleaning').
- For "confidence": A realistic confidence float between 0.70 and 0.99.
- For "reason": 1-2 sentences summarizing the physical evidence.

Never hallucinate problems that are not clearly visible.`;

export async function analyzeCampusImage(base64Data: string, mimeType: string = 'image/png') {
  const contentPayload = {
    parts: [
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
      {
        text: VISION_PROMPT,
      },
    ],
  };

  const config = {
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        isMaintenanceIssue: { type: Type.BOOLEAN },
        detectedIssue: { type: Type.STRING },
        category: { type: Type.STRING },
        description: { type: Type.STRING },
        severity: { type: Type.STRING },
        department: { type: Type.STRING },
        confidence: { type: Type.NUMBER },
        reason: { type: Type.STRING },
      },
      required: [
        'isMaintenanceIssue',
        'detectedIssue',
        'category',
        'description',
        'severity',
        'department',
        'confidence',
        'reason',
      ],
    },
  };

  const resp = await ai.models.generateContent({
    model: 'models/gemini-3.5-flash-lite',
    contents: contentPayload,
    config,
  });

  const text = resp.text?.replace(/```json/g, '').replace(/```/g, '').trim() || '{}';
  return JSON.parse(text);
}
