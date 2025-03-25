import {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
  } from "@google/generative-ai";
  
  const apiKey = process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  
  const model = genAI.getGenerativeModel({
    model: "gemini-pro",
    generationConfig: {
      temperature: 0.9,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
    }
  });
  
  async function run(prompt) {
    try {
      console.log("Sending prompt to Gemini:", prompt);
      
      // Validate API key
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured");
      }

      // Generate content
      const result = await model.generateContent(prompt);
      console.log("Raw Gemini response:", result);

      // Check if result is valid
      if (!result) {
        throw new Error("No response from Gemini API");
      }

      // Get response
      const response = await result.response;
      console.log("Processed response:", response);

      // Get text from response
      const text = response.text();
      console.log("Final text:", text);

      if (!text) {
        throw new Error("Empty response text from Gemini");
      }

      return text;
    } catch (error) {
      console.error("Detailed error in Gemini API:", {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      return "This is test message";
    }
  }
  
  export default run;