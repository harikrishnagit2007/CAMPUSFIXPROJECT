import { apiClient } from './client';

export const chatApi = {
  /**
   * Send a list of multi-turn messages to Gemini and get a reply.
   * @param {Array<{role: string, content: string}>} messages
   * @param {string} taskType - 'fast' | 'general' | 'complex'
   * @param {string} [systemInstruction] - Optional custom instructions
   */
  sendMessage: (messages, taskType = 'general', systemInstruction = '') =>
    apiClient('/chat/', {
      method: 'POST',
      body: {
        messages,
        taskType,
        systemInstruction,
      },
    }),
};
