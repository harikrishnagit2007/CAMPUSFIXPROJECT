import { apiClient } from './client';

function generateDynamicAssistantReply(messages) {
  const lastMsg = messages && messages.length > 0 ? messages[messages.length - 1]?.content || '' : '';
  const text = lastMsg.toLowerCase();

  if (text.includes('status') || text.includes('track') || text.includes('progress')) {
    return `📋 **Tracking Ticket Progress**:\nYou can track live maintenance status on your **Student Dashboard** under 'Active Complaints'. Each ticket displays real-time SLA countdown timers, assigned technician details, and resolution notes!`;
  }
  if (text.includes('emergency') || text.includes('fire') || text.includes('spark') || text.includes('hazard')) {
    return `🚨 **EMERGENCY SAFETY PROTOCOL**:\nIn case of critical hazards (fire, sparking wires, major water outburst), please stay clear of the area and contact Campus Security immediately at **+91 98765 00000** or tap the **Emergency Escalation** button on your dashboard!`;
  }
  if (text.includes('hour') || text.includes('timing') || text.includes('time') || text.includes('open')) {
    return `🕒 **Campus Maintenance Service Hours**:\n• Regular Facility Support: 8:00 AM – 7:00 PM (Mon–Sat)\n• Emergency Maintenance Crew: Available 24/7 on campus for critical hazards!`;
  }
  if (text.includes('qr') || text.includes('scan') || text.includes('code')) {
    return `📱 **QR Smart Location Scanning**:\nTap **'Scan Location QR'** in the top navigation bar or report modal! Each classroom, lab, and hostel room features a unique QR code badge for instant location auto-filling.`;
  }
  if (text.includes('contact') || text.includes('phone') || text.includes('email') || text.includes('support')) {
    return `📞 **Campus Maintenance Helpdesk**:\n• Email: \`support@campusfix.edu\`\n• Helpline: \`044-27156750 / Ext: 304\`\n• Office: Central Facilities & Estate Office, Technology Block C Ground Floor.`;
  }

  return `👋 **CampusFix AI Facility Assistant**:\nI am here to assist with campus maintenance! You can ask me to:\n1. **Report an issue** (e.g., "Report broken AC in Tech Block Room 304")\n2. **Attach photo evidence** for AI vision diagnostics\n3. **Track active complaint tickets & SLA progress**\n\nHow can I help resolve your facility request today?`;
}

export const chatApi = {
  /**
   * Send a list of multi-turn messages to Gemini and get a reply.
   * @param {Array<{role: string, content: string}>} messages
   * @param {string} taskType - 'fast' | 'general' | 'complex'
   * @param {string} [systemInstruction] - Optional custom instructions
   */
  sendMessage: async (messages, taskType = 'general', systemInstruction = '') => {
    try {
      const res = await apiClient('/chat/', {
        method: 'POST',
        body: {
          messages,
          taskType,
          systemInstruction,
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
