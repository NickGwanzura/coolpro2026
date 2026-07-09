
import Groq from "groq-sdk";

const API_KEY = process.env.GROQ_API_KEY;

// Only initialize the Groq client if API key is available
const getGroqClient = (): Groq | null => {
  if (!API_KEY) return null;
  return new Groq({ apiKey: API_KEY });
};

export const getTechnicalAdvice = async (prompt: string): Promise<string> => {
  // Return a clear setup message when the technical AI service is not configured.
  if (!API_KEY) {
    return 'AI technical verification is currently unavailable. Configure GROQ_API_KEY to enable live sizing advice.';
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
