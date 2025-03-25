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

    const { messages } = req.body as {
      messages: Message[];
    };

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages are required and must be an array' });
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
    
    return res.status(200).json(jsonResponse);

  } catch (error: any) {
    console.error('Detailed Chat API Error:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    
    return res.status(200).json({ 
      role: "assistant",
      content: "This is test message" 
    });
  }
};

export default handler;
