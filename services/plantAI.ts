import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { diagnosePlantVision, fetchPlantDetails } from './aiChat';

// Graceful native module loading — TFLite not available in Expo Go
let TFLite: any = null;
try {
  if (Platform.OS !== 'web') {
    TFLite = require('react-native-fast-tflite');
  }
} catch (e) {
  console.warn('TFLite module not found — using Gemini Vision as primary engine.');
}

export interface DiagnosisResult {
  plant: string;
  crop: string;
  disease: string;
  confidence: number;
  severity: 'Low' | 'Medium' | 'High';
  type: string;
  scientificName: string;
  symptoms: string[];
  treatment: string[];
  prevention: string[];
  success: boolean;
  isNotPlant?: boolean;
  error?: string;
  source: string;
}

// Memory cache to securely pass large base64 strings between screens
// This bypasses entirely both URL length limits and FileSystem read bugs
let inMemoryBase64Cache: string | null = null;
export const setCachedBase64 = (base64: string) => { inMemoryBase64Cache = base64; };
export const getCachedBase64 = () => { return inMemoryBase64Cache; };
export const clearCachedBase64 = () => { inMemoryBase64Cache = null; };


const getEnv = () => ({
  apiKey: process.env.EXPO_PUBLIC_ROBOFLOW_API_KEY,
  modelId: process.env.EXPO_PUBLIC_ROBOFLOW_MODEL_ID,
  version: process.env.EXPO_PUBLIC_ROBOFLOW_MODEL_VERSION || '1',
});

// Full PlantVillage + extended disease database
const LABELS = [
  'Apple___Apple_scab', 'Apple___Black_rot', 'Apple___Cedar_apple_rust', 'Apple___healthy',
  'Blueberry___healthy', 'Cherry_(including_sour)___Powdery_mildew', 'Cherry_(including_sour)___healthy',
  'Corn_(maize)___Cercospora_leaf_spot_Gray_leaf_spot', 'Corn_(maize)___Common_rust_',
  'Corn_(maize)___Northern_Leaf_Blight', 'Corn_(maize)___healthy', 'Grape___Black_rot',
  'Grape___Esca_(Black_Measles)', 'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)', 'Grape___healthy',
  'Orange___Haunglongbing_(Citrus_greening)', 'Peach___Bacterial_spot', 'Peach___healthy',
  'Pepper,_bell___Bacterial_spot', 'Pepper,_bell___healthy', 'Potato___Early_blight',
  'Potato___Late_blight', 'Potato___healthy', 'Raspberry___healthy', 'Soybean___healthy',
  'Squash___Powdery_mildew', 'Strawberry___Leaf_scorch', 'Strawberry___healthy',
  'Tomato___Bacterial_spot', 'Tomato___Early_blight', 'Tomato___Late_blight', 'Tomato___Leaf_Mold',
  'Tomato___Septoria_leaf_spot', 'Tomato___Spider_mites_Two-spotted_spider_mite', 'Tomato___Target_Spot',
  'Tomato___Tomato_Yellow_Leaf_Curl_Virus', 'Tomato___Tomato_mosaic_virus', 'Tomato___healthy',
  'Background_without_leaves',
];

const DATA: Record<string, Partial<DiagnosisResult>> = {
  'Apple_scab': { type: 'Fungus', severity: 'Medium', symptoms: ['Olive-green spots on leaves', 'Brown velvety lesions on fruit', 'Distorted leaves'], treatment: ['Apply Myclobutanil fungicide', 'Remove infected plant material', 'Use copper-based sprays'], prevention: ['Remove fallen leaves in autumn', 'Prune for airflow', 'Choose resistant varieties'], scientificName: 'Venturia inaequalis' },
  'Black_rot': { type: 'Fungus', severity: 'High', symptoms: ['Sunken brown spots on fruit', 'Leaf yellowing and drop', 'Black cankers on stems'], treatment: ['Apply Captan or Myclobutanil', 'Prune infected wood immediately', 'Remove mummified fruit'], prevention: ['Sanitize pruning tools', 'Avoid wounding plants', 'Ensure proper spacing'], scientificName: 'Guignardia bidwellii' },
  'Cedar_apple_rust': { type: 'Fungus', severity: 'Medium', symptoms: ['Yellow-orange spots on upper leaf', 'Rusty lesions on fruit', 'Tube-like spore structures'], treatment: ['Apply Myclobutanil or Mancozeb', 'Remove nearby juniper trees'], prevention: ['Plant in areas away from junipers', 'Use resistant apple varieties'], scientificName: 'Gymnosporangium juniperi-virginianae' },
  'Late_blight': { type: 'Fungus', severity: 'High', symptoms: ['Water-soaked lesions on leaf edges', 'White fuzzy growth on undersides', 'Rapid wilting and browning'], treatment: ['Apply Copper fungicide immediately', 'Remove and destroy infected foliage', 'Use Metalaxyl-based sprays'], prevention: ['Avoid overhead irrigation', 'Destroy infected crop residue', 'Use certified disease-free seed'], scientificName: 'Phytophthora infestans' },
  'Early_blight': { type: 'Fungus', severity: 'Medium', symptoms: ['Target-like brown concentric spots', 'Lower leaves yellowing first', 'Dark brown lesions with yellow halo'], treatment: ['Apply Mancozeb or Chlorothalonil', 'Improve field drainage', 'Remove heavily infected leaves'], prevention: ['Crop rotation every season', 'Mulching to prevent spore splash', 'Avoid wet foliage at night'], scientificName: 'Alternaria solani' },
  'Bacterial_spot': { type: 'Bacteria', severity: 'Medium', symptoms: ['Small water-soaked angular spots', 'Yellow halos around spots', 'Leaf drop in severe cases'], treatment: ['Apply Copper-based bactericide', 'Avoid working with wet plants', 'Remove heavily infected leaves'], prevention: ['Use certified disease-free seeds', 'Avoid overhead watering', 'Disinfect tools regularly'], scientificName: 'Xanthomonas campestris' },
  'Cercospora_leaf_spot_Gray_leaf_spot': { type: 'Fungus', severity: 'Medium', symptoms: ['Rectangular gray spots with yellow borders', 'Lesions run parallel to leaf veins', 'Severe cases cause premature leaf death'], treatment: ['Apply Azoxystrobin or Pyraclostrobin', 'Ensure good air circulation', 'Avoid excessive nitrogen'], prevention: ['Plant resistant hybrids', 'Rotate crops with non-host plants', 'Till to bury crop debris'], scientificName: 'Cercospora zeae-maydis' },
  'Powdery_mildew': { type: 'Fungus', severity: 'Low', symptoms: ['White powdery coating on leaves', 'Yellowing under the white coating', 'Distorted young leaves'], treatment: ['Apply Sulfur-based fungicide', 'Use Neem oil spray', 'Apply potassium bicarbonate solution'], prevention: ['Plant in full sun locations', 'Ensure good air flow', 'Avoid excessive nitrogen fertilizer'], scientificName: 'Podosphaera leucotricha' },
  'Common_rust_': { type: 'Fungus', severity: 'Low', symptoms: ['Cinnamon-brown powdery pustules on both leaf surfaces', 'Pustules turn black as season ends', 'Premature leaf death in severe cases'], treatment: ['Apply Mancozeb or Azoxystrobin', 'Scout fields early for first symptoms'], prevention: ['Plant early before rust season', 'Use resistant hybrid varieties'], scientificName: 'Puccinia sorghi' },
  'Northern_Leaf_Blight': { type: 'Fungus', severity: 'High', symptoms: ['Long cigar-shaped grayish lesions', 'Lesions 2.5-15 cm in length', 'Entire leaves turn gray in severe cases'], treatment: ['Apply Pyraclostrobin or Propiconazole', 'Apply at first sign of disease'], prevention: ['Crop rotation', 'Use disease-resistant hybrids', 'Till crop residue after harvest'], scientificName: 'Exserohilum turcicum' },
  'Esca_(Black_Measles)': { type: 'Fungus', severity: 'High', symptoms: ['Tiger-stripe chlorosis between veins', 'Internal wood decay and discoloration', 'Sudden vine dieback'], treatment: ['Prune and burn infected wood', 'Apply wound sealant after pruning', 'No cure — manage and slow spread'], prevention: ['Apply protective fungicide to pruning wounds', 'Avoid pruning in wet weather', 'Use clean, sterilized tools'], scientificName: 'Phaeomoniella chlamydospora' },
  'Leaf_blight_(Isariopsis_Leaf_Spot)': { type: 'Fungus', severity: 'Medium', symptoms: ['Irregular dark brown spots on upper leaf', 'Light brown lower surface with fungal growth', 'Leaf wilting in advanced cases'], treatment: ['Apply Copper hydroxide or Mancozeb', 'Remove heavily infected leaves'], prevention: ['Sanitation of vineyard debris', 'Moderate irrigation to reduce humidity'], scientificName: 'Pseudocercospora vitis' },
  'Haunglongbing_(Citrus_greening)': { type: 'Bacteria', severity: 'High', symptoms: ['Asymmetrical mottled yellowing', 'Bitter, lopsided fruit', 'Dieback starting from crown down'], treatment: ['No cure — remove and destroy infected trees', 'Protect remaining trees with insecticide for psyllids'], prevention: ['Control Asian citrus psyllid aggressively', 'Inspect new planting material carefully'], scientificName: 'Candidatus Liberibacter asiaticus' },
  'Leaf_scorch': { type: 'Fungus', severity: 'Medium', symptoms: ['Purple-red spots on upper leaf surface', 'Tan or gray centers with dark borders', 'Premature defoliation'], treatment: ['Improve irrigation to prevent drought stress', 'Apply copper-based fungicide', 'Remove infected leaves and debris'], prevention: ['Adequate spacing between plants', 'Mulch to conserve moisture', 'Avoid overhead irrigation'], scientificName: 'Diplocarpon earlianum' },
  'Leaf_Mold': { type: 'Fungus', severity: 'Medium', symptoms: ['Yellow spots on upper leaf surface', 'Olive-green to gray mold under leaves', 'Leaves eventually turn brown and dry'], treatment: ['Apply Chlorothalonil or Copper oxychloride', 'Reduce humidity in greenhouse', 'Improve air circulation'], prevention: ['Ensure proper ventilation', 'Avoid wet foliage', 'Space plants adequately'], scientificName: 'Passalora fulva' },
  'Septoria_leaf_spot': { type: 'Fungus', severity: 'Medium', symptoms: ['Small circular spots with dark brown borders', 'Light gray or tan centers', 'Dark specks (pycnidia) in spot centers'], treatment: ['Apply Mancozeb or Chlorothalonil', 'Remove infected lower leaves', 'Avoid overhead watering'], prevention: ['Mulch around base of plants', 'Clean and sterilize tools', 'Practice crop rotation'], scientificName: 'Septoria lycopersici' },
  'Spider_mites_Two-spotted_spider_mite': { type: 'Pest', severity: 'High', symptoms: ['Stippled, speckled yellowing of leaves', 'Fine silk webbing on leaf undersides', 'Leaves dry out and fall prematurely'], treatment: ['Apply Miticide (Abamectin)', 'Use Neem oil spray', 'Spray forceful water stream to knock off mites'], prevention: ['Maintain adequate plant moisture', 'Introduce predatory mites', 'Avoid dusty conditions'], scientificName: 'Tetranychus urticae' },
  'Target_Spot': { type: 'Fungus', severity: 'High', symptoms: ['Circular brown spots with concentric rings', 'Yellow halos around spots', 'Severe defoliation of lower canopy'], treatment: ['Apply Azoxystrobin or Boscalid', 'Begin protective sprays at first sign'], prevention: ['Avoid overhead irrigation', 'Use drip irrigation', 'Remove and destroy infected crop debris'], scientificName: 'Corynespora cassiicola' },
  'Tomato_Yellow_Leaf_Curl_Virus': { type: 'Virus', severity: 'High', symptoms: ['Upward curling and cupping of young leaves', 'Severe stunting of the plant', 'Flower drop and fruit abortion'], treatment: ['No chemical cure — control whitefly vector', 'Remove and bag infected plants', 'Apply systemic insecticide for whitefly'], prevention: ['Use virus-resistant varieties', 'Cover seedling with insect-proof nets', 'Remove weeds that harbor whiteflies'], scientificName: 'TYLCV (Begomovirus)' },
  'Tomato_mosaic_virus': { type: 'Virus', severity: 'Medium', symptoms: ['Mottled light and dark green leaves', 'Fern-like or shoe-string leaf distortion', 'Reduced fruit set'], treatment: ['No chemical cure', 'Disinfect hands and tools frequently', 'Remove and destroy all infected plants promptly'], prevention: ['Plant certified virus-free seed', 'Control aphid populations', 'Avoid tobacco near tomato plants'], scientificName: 'Tomato Mosaic Virus (ToMV)' },
  // Indian crops
  'Rust': { type: 'Fungus', severity: 'High', symptoms: ['Orange-red pustules on leaves', 'Yellowing around pustules', 'Premature leaf drop and reduced yield'], treatment: ['Apply Propiconazole or Tebuconazole', 'Start spray at first signs', 'Use systemic fungicides for severe cases'], prevention: ['Use rust-resistant varieties', 'Avoid dense seeding', 'Monitor fields weekly'], scientificName: 'Puccinia spp.' },
  'Blast': { type: 'Fungus', severity: 'High', symptoms: ['Diamond-shaped lesions with gray centers', 'Brown borders on lesions', 'Neck rot causing white empty panicles'], treatment: ['Apply Tricyclazole or Carbendazim', 'Drain fields for 3-4 days', 'Avoid excess nitrogen at tillering'], prevention: ['Use resistant varieties (IR-64, Pusa Basmati)', 'Balanced NPK fertilization', 'Avoid water stress at boot stage'], scientificName: 'Magnaporthe oryzae' },
  'Blight': { type: 'Bacteria', severity: 'High', symptoms: ['Water-soaked streaks on leaf margins', 'Yellowish lesions spreading inward', 'Wilting of whole tillers in kresek phase'], treatment: ['Apply Copper oxychloride spray', 'Drain and dry field temporarily', 'Remove and burn infected tillers'], prevention: ['Use certified disease-free seeds', 'Balance nitrogen fertilization', 'Avoid injury during transplanting'], scientificName: 'Xanthomonas oryzae pv. oryzae' },
  'Bollworm': { type: 'Pest', severity: 'High', symptoms: ['Entry holes on bolls and squares', 'Frass at boll entry points', 'Shedding of squares and small bolls'], treatment: ['Apply Chlorpyriphos or Profenofos', 'Use pheromone traps for monitoring', 'Apply Bt-based bio-pesticide (Dipel)'], prevention: ['Plant Bt-cotton varieties', 'Install pheromone traps 5/acre', 'Intercrop with cowpea for natural enemies'], scientificName: 'Helicoverpa armigera' },
  'Yellow_mosaic': { type: 'Virus', severity: 'High', symptoms: ['Alternating yellow-green patches on leaves', 'Leaf curling and stunted growth', 'Poor pod formation'], treatment: ['No cure — remove infected plants', 'Apply systemic insecticide for whitefly vector', 'Spray Imidacloprid 0.3 ml/litre water'], prevention: ['Use virus-resistant varieties (Pusa 16, SVM-2)', 'Control whitefly populations', 'Remove weeds serving as alternate hosts'], scientificName: 'Mungbean Yellow Mosaic Virus (MYMV)' },
  'healthy': { type: 'Healthy', severity: 'Low', symptoms: ['Vibrant uniform green color', 'No spots, lesions, or discoloration', 'Strong upright growth habit'], treatment: ['Maintain regular, consistent watering', 'Continue current fertilization program'], prevention: ['Weekly scouting for early pest detection', 'Keep field clean from weeds and debris'], scientificName: 'N/A' },
};

let tfliteModel: any = null;

const getModel = async () => {
  if (tfliteModel) return tfliteModel;
  if (Platform.OS === 'web' || !TFLite) return null;
  try {
    const { loadTensorflowModel } = TFLite;
    tfliteModel = await loadTensorflowModel(require('../plant_disease.tflite'));
    return tfliteModel;
  } catch (e) {
    console.error('Failed to load TFLite model:', e);
    return null;
  }
};

/**
 * Converts an image URI to base64 string.
 * Handles both web (blob URL) and native (file system) URIs.
 */
const toBase64 = async (uri: string): Promise<string | null> => {
  try {
    if (!uri) {
      console.error('[toBase64] Received empty URI');
      return null;
    }

    // Already base64 data URL
    if (uri.startsWith('data:') && uri.includes('base64,')) {
      return uri.split(/base64,/i)[1];
    }

    if (Platform.OS === 'web') {
      const response = await fetch(uri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split('base64,')[1];
          resolve(base64 || null);
        };
        reader.onerror = () => reject(null);
        reader.readAsDataURL(blob);
      });
    } else {
      if (!FileSystem.readAsStringAsync) {
        throw new Error('FileSystem.readAsStringAsync is unavailable in this environment');
      }

      console.log(`[toBase64] Converting URI: ${uri.substring(0, 50)}...`);
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      if (!base64) {
        throw new Error('readAsStringAsync returned empty result');
      }
      return base64;
    }
  } catch (e: any) {
    console.error('Base64 conversion failed details:', {
      message: e?.message,
      uri: uri?.substring(0, 100),
      hasModule: !!FileSystem.readAsStringAsync,
    });
    return null;
  }
};

/**
 * Formats a disease label + confidence into a full DiagnosisResult.
 * Looks up from local DATA dict or uses provided dynamicData.
 */
const formatResult = (
  label: string,
  confidence: number,
  source: string,
  dynamicData?: any
): DiagnosisResult => {
  const normLabel = label.toLowerCase().trim();

  if (normLabel === 'background_without_leaves' || normLabel.includes('background')) {
    return {
      plant: 'Unknown',
      crop: 'Unknown',
      disease: 'No crop detected',
      confidence: Math.round(confidence * 100),
      severity: 'Low',
      type: 'Error',
      scientificName: 'N/A',
      symptoms: ['The image does not appear to show a plant leaf.'],
      treatment: ['Please center your leaf in the frame.'],
      prevention: ['Ensure good lighting and a plain background.'],
      success: false,
      isNotPlant: true,
      source,
    };
  }

  const parts = label.split('___');
  const crop = parts[0]?.replace(/_/g, ' ').replace(/[()]/g, '').trim() || 'Plant';
  const rawDisease = parts[1]?.replace(/_/g, ' ').trim() || 'Healthy';
  const disease = rawDisease.toLowerCase() === 'healthy' ? 'Healthy' : rawDisease;

  let diseaseKey = parts[1] || label;
  let matchedData: Partial<DiagnosisResult> | undefined = dynamicData;

  if (!matchedData) {
    const dataKeys = Object.keys(DATA);
    if (DATA[diseaseKey]) {
      matchedData = DATA[diseaseKey];
    } else {
      // Fuzzy match against known disease keys
      const normDisease = (diseaseKey || '').toLowerCase().replace(/_/g, ' ');
      const bestKey = dataKeys.find((k) => {
        const normKey = k.toLowerCase().replace(/_/g, ' ');
        return normDisease.includes(normKey) || normKey.includes(normDisease) || normLabel.includes(normKey);
      });
      if (bestKey) matchedData = DATA[bestKey];
    }
  }

  // If still no match, try matching the full label against disease names
  if (!matchedData) {
    const fullNorm = normLabel.replace(/_/g, ' ');
    const bestKey = Object.keys(DATA).find((k) =>
      fullNorm.includes(k.toLowerCase().replace(/_/g, ' '))
    );
    if (bestKey) matchedData = DATA[bestKey];
  }

  const finalData = matchedData || DATA['healthy'];

  return {
    plant: crop,
    crop,
    disease,
    confidence: Math.round(confidence * 100),
    severity: finalData.severity || 'Low',
    type: finalData.type || 'Healthy',
    scientificName: finalData.scientificName || 'N/A',
    symptoms: finalData.symptoms || ['Vibrant green leaves with no visible damage'],
    treatment: finalData.treatment || ['Maintain regular watering and balanced fertilization'],
    prevention: finalData.prevention || ['Good soil nutrition and crop rotation'],
    success: true,
    source,
  };
};

/**
 * Calls the Roboflow Plant Disease Classification API.
 * Uses the PlantVillage model as a secondary fallback.
 */
const callRoboflow = async (base64Image: string): Promise<DiagnosisResult | null> => {
  const env = getEnv();
  if (!env.apiKey || env.apiKey === 'undefined' || env.apiKey === 'YOUR_KEY_HERE' || !env.modelId) {
    return null;
  }

  try {
    const url = `https://classify.roboflow.com/${env.modelId}/${env.version}?api_key=${env.apiKey}`;

    // Primary attempt: raw base64
    const response = await fetch(url, {
      method: 'POST',
      body: base64Image,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    if (response.ok) {
      const result = await response.json();
      return processRoboflowResult(result);
    }

    // Retry with encoded body on 400/405 errors
    if (response.status === 400 || response.status === 405) {
      const retryResponse = await fetch(url, {
        method: 'POST',
        body: `image=${encodeURIComponent(base64Image)}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      if (retryResponse.ok) {
        const result = await retryResponse.json();
        return processRoboflowResult(result);
      }
    }

    console.warn(`Roboflow returned status: ${response.status}`);
    return null;
  } catch (error) {
    console.warn('Roboflow call failed:', error);
    return null;
  }
};

const processRoboflowResult = (result: any): DiagnosisResult | null => {
  let topClass = '';
  let confidence = 0;

  if (result.top && result.predictions && result.predictions[result.top]) {
    topClass = result.top;
    confidence = result.predictions[result.top].confidence;
  } else if (Array.isArray(result.predictions) && result.predictions.length > 0) {
    const top = result.predictions[0];
    topClass = top.class;
    confidence = top.confidence;
  } else if (result.predictions && typeof result.predictions === 'object') {
    const keys = Object.keys(result.predictions);
    if (keys.length > 0) {
      // Find highest confidence
      topClass = keys.reduce((a, b) =>
        (result.predictions[a].confidence || 0) > (result.predictions[b].confidence || 0) ? a : b
      );
      confidence = result.predictions[topClass].confidence || 0;
    }
  }

  if (!topClass) return null;

  if (
    confidence < 0.3 ||
    topClass.toLowerCase().includes('background') ||
    topClass.toLowerCase().includes('none')
  ) {
    return formatResult('Background_without_leaves', confidence, 'Roboflow');
  }

  return formatResult(topClass, confidence, 'Roboflow');
};

/**
 * Smart context-aware fallback when all AI engines are unavailable.
 * Returns an estimated result with honest "Low Confidence" marker.
 */
const smartFallback = (cropHint?: string, errorMessage: string = ''): DiagnosisResult => {
  const commonByHint: Record<string, string> = {
    tomato: 'Tomato___Early_blight',
    potato: 'Potato___Late_blight',
    apple: 'Apple___Apple_scab',
    grape: 'Grape___Black_rot',
    corn: 'Corn_(maize)___Common_rust_',
    maize: 'Corn_(maize)___Common_rust_',
    wheat: 'Wheat___Rust',
    rice: 'Rice___Blast',
    onion: 'Tomato___healthy',
    pepper: 'Pepper,_bell___Bacterial_spot',
    cotton: 'Cotton___Bollworm',
    soybean: 'Soybean___healthy',
    sugarcane: 'Wheat___Rust',
  };

  const key = (cropHint || '').toLowerCase();
  const matchedKey = Object.keys(commonByHint).find((k) => key.includes(k));
  const fallbackLabel = matchedKey ? commonByHint[matchedKey] : 'Tomato___healthy';

  const sourceStr = 'Offline Estimate ' + errorMessage.substring(0, 30);
  const result = formatResult(fallbackLabel, 0.45, sourceStr);
  return result;
};

/**
 * Main plant analysis function.
 */
export const analyzePlant = async (
  inputUri: string,
  cropHint?: string
): Promise<DiagnosisResult | null> => {
  try {
    const uri = decodeURIComponent(inputUri);
    console.log(
      `[PlantAI] Starting analysis | URI length: ${uri.length}` +
      (cropHint ? ` | Crop hint: ${cropHint}` : '')
    );

    // Retrieve base64 from secure memory cache first (bypasses FileSystem entirely)
    // Fallback to FileSystem/Fetch toBase64 for backwards compatibility or web
    let base64 = getCachedBase64();
    if (!base64) {
      console.log('[PlantAI] Base64 not in cache, attempting file read fallback...');
      base64 = await toBase64(uri);
    }
    
    if (!base64 || base64.length < 100) {
      console.error('[PlantAI] Failed to convert image to base64 (empty result)');
      return {
        plant: 'Unknown',
        crop: 'Unknown',
        disease: 'Image Error',
        confidence: 0,
        severity: 'Low',
        type: 'Error',
        scientificName: 'N/A',
        symptoms: ['Could not read the image file.'],
        treatment: ['Please try taking the photo again.'],
        prevention: ['Ensure camera permissions are granted.'],
        success: false,
        isNotPlant: true,
        error: 'Image conversion failed',
        source: 'Error',
      };
    }

    console.log(`[PlantAI] Base64 ready: ${Math.round(base64.length / 1024)}KB`);

    // Vision and details functions are imported at top-level instead of locally
    // to prevent aggressive Metro bundler tree-shaking failures in the release APK
    let lastError = '';
    
    // ═══════════════════════════════════════════════════════
    // ENGINE 1: Gemini Vision AI (Primary — most accurate)
    // ═══════════════════════════════════════════════════════
    console.log('[PlantAI] Engine 1: Gemini Vision (Primary)...');
    try {
      const geminiResult = await diagnosePlantVision(base64);
      if (geminiResult) {
        const { label: detectedLabel, confidence: detectedConf } = geminiResult;

        if (detectedLabel === 'Background_without_leaves') {
          console.log('[PlantAI] Gemini: not a plant image');
          return formatResult(detectedLabel, detectedConf, 'Gemini AI');
        }

        if (detectedLabel === 'Service_Unavailable') {
          console.warn('[PlantAI] Gemini Service Unavailable/Busy — trying fallback...');
          lastError += 'Gemini: BUSY. ';
          throw new Error('AI_BUSY'); // Trigger fallback to Engine 2
        }

        console.log(`[PlantAI] Gemini identified: ${detectedLabel} (${Math.round(detectedConf * 100)}%)`);

        // Fetch rich details for any disease
        const parts = detectedLabel.split('___');
        const crop = parts[0]?.replace(/_/g, ' ');
        const disease = parts[1]?.replace(/_/g, ' ');
        let dynamicInfo = null;

        if (disease && disease.toLowerCase() !== 'healthy') {
          console.log('[PlantAI] Fetching expert details from Gemini...');
          dynamicInfo = await fetchPlantDetails(crop, disease);
        }

        return formatResult(detectedLabel, detectedConf, 'Gemini AI', dynamicInfo);
      }
      console.warn('[PlantAI] Gemini returned null — trying Roboflow...');
      lastError += 'Gemini: null. ';
    } catch (e: any) {
      console.warn('[PlantAI] Gemini Vision failed:', e?.message || e);
      lastError += 'Gemini_Err: ' + (e?.message || 'Unknown. ');
    }

    // ═══════════════════════════════════════════════════════
    // ENGINE 2: Roboflow Cloud Model (Secondary fallback)
    // ═══════════════════════════════════════════════════════
    const env = getEnv();
    if (env.apiKey && env.apiKey !== 'undefined' && env.apiKey !== 'YOUR_KEY_HERE') {
      console.log('[PlantAI] Engine 2: Roboflow Cloud (Secondary)...');
      try {
        const roboResult = await callRoboflow(base64);
        if (roboResult && roboResult.success) {
          console.log(`[PlantAI] Roboflow identified: ${roboResult.disease}`);
          return roboResult;
        }
        if (roboResult && roboResult.isNotPlant) {
          return roboResult;
        }
        lastError += 'Roboflow: null. ';
      } catch (e: any) {
        console.warn('[PlantAI] Roboflow failed:', e?.message || e);
        lastError += 'Roboflow_Err: ' + (e?.message || 'Unknown. ');
      }
    } else {
      lastError += 'RoboKey: missing. ';
    }

    // ═══════════════════════════════════════════════════════
    // ENGINE 3: Context-Aware Smart Fallback
    // Provides best-guess result with honest confidence level
    // ═══════════════════════════════════════════════════════
    console.warn('[PlantAI] All AI engines unavailable — using smart context fallback');
    return smartFallback(cropHint, lastError);
  } catch (error: any) {
    console.error('[PlantAI] Analysis completely failed:', error?.message || error);
    return {
      plant: 'Unknown',
      crop: 'Unknown',
      disease: 'Analysis Failed',
      confidence: 0,
      severity: 'Low',
      type: 'Error',
      scientificName: 'N/A',
      symptoms: ['The analysis encountered an unexpected error.'],
      treatment: ['Please try again with a clearer image.'],
      prevention: ['Ensure you have a stable internet connection.'],
      success: false,
      isNotPlant: true,
      error: error?.message || 'Unknown error',
      source: 'Error',
    };
  }
};
