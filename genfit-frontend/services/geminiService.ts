import { GoogleGenAI, Type, Chat } from "@google/genai";

const GEMINI_API_KEY = (import.meta.env.VITE_API_KEY as string | undefined)?.trim() || "";

const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
});

const TEXT_MODEL = 'gemini-2.5-flash';
const VISION_MODEL = 'gemini-2.5-flash';

export const hasGeminiApiKey = () => GEMINI_API_KEY.length > 0;

export const formatAiError = (error: unknown) => {
  const raw = error instanceof Error ? error.message : String(error || "Unknown error");
  const message = raw.toLowerCase();

  if (message.includes("api key") || message.includes("unauthorized") || message.includes("403")) {
    return "AI key issue detected. Check `VITE_API_KEY` in your frontend environment.";
  }

  if (message.includes("quota") || message.includes("rate") || message.includes("429")) {
    return "AI usage limit reached. Please retry in a minute.";
  }

  if (message.includes("network") || message.includes("fetch")) {
    return "Network error while contacting AI. Check your internet and try again.";
  }

  return "AI assistant is temporarily unavailable. Please try again.";
};

export const analyzeFoodEntry = async (description: string, imageBase64?: string) => {
  try {
    const prompt = `
You are an expert nutrition AI.

Identify food clearly.
Estimate calories, protein, carbs, fats realistically.
If image unclear, estimate best possible.

Return ONLY valid JSON.
`;

    const parts: any[] = [{ text: prompt }];

    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64,
        },
      });
      parts.push({ text: "Analyze this food image." });
    }

    parts.push({ text: `User description: ${description}` });

    const response = await ai.models.generateContent({
      model: imageBase64 ? VISION_MODEL : TEXT_MODEL,
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            foodName: { type: Type.STRING },
            calories: { type: Type.NUMBER },
            protein: { type: Type.NUMBER },
            carbs: { type: Type.NUMBER },
            fats: { type: Type.NUMBER },
            summary: { type: Type.STRING },
          },
          required: ["foodName", "calories", "protein", "carbs", "fats"],
        },
      },
    });

    return JSON.parse(response.text || '{}');

  } catch (error) {
    console.error("Gemini Food Analysis Error:", error);
    throw error;
  }
};
export const suggestWorkout = async (userContext: string) => {
  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: `Generate a structured workout plan based on this user context: ${userContext}.
Return JSON with exercises.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            duration: { type: Type.STRING },
            exercises: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  sets: { type: Type.STRING },
                  reps: { type: Type.STRING },
                  notes: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || '{}');

  } catch (error) {
    console.error("Workout Gen Error:", error);
    throw error;
  }
};
export const createWellnessCoachChat = (assistantName = "ZenFit Assistant", tone = "Professional") => {
  return ai.chats.create({
    model: TEXT_MODEL,
    config: {
      systemInstruction: `
You are ${assistantName}, a professional health coach.
Tone: ${tone}.

Be supportive, practical, and precise.
Give actionable fitness, nutrition, hydration, recovery, and habit guidance.
Use concise structure with clear spacing between sections:
- Summary (1-2 lines)
<br/>
- Action plan (3-5 bullets with 2x spacing for readability)
<br/>
- Safety note if needed

Do not diagnose disease. If user asks medical treatment questions, suggest seeing a licensed doctor.

If user asks for a plan, include realistic beginner-friendly steps.
When useful, ask exactly one follow-up question at the end.
      `,
    },
  });
};