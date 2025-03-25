import { NextApiRequest, NextApiResponse } from 'next';
import { Message } from '@/types';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing Environment Variable OPENAI_API_KEY');
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const messages = req.body.messages;

  if (!messages) {
    res.status(400).json({ error: 'No messages provided' });
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
      res.status(500).json({ error: error.error.message });
      return;
    }

    const data = await response.json();
    res.status(200).json(data.choices[0].message);
  } catch (error) {
    console.error('Error in chat API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
