import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not configured in environment variables");
}

const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 2048,
  }
});

// Initialize chat
const chat = model.startChat({
  history: [
    {
      role: "user",
      parts: "You are Chatbot Sonni, an AI assistant. Be helpful and friendly."
    },
    {
      role: "model",
      parts: "I understand. I am Chatbot Sonni, and I'll be helpful and friendly in our interactions."
    }
  ],
});

async function run(prompt) {
  try {
    console.log("Starting Gemini API call with prompt:", prompt);
    
    // Send message to chat
    const result = await chat.sendMessageStream(prompt);
    
    let fullResponse = '';
    
    // Process the stream
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullResponse += chunkText;
      // Return each chunk as it comes
      console.log("Chunk received:", chunkText);
    }
    
    return fullResponse;

  } catch (error) {
    console.error("Error in Gemini API:", error);
    return "Error: " + (error.message || "Unknown error occurred");
  }
}

export default run;