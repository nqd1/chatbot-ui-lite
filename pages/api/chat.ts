import { NextApiRequest, NextApiResponse } from 'next';
import { Message } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check for API key
  if (!process.env.OPENAI_API_KEY) {
    res.status(500).json({ error: 'OpenAI API key is not configured' });
    return;
  }

  // Check request method
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const messages = req.body.messages;

  // Validate messages
  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: 'Messages must be an array' });
    return;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      res.status(500).json({ error: error.error?.message || 'OpenAI API error' });
      return;
    }

    const data = await response.json();
    res.status(200).json(data.choices[0].message);
  } catch (error) {
    console.error('Error in chat API:', error);
    res.status(500).json({ error: 'Failed to communicate with OpenAI API' });
  }
}
