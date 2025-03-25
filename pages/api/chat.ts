import { NextApiRequest, NextApiResponse } from 'next';
import { Message } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('API Request received');
  
  // Check for API key
  if (!process.env.OPENAI_API_KEY) {
    console.error('OpenAI API key missing');
    res.status(500).json({ error: 'OpenAI API key is not configured' });
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
    console.log('Sending request to OpenAI');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error response:', error);
      res.status(500).json({ error: error.error?.message || 'OpenAI API error' });
      return;
    }

    const data = await response.json();
    console.log('OpenAI response:', data);
    res.status(200).json(data.choices[0].message);
  } catch (error) {
    console.error('Detailed error:', error);
    res.status(500).json({ 
      error: 'Failed to communicate with OpenAI API',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
