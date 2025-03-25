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
    console.log("Processing message:", lastMessage);
    
    // Call Gemini API
    console.log("Calling Gemini API...");
    const response = await run(lastMessage.content);
    console.log("Gemini API response:", response);
    
    // If response is the default message, throw an error
    if (response === "This is test message") {
      throw new Error("Received default message from Gemini");
    }
    
    // Return the response
    const jsonResponse = { 
      role: "assistant",
      content: response
    };
    console.log("Sending response:", jsonResponse);
    
    return new Response(JSON.stringify(jsonResponse), {
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });

  } catch (error: any) {
    console.error('Detailed Chat API Error:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    
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
