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

// Context về SoICT và các câu lạc bộ
const SOICT_CONTEXT = `Bạn là một chatbot chuyên về tra cứu thông tin hoạt động câu lạc bộ trong SoICT-HUST (School of Information and Communications Technology - Hanoi University of Science and Technology).

Các câu lạc bộ chính trong SoICT bao gồm:
1. SoICT Club - Câu lạc bộ học thuật chính của khoa
2. SoICT Media - Câu lạc bộ truyền thông
3. SoICT Dev - Câu lạc bộ lập trình
4. SoICT Network - Câu lạc bộ mạng
5. SoICT Security - Câu lạc bộ an toàn thông tin
6. SoICT AI - Câu lạc bộ trí tuệ nhân tạo
7. SoICT Game - Câu lạc bộ game
8. SoICT Design - Câu lạc bộ thiết kế

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
    
    const result = await model.generateContentStream(fullPrompt);
    let fullResponse = '';
    
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullResponse += chunkText;
      // Emit the chunk through a custom event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('geminiChunk', { 
          detail: { text: chunkText } 
        }));
      }
    }
    
    return fullResponse;

  } catch (error) {
    console.error("Error in Gemini API:", error);
    return "Error: " + (error.message || "Unknown error occurred");
  }
}

export default run;