import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('API Request received');
  
  // Check for API key
  if (!process.env.GOOGLE_API_KEY) {
    console.error('Google API key missing');
    res.status(500).json({ error: 'Google API key is not configured' });
    return;
  }

  // Check request method
  if (req.method !== 'POST') {
    console.error('Invalid method:', req.method);
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const messages = req.body.messages;
  console.log('Received messages:', messages);

  // Validate messages
  if (!messages || !Array.isArray(messages)) {
    console.error('Invalid messages format:', messages);
    res.status(400).json({ error: 'Messages must be an array' });
    return;
  }

  try {
    console.log('Sending request to Gemini');
    
    // Get the model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Start a chat
    const chat = model.startChat({
      history: messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: msg.content,
      })),
    });

    // Send message and get response
    const result = await chat.sendMessage(messages[messages.length - 1].content);
    const response = await result.response;
    const text = response.text();

    console.log('Gemini response:', text);
    
    res.status(200).json({
      role: 'assistant',
      content: text
    });
  } catch (error) {
    console.error('Detailed error:', error);
    res.status(500).json({ 
      error: 'Failed to communicate with Gemini API',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
