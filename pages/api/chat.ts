import { Message } from "@/types";
import run from "@/gemini";

export const config = {
  runtime: "edge",
  regions: ['iad1']  // Deploy to Washington DC by default
};

const handler = async (req: Request): Promise<Response> => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const { messages } = (await req.json()) as {
      messages: Message[];
    };

    if (!messages || !Array.isArray(messages)) {
      return new Response('Messages are required and must be an array', { status: 400 });
    }

    // Get the last message from user
    const lastMessage = messages[messages.length - 1];
    
    // Call Gemini API
    const response = await run(lastMessage.content);
    
    // Return the response
    return new Response(JSON.stringify({ 
      role: "assistant",
      content: response
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    return new Response(
      JSON.stringify({ 
        role: "assistant",
        content: "This is test message" 
      }), 
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        } 
      }
    );
  }
};

export default handler;
