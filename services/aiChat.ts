import { Platform } from 'react-native';

/**
 * PlantMedPro - Gemini AI Chat Service
 * Provides contextual agricultural advice based on diagnosis.
 */

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_KEY || '';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export type ChatMessage = {
  role: 'user' | 'model';
  content: string;
};

export async function askPlantExpert(
  question: string,
  context: { crop: string; disease: string },
  history: ChatMessage[] = []
): Promise<string> {
  // If no API key, return a mock response for demo purposes
  if (!GEMINI_API_KEY) {
    await new Promise(r => setTimeout(r, 1500));
    return `[MOCK AI RESPONSE] As an agricultural expert, for ${context.crop} affected by ${context.disease}, I recommend ensuring proper soil drainage and avoiding nitrogen-heavy fertilizers during the peak infection period. Would you like to know about organic fungicide alternatives?`;
  }

  try {
    const prompt = `You are an expert agricultural scientist and plant pathologist. 
    The user's crop is ${context.crop} and it has been diagnosed with ${context.disease}.
    Provide concise, actionable, and scientifically accurate advice for a farmer in India.
    Keep the tone professional yet encouraging.
    User Question: ${question}`;

    const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          ...history.map(h => ({ role: h.role, parts: [{ text: h.content }] })),
          { role: 'user', parts: [{ text: prompt }] }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 512,
        }
      })
    });

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't process that request right now.";
  } catch (error) {
    console.error('Gemini API Error:', error);
    return "The AI specialist is currently busy. Please try again in a few minutes.";
  }
}
