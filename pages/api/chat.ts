import { Message } from "@/types";
import run from "@/gemini";
import { NextApiRequest, NextApiResponse } from 'next';

// Remove edge runtime config
// export const config = {
//   runtime: "edge",
//   regions: ['iad1']
// };

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Enable streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const { messages } = req.body as {
      messages: Message[];
    };

    if (!messages || !Array.isArray(messages)) {
      res.write('data: ' + JSON.stringify({ error: 'Messages are required and must be an array' }) + '\n\n');
      return res.end();
    }

    // Get the last message from user
    const lastMessage = messages[messages.length - 1];
    console.log("Processing message:", lastMessage);
    
    if (!lastMessage || !lastMessage.content) {
      res.write('data: ' + JSON.stringify({ error: 'Invalid message format' }) + '\n\n');
      return res.end();
    }

    // Call Gemini API
    console.log("Calling Gemini API with content:", lastMessage.content);
    const response = await run(lastMessage.content);
    
    // Send the response
    res.write('data: ' + JSON.stringify({
      role: "assistant",
      content: response
    }) + '\n\n');
    
    return res.end();

  } catch (error: any) {
    console.error('Chat API Error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    res.write('data: ' + JSON.stringify({ 
      role: "assistant",
      content: "Error: " + (error.message || "An unexpected error occurred")
    }) + '\n\n');
    
    return res.end();
  }
};

export default handler;
