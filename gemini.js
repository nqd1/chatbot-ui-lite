import {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
  } from "@google/generative-ai";
  
  let genAI = null;
  let model = null;
  
  function initializeAPI() {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      console.log("API Key available:", !!apiKey);
  
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured in environment variables");
      }
  
      genAI = new GoogleGenerativeAI(apiKey);
      console.log("Initialized GoogleGenerativeAI");
  
      model = genAI.getGenerativeModel({
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
      console.log("Model configured successfully");
  
      return true;
    } catch (error) {
      console.error("Failed to initialize API:", error);
      return false;
    }
  }
  
  async function testConnection() {
    try {
      if (!model) {
        const initialized = initializeAPI();
        if (!initialized) {
          throw new Error("Failed to initialize Gemini API");
        }
      }
  
      console.log("Testing connection...");
      const result = await model.generateContent("Test connection");
      console.log("Test result:", result);
      
      const response = await result.response;
      console.log("Test response:", response);
      
      const text = response.text();
      console.log("Test text:", text);
      
      return !!text;
    } catch (error) {
      console.error("Connection test failed:", {
        error: error.toString(),
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      return false;
    }
  }
  
  async function run(prompt) {
    try {
      if (!prompt || typeof prompt !== 'string') {
        console.error("Invalid prompt:", prompt);
        return "Error: Invalid prompt";
      }
  
      // Initialize API if needed
      if (!model) {
        const initialized = initializeAPI();
        if (!initialized) {
          throw new Error("Failed to initialize Gemini API");
        }
      }
  
      // Test connection first
      const isConnected = await testConnection();
      if (!isConnected) {
        throw new Error("Failed to connect to Gemini API");
      }
  
      console.log("Starting Gemini API call with prompt:", prompt);
      
      // Generate content with proper error handling
      const result = await model.generateContent(prompt);
      console.log("Generation result:", result);
      
      if (!result) {
        throw new Error("No result from Gemini API");
      }
  
      const response = await result.response;
      console.log("Generation response:", response);
      
      if (!response) {
        throw new Error("No response object from Gemini API");
      }
  
      const text = response.text();
      console.log("Generated text:", text);
      
      if (!text) {
        throw new Error("Empty text from Gemini API");
      }
  
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
      } else if (error.message?.includes("Failed to connect") || error.message?.includes("Failed to initialize")) {
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