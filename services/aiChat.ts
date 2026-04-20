import { Platform } from 'react-native';

/**
 * PlantMedPro — Gemini AI Chat & Vision Service
 * Optimized for maximum diagnostic reliability across all regions/quotas.
 */

const FALLBACK_KEYS = [
  process.env.EXPO_PUBLIC_GEMINI_KEY,
  process.env.EXPO_PUBLIC_GEMINI_KEY_2,
  process.env.EXPO_PUBLIC_GEMINI_KEY_3,
].filter(Boolean) as string[];

const GEMINI_API_KEY = FALLBACK_KEYS[0] || '';

// Confirmed working model names as of Apr 2026
// Latest valid model names as of 2026
const VISION_MODELS = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-001',
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
];

const CHAT_MODELS = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-001',
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
];

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export type ChatMessage = {
  role: 'user' | 'model';
  content: string;
};

/**
 * Helper to call Gemini with automatic model fallback chain.
 * Aggressively catches rate-limits and quota errors to try alternatives.
 */
async function callGeminiWithFallback(
  models: string[],
  body: any,
  timeout = 30000
): Promise<any> {
  for (const model of models) {
    for (let i = 0; i < FALLBACK_KEYS.length; i++) {
      const apiKey = FALLBACK_KEYS[i];
      try {
        const url = `${BASE_URL}/${model}:generateContent?key=${apiKey}`;
        
        let controller: any = null;
        let signal: any = null;
        if (typeof AbortController !== 'undefined') {
          controller = new AbortController();
          signal = controller.signal;
        }
        
        const timer = setTimeout(() => {
          if (controller) controller.abort();
        }, timeout);

        // Thinking models require specific config, but flash models usually don't.
        // Stripping experimental thinking config unless explicitly using a 'thinking' model.
        const isThinkingModel = model.includes('thinking');
        const finalBody = isThinkingModel
          ? {
              ...body,
              generationConfig: {
                ...body.generationConfig,
                thinkingConfig: { thinkingBudget: 0 },
              },
            }
          : body;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalBody),
          signal,
        });

        clearTimeout(timer);
        const data = await response.json();

        if (data?.error) {
          const code = data.error?.code || 'UNKNOWN';
          console.warn(`[Gemini] Model ${model} failed with key ${i + 1} (${code}): ${data.error?.message} — trying next key/model...`);
          // If a key fails (e.g. quota 429), we just continue to the next key.
          continue; 
        }

        if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          console.log(`[Gemini] Success with model: ${model} using key ${i + 1}`);
          return data;
        }
        continue;
      } catch (e: any) {
        console.warn(`[Gemini] Model ${model} network/execution error with key ${i + 1}: ${e.message} — trying next...`);
        // We'll proceed to the next available fallback key/model.
        continue;
      }
    }
  }
  return null;
}

/**
 * AI expert chatbot — answers farmer questions.
 */
export async function askPlantExpert(
  question: string,
  context: { crop: string; disease: string },
  history: ChatMessage[] = []
): Promise<string> {
  if (!GEMINI_API_KEY) return "I'm currently offline. Please check your internet connection.";

  try {
    const systemContext = `You are an expert plant pathologist for Indian farming. Crop: ${context.crop}, Disease: ${context.disease}. Give concise advice.`;
    const data = await callGeminiWithFallback(CHAT_MODELS, {
      contents: [
        { role: 'user', parts: [{ text: systemContext }] },
        { role: 'model', parts: [{ text: 'OK' }] },
        ...history.map((h) => ({ role: h.role, parts: [{ text: h.content }] })),
        { role: 'user', parts: [{ text: question }] },
      ],
      generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
    });
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "The specialist is busy. Try again.";
  } catch (error) {
    return 'AI Specialist busy. Please try later.';
  }
}

/**
 * Enhanced diagnostic vision with error state tracking.
 * Returns label, confidence, and internal 'error' if all models are busy.
 */
export async function diagnosePlantVision(
  base64Image: string
): Promise<{ label: string; confidence: number; error?: string } | null> {
  if (!GEMINI_API_KEY) return null;

  const prompt = `You are a strict plant pathology AI. Analyze this image and respond ONLY with the exact format: CROP___DISEASE_NAME

RULES:
1. Identify the plant/crop and the disease.
2. If healthy, use "healthy" as the disease (e.g., Tomato___healthy, Hibiscus___healthy).
3. If it's clearly a plant leaf but you don't know the specific plant, use "Plant___healthy".
4. ONLY if there is NO plant or leaf visible at all, return: Background_without_leaves.

DO NOT output any extra text, markdown, or explanation.`;

  try {
    const data = await callGeminiWithFallback(VISION_MODELS, {
      contents: [{
        parts: [
          { text: prompt },
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
        ],
      }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 256 },
    }, 35000);

    if (!data) {
      return { label: 'Service_Unavailable', confidence: 0, error: 'BUSY' };
    }

    const rawText: string = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    // Use [\s\S] instead of the 's' flag for maximum engine compatibility
    const cleanText = rawText.trim().replace(/`/g, '').replace(/\n[\s\S]*/, '').trim();

    if (cleanText.toLowerCase().includes('background')) {
      return { label: 'Background_without_leaves', confidence: 0.95 };
    }

    const match = cleanText.match(/([A-Za-z0-9_(),\s.-]+)___([A-Za-z0-9_\s(),\-\.]+)/);
    if (match) {
      return { label: `${match[1].trim()}___${match[2].trim()}`, confidence: 0.95 };
    }

    if (cleanText.length > 0 && cleanText.length < 50 && !cleanText.toLowerCase().includes('sorry') && !cleanText.toLowerCase().includes('cannot')) {
      return { label: cleanText, confidence: 0.8 };
    }

    return null;
  } catch (error) {
    return { label: 'Service_Unavailable', confidence: 0, error: 'ERROR' };
  }
}

export async function generateStructuredAI<T>(
  prompt: string,
  schema: string,
  models: string[] = CHAT_MODELS
): Promise<T | null> {
  if (!GEMINI_API_KEY) return null;
  const fullPrompt = `${prompt}\n\nJSON structure: ${schema}`;
  try {
    const data = await callGeminiWithFallback(models, {
      contents: [{ parts: [{ text: fullPrompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
    });
    if (!data) return null;
    const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      let cleanJson = jsonMatch[0].replace(/,\s*([\}\]])/g, '$1').replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
      return JSON.parse(cleanJson) as T;
    }
    return null;
  } catch (error) {
    return null;
  }
}

export async function fetchPlantDetails(crop: string, disease: string): Promise<any> {
  const schema = `{ "scientificName": "...", "severity": "Low/Medium/High", "type": "...", "symptoms": ["..."], "treatment": ["..."], "prevention": ["..."] }`;
  return generateStructuredAI(`Data for ${crop} with ${disease}`, schema);
}

export async function fetchTreatmentPlan(diseaseName: string) {
  const schema = `{ "steps": [{ "title": "...", "desc": "...", "icon": "...", "color": "..." }], "proTip": "..." }`;
  return generateStructuredAI(
    `4-step organic treatment for ${diseaseName}. For "icon", ONLY use one of: hand.raised.fill, drop.fill, eye.fill, bug.fill, scissors, shield.fill, cross.case.fill, checkmark.circle.fill, leaf.fill`,
    schema
  );
}
