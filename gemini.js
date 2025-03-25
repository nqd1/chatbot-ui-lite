import {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
  } from "@google/generative-ai";
  
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in environment variables");
  }
  
  const genAI = new GoogleGenerativeAI(apiKey);
  
  const model = genAI.getGenerativeModel({
    model: "gemini-pro",
    generationConfig: {
      temperature: 0.9,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
    },
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ],
  });
  
  async function run(prompt) {
    try {
      console.log("Starting Gemini API call with prompt:", prompt);
      
      // Generate content
      const result = await model.generateContent(prompt);
      console.log("Received raw result from Gemini:", result);

      // Get response
      const response = await result.response;
      console.log("Processed Gemini response:", response);

      // Get text from response
      const text = response.text();
      console.log("Extracted text from response:", text);

      if (!text) {
        throw new Error("Empty response text from Gemini");
      }

      return text;
    } catch (error) {
      console.error("Detailed error in Gemini API:", {
        message: error.message,
        name: error.name,
        stack: error.stack,
        prompt: prompt
      });
      
      // Check for specific error types
      if (error.message.includes("API key")) {
        return "Error: Invalid API key configuration";
      } else if (error.message.includes("network")) {
        return "Error: Network connection issue";
      } else if (error.message.includes("quota")) {
        return "Error: API quota exceeded";
      }
      
      return "This is test message";
    }
  }
  
  export default run;