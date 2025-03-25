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
  
  async function testConnection() {
    try {
      const result = await model.generateContent("Test connection");
      const response = await result.response;
      return response.text() ? true : false;
    } catch (error) {
      console.error("Connection test failed:", error);
      return false;
    }
  }
  
  async function run(prompt) {
    if (!prompt || typeof prompt !== 'string') {
      console.error("Invalid prompt:", prompt);
      return "Error: Invalid prompt";
    }

    try {
      // Test connection first
      const isConnected = await testConnection();
      if (!isConnected) {
        throw new Error("Failed to connect to Gemini API");
      }

      console.log("Starting Gemini API call with prompt:", prompt);
      
      // Generate content with proper error handling
      const result = await model.generateContent(prompt);
      
      if (!result) {
        throw new Error("No result from Gemini API");
      }
      
      console.log("Raw result:", result);

      const response = await result.response;
      if (!response) {
        throw new Error("No response object from Gemini API");
      }
      
      console.log("Response object:", response);

      const text = response.text();
      if (!text) {
        throw new Error("Empty text from Gemini API");
      }
      
      console.log("Final text:", text);
      return text;

    } catch (error) {
      console.error("Detailed error in Gemini API:", {
        error: error.toString(),
        message: error.message,
        name: error.name,
        stack: error.stack,
        prompt: prompt
      });
      
      if (error.message?.includes("API key")) {
        return "Error: Invalid API key";
      } else if (error.message?.includes("Failed to connect")) {
        return "Error: Cannot connect to Gemini API";
      } else if (error.message?.includes("quota")) {
        return "Error: API quota exceeded";
      } else if (error.message?.includes("permission")) {
        return "Error: Permission denied";
      }
      
      return "Error: " + error.message;
    }
  }
  
  export default run;