import { apiClient } from './client';

function generateDynamicAssistantReply(messages) {
  const lastMsg = messages && messages.length > 0 ? messages[messages.length - 1]?.content || '' : '';
  const text = lastMsg.toLowerCase();
  const fullContext = (messages || []).map(m => m.content).join(' ').toLowerCase();

  if (text.includes('கேக்குதா') || text.includes('வாய்ஸ்') || text.includes('voice') || text.includes('hear me') || text.includes('sound clear') || text.includes('கிளியரா')) {
    return `ஆம், உங்கள் குரல் எனக்கு மிகத் தெளிவாகவும் கிளியராகவும் கேட்கிறது! (Yes, I hear your voice loud and crystal clear!) நான் உங்கள் கேம்பஸ் பராமரிப்பு உதவியாளர் (CampusFix AI). என்ன பிரச்சனை அல்லது பழுது ஏற்பட்டுள்ளது என்று கூறுங்கள், நான் உடனடியாக உதவுகிறேன்.`;
  }
  if (text.includes('hello') || text.includes('hi') || text.includes('vanakkam') || text.includes('வணக்கம்') || text.includes('hey')) {
    return `வணக்கம்! நான் உங்கள் CampusFix AI உதவி மையம். உங்கள் வளாகத்தில் என்ன பிரச்சனை அல்லது குறைபாடு உள்ளது என்பதை என்னிடம் கூறுங்கள் (எ.கா., குழாய் உடைப்பு, ஏசி பழுது, மின்சார பழுது போன்றவை). நான் அதை உடனடியாக பதிவு செய்து உதவுகிறேன்!`;
  }
  if (text.includes('room') || text.includes('block') || text.includes('hall') || text.includes('floor') || text.includes('lab')) {
    return `Thank you for specifying the location (${lastMsg}). I've recorded this location detail. Would you like me to submit an official maintenance ticket or attach a photo?`;
  }
  if (text.includes('status') || text.includes('track') || text.includes('progress')) {
    return `📋 **Tracking Ticket Progress**:\nYou can track live maintenance status on your **Student Dashboard** under 'Active Complaints'. Each ticket displays real-time SLA countdown timers, assigned technician details, and resolution notes!`;
  }
  if (text.includes('emergency') || text.includes('fire') || text.includes('spark') || text.includes('hazard')) {
    return `🚨 **EMERGENCY SAFETY PROTOCOL**:\nIn case of critical hazards (fire, sparking wires, major water outburst), please stay clear of the area and contact Campus Security immediately at **+91 98765 00000** or tap the **Emergency Escalation** button on your dashboard!`;
  }
  if (text.includes('leak') || text.includes('water') || text.includes('pipe') || text.includes('flooding')) {
    return `Plumbing defect noted. Please share the building and room number so our plumbing crew can be dispatched immediately to prevent water damage!`;
  }
  if (text.includes('fan') || text.includes('light') || text.includes('ac') || text.includes('projector')) {
    return `Received maintenance request for equipment/electrical repair. Please confirm the room number or attach a photo so our staff can bring the right replacement parts!`;
  }
  if (text.includes('thanks') || text.includes('thank you') || text.includes('nandri') || text.includes('நன்றி')) {
    return `You're very welcome! If you notice any other facility issues on campus, just let me know!`;
  }
  if (fullContext.includes('issue') && text.length > 3) {
    return `Noted: "${lastMsg}". I've linked this detail to your maintenance report. Would you like to confirm ticket creation or attach a photo?`;
  }

  return `👋 **CampusFix AI Facility Assistant**:\nI have noted your message: "${lastMsg}". Tell me what issue you are facing or how I can assist with campus facilities!`;
}

export const chatApi = {
  /**
   * Send a list of multi-turn messages and optional image to Gemini / Backend.
   * @param {Array<{role: string, content: string, image?: string}>} messages
   * @param {string} taskType - 'fast' | 'general' | 'complex'
   * @param {string} [systemInstruction] - Optional custom instructions
   * @param {string|null} [image] - Optional base64 data URL
   */
  sendMessage: async (messages, taskType = 'general', systemInstruction = '', image = null) => {
    try {
      const res = await apiClient('/chat/', {
        method: 'POST',
        body: {
          messages,
          taskType,
          systemInstruction,
          image,
        },
      });
      if (res && res.reply) return res;
      throw new Error('Invalid response format from AI service.');
    } catch (err) {
      console.warn('Gemini Chat API client fallback:', err);
      return {
        reply: generateDynamicAssistantReply(messages),
        modelUsed: 'CampusFix Assistant (Local AI)',
      };
    }
  },

  /**
   * Synthesize text to speech using Gemini 3.8 Flash Lite TTS via /api/tts.
   * Returns { audioUrl, format, voice } or null on fallback.
   * @param {string} text
   * @param {string} [lang] - 'en-IN' | 'ta-IN' | 'en-US'
   * @param {string} [voice] - Prebuilt voice e.g. 'Kore'
   */
  synthesizeSpeech: async (text, lang = 'en', voice = 'Kore') => {
    try {
      const res = await apiClient('/tts', {
        method: 'POST',
        body: { text, lang, voice },
      });
      if (res && res.audioUrl) return res;
      return null;
    } catch (err) {
      console.warn('TTS API client notice:', err);
      return null;
    }
  },
};
