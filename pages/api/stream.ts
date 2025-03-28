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

// Helper function to decode escaped Unicode characters
const decodeUnicode = (str: string): string => {
  return str.replace(/\\u([0-9a-fA-F]{4})/g, (_: string, code: string) => {
    return String.fromCharCode(parseInt(code, 16));
  });
};

// Helper function to format text properly by replacing newline literals with actual newlines
const formatTextContent = (text: string): string => {
  // Replace "\n" string literals with actual newlines
  return text.replace(/\\n/g, '\n');
};

// Helper function to extract text from chunks in the format {"chunk": "text"}
const extractChunksFromResponse = (responseText: string): string[] => {
  const chunks: string[] = [];
  const chunkPattern = /\{"chunk":[\s]*"((?:\\"|[^"])*?)"\}/g;
  const matches = Array.from(responseText.matchAll(chunkPattern));
  
  for (const match of matches) {
    if (match[1]) {
      const decodedChunk = decodeUnicode(match[1]);
      const formattedChunk = formatTextContent(decodedChunk);
      chunks.push(formattedChunk);
    }
  }
  
  return chunks;
};

// Helper function to artificially split a chunk into individual characters
const splitIntoIndividualChars = (text: string): string[] => {
  return text.split('');
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering for Nginx

  try {
    const { messages, streamId } = req.body as {
      messages: Message[];
      streamId?: string;
    };

    if (!messages || !Array.isArray(messages)) {
      res.write(`data: ${JSON.stringify({ error: 'Messages are required and must be an array' })}\n\n`);
      res.end();
      return;
    }

    // Get the last message from user
    const lastMessage = messages[messages.length - 1];
    console.log("Processing message for streaming:", lastMessage);
    
    if (!lastMessage || !lastMessage.content) {
      res.write(`data: ${JSON.stringify({ error: 'Invalid message format' })}\n\n`);
      res.end();
      return;
    }

    // Send an initial message to establish the connection
    res.write(`data: ${JSON.stringify({ type: 'start', streamId })}\n\n`);

    try {
      console.log(`Calling ${API_URL}/stream_generate with user message:`, lastMessage.content);
      
      // Create fetch request
      const streamResponse = await fetch(`${API_URL}/stream_generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
          }))
        })
      });

      if (!streamResponse.ok) {
        console.error(`HTTP error from backend: ${streamResponse.status}`);
        res.write(`data: ${JSON.stringify({ 
          error: `Backend error: ${streamResponse.statusText}`,
          streamId
        })}\n\n`);
        res.end();
        return;
      }

      // Process the stream directly instead of waiting for the entire response
      const reader = streamResponse.body?.getReader();
      
      // If body can't be read as a stream, fallback to text
      if (!reader) {
        console.log("Cannot read response as stream, falling back to text");
        const responseText = await streamResponse.text();
        handleFullResponse(responseText, res, streamId);
        return;
      }
      
      // Handle streaming response
      console.log("Processing streaming response from backend");
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedContent = '';
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            // Process any remaining data in the buffer
            if (buffer) {
              try {
                processChunk(buffer, accumulatedContent, res, streamId);
              } catch (e) {
                console.error("Error processing final chunk:", e);
              }
            }
            
            // Stream completed, send final message
            res.write(`data: ${JSON.stringify({ 
              type: 'end',
              content: formatTextContent(accumulatedContent),
              streamId
            })}\n\n`);
            
            res.end();
            return;
          }
          
          // Decode new chunk and add to buffer
          const newText = decoder.decode(value, { stream: true });
          buffer += newText;
          
          // Look for complete chunks in the buffer
          let match;
          const chunkRegex = /\{"chunk":[\s]*"((?:\\"|[^"])*?)"\}/g;
          let lastMatchEnd = 0;
          
          while ((match = chunkRegex.exec(buffer)) !== null) {
            // Process each chunk
            const chunkText = decodeUnicode(match[1]);
            const formattedChunk = formatTextContent(chunkText);
            
            // Split the formatted chunk into individual characters
            const characters = splitIntoIndividualChars(formattedChunk);
            
            // Send each character with a short delay for a typing effect
            for (const char of characters) {
              accumulatedContent += char;
              
              // Send the updated accumulated content to the client
              res.write(`data: ${JSON.stringify({ 
                type: 'chunk', 
                content: accumulatedContent,
                streamId
              })}\n\n`);
              
              // Add a shorter delay for character-by-character typing effect
              await new Promise(resolve => setTimeout(resolve, 20));
            }
            
            lastMatchEnd = match.index + match[0].length;
          }
          
          // Keep only unprocessed text in the buffer
          if (lastMatchEnd > 0) {
            buffer = buffer.slice(lastMatchEnd);
          }
        }
      } catch (streamError) {
        console.error("Error processing stream:", streamError);
        
        // Send error and end response
        res.write(`data: ${JSON.stringify({ 
          error: 'Error processing stream',
          streamId
        })}\n\n`);
        
        res.end();
      } finally {
        reader.releaseLock();
      }
    } catch (error: any) {
      console.error("Streaming error:", error);
      res.write(`data: ${JSON.stringify({ 
        error: error.message || 'Streaming error',
        streamId
      })}\n\n`);
      res.end();
    }
  } catch (error: any) {
    console.error("Error setting up SSE:", error);
    res.write(`data: ${JSON.stringify({ error: error.message || 'Server error' })}\n\n`);
    res.end();
  }
}

// Helper function to process a single chunk
function processChunk(chunk: string, accumulatedContent: string, res: NextApiResponse, streamId?: string): string {
  try {
    const match = chunk.match(/\{"chunk":[\s]*"((?:\\"|[^"])*?)"\}/);
    if (match && match[1]) {
      const chunkText = decodeUnicode(match[1]);
      const formattedChunk = formatTextContent(chunkText);
      const newContent = accumulatedContent + formattedChunk;
      
      res.write(`data: ${JSON.stringify({ 
        type: 'chunk', 
        content: newContent,
        streamId
      })}\n\n`);
      
      return newContent;
    }
  } catch (e) {
    console.error("Error processing chunk:", e);
  }
  
  return accumulatedContent;
}

// Helper function to handle full response (non-streaming fallback)
function handleFullResponse(responseText: string, res: NextApiResponse, streamId?: string) {
  console.log("Raw backend response:", responseText);
  
  try {
    // Extract all chunks from the response
    const chunks = extractChunksFromResponse(responseText);
    console.log(`Found ${chunks.length} chunks in the response`);
    
    if (chunks.length > 0) {
      // Accumulate chunks and stream to client progressively with significantly
      // increased delay to ensure visible streaming effect
      let accumulatedContent = '';
      
      // Simulate streaming for all extracted chunks
      const sendChunksWithDelay = async () => {
        for (const chunk of chunks) {
          // Split the chunk into individual characters
          const characters = splitIntoIndividualChars(chunk);
          
          // Send each character with a delay
          for (const char of characters) {
            accumulatedContent += char;
            
            // Send progressive updates
            res.write(`data: ${JSON.stringify({ 
              type: 'chunk', 
              content: accumulatedContent,
              streamId
            })}\n\n`);
            
            // Add a delay for character-by-character effect
            await new Promise(resolve => setTimeout(resolve, 20));
          }
        }
        
        // Send completion message with full content
        res.write(`data: ${JSON.stringify({ 
          type: 'end',
          content: accumulatedContent,
          streamId
        })}\n\n`);
        
        res.end();
      };
      
      sendChunksWithDelay();
      return;
    }
  } catch (parseError) {
    console.error("Error parsing chunks:", parseError);
  }
  
  // If extraction failed, try as JSON then fallback to raw text
  try {
    const jsonResponse = JSON.parse(responseText);
    const content = jsonResponse.content || jsonResponse.message || responseText;
    const formattedContent = formatTextContent(content);
    
    // Instead of sending all at once, let's simulate streaming when possible
    if (formattedContent.length > 20) {
      const simulateStreaming = async () => {
        let streamedContent = '';
        // Split content into individual characters
        const characters = splitIntoIndividualChars(formattedContent);
        
        for (const char of characters) {
          streamedContent += char;
          res.write(`data: ${JSON.stringify({ 
            type: 'chunk', 
            content: streamedContent,
            streamId
          })}\n\n`);
          
          await new Promise(resolve => setTimeout(resolve, 20));
        }
        
        // Send completion message
        res.write(`data: ${JSON.stringify({ 
          type: 'end',
          content: streamedContent,
          streamId
        })}\n\n`);
        
        res.end();
      };
      
      simulateStreaming();
      return;
    }
    
    // For short content, send as a single chunk
    res.write(`data: ${JSON.stringify({ 
      type: 'chunk', 
      content: formattedContent,
      streamId
    })}\n\n`);
    
    // Send completion message
    res.write(`data: ${JSON.stringify({ 
      type: 'end',
      content: formattedContent,
      streamId
    })}\n\n`);
  } catch (jsonError) {
    // Last resort: use the raw response text with formatting
    const formattedContent = formatTextContent(responseText);
    
    res.write(`data: ${JSON.stringify({ 
      type: 'chunk', 
      content: formattedContent,
      streamId
    })}\n\n`);
    
    // Send completion message
    res.write(`data: ${JSON.stringify({ 
      type: 'end',
      content: formattedContent,
      streamId
    })}\n\n`);
  }
  
  res.end();
} 