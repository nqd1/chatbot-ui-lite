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

    // Call Gemini API
    console.log("Calling Gemini API with content:", lastMessage.content);
    const result = await run(lastMessage.content);
    
    if (!result) {
      throw new Error("Empty response from Gemini API");
    }

    // Send the response
    return res.status(200).json({
      role: "assistant",
      content: result
    });

  } catch (error: any) {
    console.error("Error in chat API:", error);
    return res.status(500).json({ 
      role: "assistant",
      content: "Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau."
    });
  }
}
