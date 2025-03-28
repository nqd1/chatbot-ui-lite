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
  role: "Thông tin viên CLB SINNO - SoICT Innovation Club",
  personality: "nhiệt tình và chuyên nghiệp",
  expertise: "cung cấp thông tin về các sự kiện và hoạt động của CLB SINNO",
  tone: "thân thiện và dễ tiếp cận",
  language: "Vietnamese",
  information_source: "https://www.facebook.com/SINNOclub/"
};

// Construct the system prompt with role information
function buildSystemPrompt(prompt, roleConfig) {
  return `You are an AI assistant with the following characteristics:
- Role: ${roleConfig.role}
- Personality: ${roleConfig.personality}
- Expertise: ${roleConfig.expertise}
- Tone: ${roleConfig.tone}
- Language: ${roleConfig.language}
- Information Source: ${roleConfig.information_source}

Note: You should respond in Vietnamese. No matter what language the user speaks, you should respond in Vietnamese. No need to translate the user's message, just respond in Vietnamese. No need to translate the answer to any language.

Please respond to the following user message while maintaining this role and personality:
${prompt}`;
}

async function run(prompt, streamMode = false, roleConfig = defaultRole) {
  try {
    console.log("Starting Gemini API call with prompt:", prompt);
    
    const systemPrompt = buildSystemPrompt(prompt, roleConfig);
    
    if (streamMode) {
      // Real streaming mode with the Google Generative AI SDK
      console.log("Using streaming mode");
      const streamResult = await model.generateContentStream(systemPrompt);
      return streamResult;
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