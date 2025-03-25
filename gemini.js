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
      const chatSession = model.startChat({
        generationConfig,
        history: [],
      });
  
      const result = await chatSession.sendMessage(prompt);
      if (!result || !result.response) {
        return "This is test message";
      }
  
      // TODO: Following code needs to be updated for client-side apps.
      const candidates = result.response.candidates;
      for(let candidate_index = 0; candidate_index < candidates.length; candidate_index++) {
        for(let part_index = 0; part_index < candidates[candidate_index].content.parts.length; part_index++) {
          const part = candidates[candidate_index].content.parts[part_index];
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
      return result.response.text() || "This is test message";
    } catch (error) {
      console.error("Error in run function:", error);
      return "This is test message";
    }
  }
  
  export default run;