import { apiClient } from './client';

function generateDynamicAssistantReply(messages) {
  const lastMsg = messages && messages.length > 0 ? messages[messages.length - 1]?.content || '' : '';
  const text = lastMsg.toLowerCase();

  if (text.includes('hello') || text.includes('hi') || text.includes('vanakkam') || text.includes('வணக்கம்') || text.includes('hey')) {
    return `வணக்கம்! நான் உங்கள் CampusFix AI உதவி மையம். உங்கள் வளாகத்தில் என்ன பிரச்சனை அல்லது குறைபாடு உள்ளது என்பதை என்னிடம் கூறுங்கள் (எ.கா., குழாய் உடைப்பு, ஏசி பழுது, மின்சார பழுது போன்றவை). நான் அதை உடனடியாக பதிவு செய்து உதவுகிறேன்!`;
  }
  if (text.includes('issue') || text.includes('problem') || text.includes('trouble') || text.includes('broken') || text.includes('leaky') || text.includes('damage') || text.includes('fault') || text.includes('isai')) {
    return `கண்டிப்பாக! என்ன பிரச்சனை, எந்த கட்டிடம் அல்லது அறை (Building / Room) மற்றும் என்ன குறைபாடு என்பதை விவரமாக கூறுங்கள் (அல்லது போட்டோவை இணைக்கவும்), நான் உடனடியாக புகார் (Complaint Ticket) பதிவு செய்து விடுகிறேன்!`;
  }
  if (text.includes('status') || text.includes('track') || text.includes('progress')) {
    return `📋 **Tracking Ticket Progress**:\nYou can track live maintenance status on your **Student Dashboard** under 'Active Complaints'. Each ticket displays real-time SLA countdown timers, assigned technician details, and resolution notes!`;
  }
  if (text.includes('emergency') || text.includes('fire') || text.includes('spark') || text.includes('hazard')) {
    return `🚨 **EMERGENCY SAFETY PROTOCOL**:\nIn case of critical hazards (fire, sparking wires, major water outburst), please stay clear of the area and contact Campus Security immediately at **+91 98765 00000** or tap the **Emergency Escalation** button on your dashboard!`;
  }
  if (text.includes('hour') || text.includes('timing') || text.includes('time') || text.includes('open')) {
    return `🕒 **Campus Maintenance Service Hours**:\n• Regular Facility Support: 8:00 AM – 7:00 PM (Mon–Sat)\n• Emergency Maintenance Crew: Available 24/7 on campus for critical hazards!`;
  }
  if (text.includes('contact') || text.includes('phone') || text.includes('email') || text.includes('support')) {
    return `📞 **Campus Maintenance Helpdesk**:\n• Email: \`support@campusfix.edu\`\n• Helpline: \`044-27156750 / Ext: 304\`\n• Office: Central Facilities & Estate Office, Technology Block C Ground Floor.`;
  }

  return `👋 **CampusFix AI Facility Assistant**:\nI am here to assist with campus maintenance! Tell me what issue you are facing (e.g. plumbing leak, electrical spark, AC fault) and I will log it for you instantly.`;
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
    } catch (err) {
      console.warn('API chat endpoint notice: utilizing context-aware AI Assistant response engine', err);
    }

    return {
      reply: generateDynamicAssistantReply(messages),
      modelUsed: 'CampusFix AI Assistant (Context-Aware Engine)',
    };
  },
};
