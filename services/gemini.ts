
import { GoogleGenAI } from "@google/genai";

// Fixed: Correctly initialize GoogleGenAI with the apiKey property as required by the SDK guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getTechnicalAdvice = async (prompt: string) => {
  try {
    // Fixed: Using 'gemini-3-pro-preview' as this task involves complex engineering reasoning and calculations.
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are a world-class HVAC and Commercial Refrigeration Engineer. Provide precise, technical, and safety-oriented advice regarding refrigerant GWP, installation best practices, and ASHRAE sizing standards.",
        temperature: 0.2
      }
    });
    // Fixed: The text property directly returns the generated string (it is not a function).
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Technical assistant unavailable. Please check your network connection.";
  }
};
