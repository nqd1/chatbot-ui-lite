import {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
  } from "@google/generative-ai";
  import fs from "node:fs";
  import mime from "mime-types";
  
  const apiKey = process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
  });
  
  const generationConfig = {
    temperature: 2,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseModalities: [
    ],
    responseMimeType: "application/json",
  };
  
  async function run(prompt) {
    try {
      // For text-only generation
      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      if (!response) {
        return "This is test message";
      }

      // Handle text response
      const text = response.text();
      if (text) {
        return text;
      }

      // Handle candidates with inline data
      if (response.candidates && response.candidates.length > 0) {
        for(let candidate_index = 0; candidate_index < response.candidates.length; candidate_index++) {
          for(let part_index = 0; part_index < response.candidates[candidate_index].content.parts.length; part_index++) {
            const part = response.candidates[candidate_index].content.parts[part_index];
            if(part.inlineData) {
              try {
                const filename = `output_${candidate_index}_${part_index}.${mime.extension(part.inlineData.mimeType)}`;
                fs.writeFileSync(filename, Buffer.from(part.inlineData.data, 'base64'));
                console.log(`Output written to: ${filename}`);
              } catch (err) {
                console.error(err);
              }
            }
          }
        }
      }

      return "This is test message";
    } catch (error) {
      console.error("Error in run function:", error);
      return "This is test message";
    }
  }
  
  export default run;