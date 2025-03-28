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
    maxOutputTokens: 8192,
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

// Simulate streaming with a fake generator for testing
async function* createFakeStream(text) {
  console.log("Creating fake stream with text:", text);
  
  // Break into sentences first
  const sentences = text.split(/([.!?]+\s+)/);
  console.log("Split into sentences:", sentences);
  
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    if (sentence.trim().length === 0) continue;
    
    console.log(`Yielding sentence ${i}:`, sentence);
    
    // Create object structure similar to Gemini API
    const chunk = {
      candidates: [{
        content: {
          parts: [{
            text: sentence
          }]
        }
      }]
    };
    
    console.log("Yielding chunk:", JSON.stringify(chunk, null, 2));
    yield chunk;
    
    // Add a small delay between sentences
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log("Fake stream generation completed");
}

// Create a fake StreamResult that mimics GenerateContentStreamResult 
class FakeStreamResult {
  constructor(text) {
    this._text = text;
    console.log("Created FakeStreamResult with text length:", text.length);
  }
  
  stream() {
    console.log("FakeStreamResult.stream() called");
    return createFakeStream(this._text);
  }
}

/**
 * Run the Gemini model with the given prompt
 * @param {string} prompt - User prompt
 * @param {boolean} streamMode - Whether to use streaming mode
 * @param {object} roleConfig - Role configuration
 * @returns {string|object} - String response for non-streaming, stream object for streaming
 */
async function run(prompt, streamMode = false, roleConfig = defaultRole) {
  try {
    console.log("Starting Gemini API call with prompt:", prompt);
    
    const systemPrompt = buildSystemPrompt(prompt, roleConfig);
    
    // Testing mode - use fake streaming
    const USE_FAKE_STREAMING = true;
    
    if (streamMode) {
      // Real streaming mode with the Google Generative AI SDK
      console.log("Using streaming mode");
      
      if (USE_FAKE_STREAMING) {
        console.log("Using FAKE streaming for testing");
        // Generate a fake response for testing
        const fakeResponse = "Xin chào! Tôi là trợ lý AI của CLB SINNO. Tôi rất vui được trò chuyện với bạn hôm nay. CLB SINNO (SoICT Innovation Club) là câu lạc bộ đổi mới sáng tạo thuộc Trường Công nghệ Thông tin và Truyền thông, Đại học Bách Khoa Hà Nội. Chúng tôi tổ chức nhiều hoạt động thú vị về công nghệ, lập trình và đổi mới sáng tạo. Bạn cần tìm hiểu thông tin gì về CLB SINNO?";
        return new FakeStreamResult(fakeResponse);
      }
      
      try {
        const streamResult = await model.generateContentStream(systemPrompt);
        console.log("Real API stream result:", streamResult);
        return streamResult;
      } catch (error) {
        console.error("Error in generateContentStream:", error);
        // Fallback to fake streaming if real streaming fails
        console.log("Falling back to fake streaming due to API error");
        const fallbackResponse = "Xin chào! Rất vui được gặp bạn. Tôi là trợ lý AI của CLB SINNO. Đã có lỗi khi gọi API nhưng tôi vẫn có thể giúp bạn với một số thông tin cơ bản. Bạn cần hỗ trợ gì?";
        return new FakeStreamResult(fallbackResponse);
      }
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