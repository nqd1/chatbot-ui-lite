import { Message } from "@/types";
import type { NextApiRequest, NextApiResponse } from 'next';

// Fix process.env access by adding proper type declarations
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      REACT_APP_API_URL: string;
    }
  }
}

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

    // For streaming response, we need to read the response as text
    const responseText = await response.text();
    console.log("Backend API response text:", responseText);
    
    let content = "Không thể xử lý yêu cầu của bạn";
    
    try {
      // Try to parse the response text as JSON if possible
      const data = JSON.parse(responseText);
      content = data.content || data.message || content;
    } catch (parseError) {
      // If parsing fails, try to extract content from chunk format
      console.log("Parsing response as JSON failed, trying to extract from chunks");
      
      // Check for chunked format: {"chunk": "text"}{"chunk": "more text"}
      const chunkPattern = /\{"chunk":[\s]*"([^"]*)"\}/g;
      const matches = Array.from(responseText.matchAll(chunkPattern));
      
      if (matches && matches.length > 0) {
        // Extract and combine chunks
        let extractedContent = '';
        
        for (const match of matches) {
          if (match[1]) {
            // Decode escaped Unicode characters
            const chunkText = match[1].replace(/\\u([0-9a-fA-F]{4})/g, (_: string, code: string) => {
              return String.fromCharCode(parseInt(code, 16));
            });
            
            extractedContent += chunkText;
          }
        }
        
        if (extractedContent) {
          content = extractedContent;
          console.log("Successfully extracted content from chunks");
        } else {
          // If extraction didn't yield valid content, use raw text
          content = responseText.trim();
        }
      } else {
        // Use raw text as fallback
        content = responseText.trim();
      }
    }
    
    // Return the response
    const jsonResponse = { 
      role: "assistant",
      content: content,
      streaming: true // Enable streaming on the frontend
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
