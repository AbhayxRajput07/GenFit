import { GoogleGenAI, Type, Chat } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_API_KEY as string,
});

const TEXT_MODEL = 'gemini-2.5-flash';
const VISION_MODEL = 'gemini-2.5-flash';

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
export const createWellnessCoachChat = () => {
  return ai.chats.create({
    model: TEXT_MODEL,
    config: {
      systemInstruction: `
You are Genfit AI Health Coach.

Be supportive, practical, motivating.
Give fitness, nutrition, wellness advice.
Keep answers short and helpful.

If medical issue → suggest doctor consultation.
      `,
    },
  });
};