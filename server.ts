import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenerativeAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function createServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY || '');
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // AI Chat Route
  app.post('/api/chat', async (req, res) => {
    try {
      const { messages, systemInstruction, image } = req.body;
      
      const chatHistory = messages.slice(0, -1).map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

      const chat = model.startChat({
        history: chatHistory,
        systemInstruction: systemInstruction || 'You are a helpful campus assistant.',
      });

      const lastMessage = messages[messages.length - 1].content;
      
      let result;
      if (image) {
        // Handle multi-modal
        const imageData = image.split(',')[1];
        result = await model.generateContent([
          lastMessage,
          { inlineData: { data: imageData, mimeType: 'image/jpeg' } }
        ]);
      } else {
        result = await chat.sendMessage(lastMessage);
      }

      const response = await result.response;
      const text = response.text();

      res.json({
        reply: text,
        modelUsed: 'Gemini 1.5 Flash',
      });
    } catch (error: any) {
      console.error('Chat API Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Placeholder for TTS (Falls back to client-side Web Speech if this returns null or error)
  app.post('/api/tts', async (req, res) => {
    res.json({ audioUrl: null, notice: 'Using client-side Web Speech API' });
  });

  // Vite middleware in dev
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist/index.html'));
    });
  }

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

createServer();
