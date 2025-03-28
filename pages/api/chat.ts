import { Message } from "@/types";
import { NextApiRequest, NextApiResponse } from 'next';

const API_URL = process.env.REACT_APP_API_URL;

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
    
    if (!lastMessage || !lastMessage.content) {
      throw new Error("Invalid message format");
    }

    // Call Backend API
    console.log("Calling Backend API with content:", lastMessage.content);
    const response = await fetch(`${API_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{
          role: "user",
          content: lastMessage.content
        }]

      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Backend API response:", data);
    
    // Return the response
    const jsonResponse = { 
      role: "assistant",
      content: data.content || data.message || "Không thể xử lý yêu cầu của bạn"
    };
    console.log("Sending response:", jsonResponse);
    
    return res.status(200).json(jsonResponse);
  } catch (error: any) {
    console.error("Error in chat API:", error);
    return res.status(500).json({ 
      error: error.message || "Internal server error" 
    });
  }
};

export default handler;
