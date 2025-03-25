import { Message } from "@/types";
import run from "@/gemini";
import { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  runtime: 'edge',
  regions: ['iad1']
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
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
    console.error('Chat API Error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Send error message
    res.write(`data: ${JSON.stringify({ 
      role: "assistant",
      content: "Error: " + (error.message || "Unknown error occurred"),
      done: true
    })}\n\n`);
    
    res.end();
  }
};

export default handler;
