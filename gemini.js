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

// Default role configuration
const defaultRole = {
  role: "fatherly",
  personality: "harsh and strict",
  expertise: "general knowlegde and life advice",
  tone: "like an old man",
  language: "Vietnamese",
};

async function run(prompt, roleConfig = defaultRole, onStream = null) {
  try {
    console.log("Starting Gemini API call with prompt:", prompt);
    
    // Construct the system prompt with role information
    const systemPrompt = `You are an AI assistant with the following characteristics:
- Role: ${roleConfig.role}
- Personality: ${roleConfig.personality}
- Expertise: ${roleConfig.expertise}
- Tone: ${roleConfig.tone}
- Language: ${roleConfig.language}

Please respond to the following user message while maintaining this role and personality:
${prompt}`;
    
    if (onStream) {
      // Streaming mode
      const result = await model.generateContentStream(systemPrompt);
      let fullResponse = '';
      
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullResponse += chunkText;
        onStream(chunkText);
      }
      
      return fullResponse;
    } else {
      // Non-streaming mode
      const result = await model.generateContent(systemPrompt);
      const response = await result.response;
      return response.text();
    }

  } catch (error) {
    console.error("Error in Gemini API:", error);
    return "Error: " + (error.message || "Unknown error occurred");
  }
}

export default run;