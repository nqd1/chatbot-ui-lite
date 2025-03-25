import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not configured in environment variables");
}

const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-pro",
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 2048,
  }
});

// Context về SoICT và các câu lạc bộ
const SOICT_CONTEXT = `Bạn là một chatbot chuyên về tra cứu thông tin hoạt động câu lạc bộ trong SoICT-HUST (School of Information and Communications Technology - Hanoi University of Science and Technology).


Nhiệm vụ của bạn:
1. Trả lời các câu hỏi về thông tin câu lạc bộ
2. Cung cấp thông tin về lịch hoạt động
3. Hướng dẫn cách tham gia câu lạc bộ
4. Thông báo về các sự kiện sắp tới
5. Giải đáp thắc mắc về hoạt động câu lạc bộ

Hãy trả lời bằng tiếng Việt và thân thiện với người dùng.`;

async function run(prompt) {
  try {
    console.log("Starting Gemini API call with prompt:", prompt);
    
    // Thêm context vào prompt
    const fullPrompt = `${SOICT_CONTEXT}\n\nCâu hỏi của người dùng: ${prompt}`;
    
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();
    
    if (!text) {
      throw new Error("Empty response from Gemini API");
    }
    
    return text;

  } catch (error) {
    console.error("Error in Gemini API:", error);
    return "Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.";
  }
}

export default run;