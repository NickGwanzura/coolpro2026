
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

// Only initialize the AI client if API key is available
const getAI = () => {
  if (!API_KEY) return null;
  return new GoogleGenAI({ apiKey: API_KEY });
};

export const getTechnicalAdvice = async (prompt: string) => {
  // If no API key, return mock advice
  if (!API_KEY) {
    return `AI Technical Verification (Demo Mode)

Based on your sizing calculation of ${prompt.match(/\d+\.\d+/)?.[0] || 'N/A'} kW:

1. Recommended Compressor Capacity: ${prompt.includes('-18') || prompt.includes('-25') ? '3.5-4.5 kW at -10°C SST' : '2.5-3.5 kW at 0°C SST'}

2. Evaporator Recommendation: ${prompt.includes('-18') || prompt.includes('-25') ? 'Direct expansion coil with 12-15 m² surface area' : 'Forced air unit cooler with 8-10 m²'}

3. Low-GWP Natural Refrigerant Options:
   - R-290 (Propane): Excellent efficiency, 3 GWP. Suitable for small to medium cabinets under 500kg charge
   - R-744 (CO2 Transcritical): 1 GWP. Best for medium to large installations with proper system design

Note: This is demo advice. Set API_KEY in environment to enable live AI verification.`;
  }

  try {
    const ai = getAI();
    if (!ai) {
      return "AI service unavailable. Please configure API_KEY.";
    }
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are a world-class HVAC and Commercial Refrigeration Engineer. Provide precise, technical, and safety-oriented advice regarding refrigerant GWP, installation best practices, and ASHRAE sizing standards.",
        temperature: 0.2
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Technical assistant unavailable. Please check your network connection.";
  }
};
