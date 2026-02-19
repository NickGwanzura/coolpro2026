
import Groq from "groq-sdk";

const API_KEY = process.env.GROQ_API_KEY;

// Only initialize the Groq client if API key is available
const getGroqClient = (): Groq | null => {
  if (!API_KEY) return null;
  return new Groq({ apiKey: API_KEY });
};

export const getTechnicalAdvice = async (prompt: string): Promise<string> => {
  // If no API key, return mock advice
  if (!API_KEY) {
    return `AI Technical Verification (Demo Mode)

Based on your sizing calculation:

1. Recommended Compressor Capacity: 3.5-4.5 kW at -10°C SST for medium temperature, 2.5-3.5 kW at 0°C SST for low temperature applications

2. Evaporator Recommendation: Direct expansion coil with 12-15 m² surface area for reach-in cabinets. Forced air unit cooler with 8-10 m² for walk-in units.

3. Low-GWP Natural Refrigerant Options:
   - R-290 (Propane): Excellent efficiency (COP 3.5-4.5), 3 GWP. Suitable for small to medium cabinets under 500kg charge. flammable but safe with proper containment.
   - R-744 (CO2 Transcritical): 1 GWP. Best for medium to large installations with proper system design. Higher operating pressures (up to 100 bar).

Note: This is demo advice. Set GROQ_API_KEY in environment to enable live AI verification.`;
  }

  try {
    const groq = getGroqClient();
    if (!groq) {
      return "AI service unavailable. Please configure GROQ_API_KEY.";
    }
    
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a world-class HVAC and Commercial Refrigeration Engineer. Provide precise, technical, and safety-oriented advice regarding refrigerant GWP, installation best practices, and ASHRAE sizing standards. Keep responses concise but technically accurate."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama-3.1-70b-versatile",
      temperature: 0.2,
      max_tokens: 1024,
    });
    
    return chatCompletion.choices[0]?.message?.content || "No response generated";
  } catch (error) {
    console.error("Groq API Error:", error);
    return "Technical assistant unavailable. Please check your network connection.";
  }
};
