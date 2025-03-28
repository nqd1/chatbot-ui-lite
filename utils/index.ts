import { Message, OpenAIModel } from "@/types";
import { createParser } from "eventsource-parser";

// Define types for EventSource parser since library types are incorrect
interface ParsedEvent {
  type: string;
  data: string;
}

interface ReconnectInterval {
  type: string;
}

type ParserCallback = (event: ParsedEvent | ReconnectInterval) => void;

export const OpenAIStream = async (messages: Message[]) => {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  try {
    console.log("Sending request to OpenAI...");
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      method: "POST",
      body: JSON.stringify({
        model: OpenAIModel.DAVINCI_TURBO,
        messages: [
          {
            role: "system",
            content: `You are a helpful, friendly, assistant.`
          },
          ...messages
        ],
        max_tokens: 800,
        temperature: 0.0,
        stream: true
      })
    });

    if (res.status !== 200) {
      const error = await res.json();
      console.error("OpenAI API Error:", error);
      throw new Error(`OpenAI API returned an error: ${res.status} ${JSON.stringify(error)}`);
    }

    console.log("Response received from OpenAI");
    const stream = new ReadableStream({
      async start(controller) {
        const onParse = (event: ParsedEvent | ReconnectInterval) => {
          if (event.type === "event") {
            const data = (event as ParsedEvent).data;

            if (data === "[DONE]") {
              controller.close();
              return;
            }

            try {
              const json = JSON.parse(data);
              const text = json.choices[0].delta.content;
              const queue = encoder.encode(text);
              controller.enqueue(queue);
            } catch (e) {
              console.error("Parsing error:", e);
              controller.error(e);
            }
          }
        };

        // @ts-ignore - Type issues with the library
        const parser = createParser(onParse);

        for await (const chunk of res.body as any) {
          parser.feed(decoder.decode(chunk));
        }
      }
    });

    return stream;
  } catch (error) {
    console.error("Stream error:", error);
    throw error;
  }
};

export const GeminiStream = async (messages: Message[]) => {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  try {
    console.log("Sending request to Gemini API with streaming...");
    
    const res = await fetch("/api/chat", {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        messages,
        stream: true
      })
    });

    if (res.status !== 200) {
      console.error("Gemini API non-200 response:", res.status);
      let errorText = "";
      try {
        const errorJson = await res.json();
        errorText = JSON.stringify(errorJson);
      } catch (e) {
        errorText = await res.text();
      }
      throw new Error(`Gemini API returned an error: ${res.status} ${errorText}`);
    }

    console.log("Response received from Gemini with streaming");
    
    // Simplified stream handling that doesn't try to parse SSE format
    // Just process the response as text and convert to a stream of characters
    return new ReadableStream({
      async start(controller) {
        console.log("Stream start handler");
        
        if (!res.body) {
          console.error("Response body is null");
          controller.error(new Error("Response body is null"));
          return;
        }
        
        try {
          const reader = res.body.getReader();
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const text = decoder.decode(value);
            console.log("Read chunk:", text);
            
            // Simple parsing: look for data: {json} patterns
            const lines = text.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const jsonStr = line.slice(6); // remove 'data: '
                
                if (jsonStr === '[DONE]') {
                  console.log("Stream complete");
                  controller.close();
                  return;
                }
                
                try {
                  const json = JSON.parse(jsonStr);
                  console.log("Parsed JSON:", json);
                  
                  if (json.error) {
                    controller.error(new Error(json.error));
                    return;
                  }
                  
                  if (json.chunk) {
                    console.log("Found chunk:", json.chunk);
                    const queue = encoder.encode(json.chunk);
                    controller.enqueue(queue);
                  }
                } catch (e) {
                  console.error("Error parsing JSON:", e, "from string:", jsonStr);
                }
              }
            }
          }
          
          // Stream should be complete at this point
          console.log("Read complete, closing stream");
          controller.close();
        } catch (e) {
          console.error("Error reading stream:", e);
          controller.error(e);
        }
      }
    });
    
  } catch (error) {
    console.error("Stream error:", error);
    throw error;
  }
};
