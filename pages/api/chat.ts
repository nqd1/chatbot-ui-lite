import { Message } from "@/types";
import run from "@/gemini";
import { NextApiRequest, NextApiResponse } from 'next';

// Remove edge runtime config
// export const config = {
//   runtime: "edge",
//   regions: ['iad1']
// };

// Punctuation characters - use strings for simpler checks
const PUNCTUATION = ".,;:?!…\"'()[]{}";
const END_SENTENCE = ".!?…";
const MID_SENTENCE = ",:;";

// Function to smartly split Vietnamese text into tokens
function splitIntoTokens(text: string): string[] {
  // Pattern to capture:
  // 1. Words without punctuation
  // 2. Words followed by punctuation (keeping punctuation with the word)
  // 3. Standalone punctuation
  
  const tokens: string[] = [];
  let currentToken = '';
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    // If it's whitespace, add current token and the whitespace separately
    if (char === ' ' || char === '\n' || char === '\t') {
      if (currentToken) {
        tokens.push(currentToken);
        currentToken = '';
      }
      tokens.push(char);
    } 
    // If it's punctuation, add it to the current token
    else if (PUNCTUATION.includes(char)) {
      currentToken += char;
      
      // If it's end of sentence punctuation, push the token and reset
      if (END_SENTENCE.includes(char)) {
        tokens.push(currentToken);
        currentToken = '';
      }
    } 
    // Regular character
    else {
      currentToken += char;
    }
  }
  
  // Add any remaining token
  if (currentToken) {
    tokens.push(currentToken);
  }
  
  return tokens;
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    console.log("API request received:", req.method);
    
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    console.log("Parsing request body...");
    const { messages, stream = false } = req.body as {
      messages: Message[];
      stream?: boolean;
    };

    console.log("Stream mode:", stream);

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
      console.log("Using streaming response mode");
      // Set appropriate headers for streaming
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      });

      // Simple hardcoded response for testing
      try {
        // Standard test response
        const testResponse = "Xin chào! Tôi là trợ lý AI của CLB SINNO. Tôi rất vui được trò chuyện với bạn hôm nay. CLB SINNO (SoICT Innovation Club) là câu lạc bộ đổi mới sáng tạo thuộc Trường Công nghệ Thông tin và Truyền thông, Đại học Bách Khoa Hà Nội. Chúng tôi tổ chức nhiều hoạt động thú vị về công nghệ, lập trình và đổi mới sáng tạo. Bạn cần tìm hiểu thông tin gì về CLB SINNO?";
        
        // Send characters one by one with a delay
        for (let i = 0; i < testResponse.length; i++) {
          const char = testResponse[i];
          res.write(`data: ${JSON.stringify({ chunk: char })}\n\n`);
          // Tiny delay for simulating typing
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        console.log("Stream processing completed");
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
    console.log("Using standard (non-streaming) response mode");
    console.log("Calling Gemini API with content:", lastMessage.content);
    const response = await run(lastMessage.content);
    console.log("Gemini API response:", response);
    
    // Check if response is an error message
    if (typeof response === 'string' && response.startsWith("Error:")) {
      throw new Error(response);
    }
    
    // Return the response
    const jsonResponse = { 
      role: "assistant",
      content: typeof response === 'string' ? response : "Error: Invalid response format"
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
