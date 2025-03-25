import { Message } from "@/types";
import run from "@/gemini";
import { NextApiRequest, NextApiResponse } from 'next';

// Remove edge runtime config since we're using standard API routes
// export const config = {
//   runtime: 'edge',
//   regions: ['iad1']
// };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { messages } = req.body as {
      messages: Message[];
    };

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages are required and must be an array' });
    }

    // Get the last message from user
    const lastMessage = messages[messages.length - 1];
    console.log("Processing message:", lastMessage);
    
    if (!lastMessage || !lastMessage.content) {
      throw new Error("Invalid message format");
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Call Gemini API with streaming
    console.log("Calling Gemini API with content:", lastMessage.content);
    const result = await run(lastMessage.content);
    
    // Send the complete response at the end
    res.write(`data: ${JSON.stringify({ 
      role: "assistant",
      content: result,
      done: true
    })}\n\n`);
    
    res.end();

  } catch (error: any) {
    console.error("Error in chat API:", error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
