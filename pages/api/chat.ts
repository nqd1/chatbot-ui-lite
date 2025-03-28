import { Message } from "@/types";
import run from "@/gemini";
import { NextApiRequest, NextApiResponse } from 'next';

// Remove edge runtime config
// export const config = {
//   runtime: "edge",
//   regions: ['iad1']
// };

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { messages, stream = false } = req.body as {
      messages: Message[];
      stream?: boolean;
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

    // Handle streaming response
    if (stream) {
      // Set appropriate headers for streaming
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      });

      try {
        // Call Gemini API with streaming
        const streamResponse = await run(lastMessage.content, true);
        
        // Process stream chunks
        for await (const chunk of streamResponse) {
          if (chunk && chunk.text) {
            // Send chunk as SSE
            res.write(`data: ${JSON.stringify({ chunk: chunk.text })}\n\n`);
          }
        }
        
        // Send end event
        res.write('data: [DONE]\n\n');
        res.end();
      } catch (error: any) {
        console.error('Streaming error:', error);
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
      }
      
      return;
    }
    
    // Non-streaming response (original implementation)
    console.log("Calling Gemini API with content:", lastMessage.content);
    const response = await run(lastMessage.content);
    console.log("Gemini API response:", response);
    
    // Check if response is an error message
    if (response.startsWith("Error:")) {
      throw new Error(response);
    }
    
    // Return the response
    const jsonResponse = { 
      role: "assistant",
      content: response
    };
    console.log("Sending response:", jsonResponse);
    
    return res.status(200).json(jsonResponse);

  } catch (error: any) {
    console.error('Chat API Error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Return error message from Gemini if available
    const errorMessage = error.message.startsWith("Error:") 
      ? error.message 
      : "An unexpected error occurred";
    
    return res.status(200).json({ 
      role: "assistant",
      content: errorMessage
    });
  }
};

export default handler;
