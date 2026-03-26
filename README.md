# 🌿 PlantMedPro – AgriTech Hub

> **Production-ready mobile app for Indian farmers** — Detect plant diseases, track soil health, calculate dosages, and get weather-based spray recommendations.

![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20iOS%20%7C%20Web-brightgreen)
![Framework](https://img.shields.io/badge/Framework-Expo%20React%20Native-blue)
![AI](https://img.shields.io/badge/AI-TFLite%20%2F%20On--Device-orange)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

---

## 📱 Screenshots & Features

| Home | AI Doctor | Diagnosis |
|------|-----------|-----------|
| Crop row, weather cards, hero scan | Live camera with corner frame | Disease, confidence %, TTS |

| Soil Health | Dosage Calculator | Eco-Shield Guide |
|-------------|------------------|------------------|
| Chart + microbial balance | Products × Crops × Stage | 5-slide interactive guide |

---

## 🎯 Core Modules

### 1. 🛡️ AI Plant Doctor
- Live camera with scanning corner-frame UI
- Gallery image picker (from existing photos)
- AI disease detection → confidence %, disease name, type, severity
- Symptoms / Treatment / Prevention tab breakdown
- Text-to-speech readout (en-IN voice)
- Share diagnosis report

### 2. 🌿 Eco-Shield Guide
- 5-page interactive horizontal slide guide
- Safety indicators: toxicity, biodegradability, residue, bee safety
- Step-by-step application instructions with numbered steps
- Color-coded per topic (problem / solution / application / safety / results)

### 3. 🌾 Soil Health Tracker
- Log pH, Moisture %, NPK value, and Carbon %
- Auto-calculates soil health score (0–100)
- Microbial balance visualization (Bacteria / Fungi / Actino / Protozoa)
- Historical trend chart (Bezier line chart)
- LocalStorage persistence via AsyncStorage
- Improvement tips (organic matter, moisture, pH correction)

### 4. 🧪 Dosage Calculator
- 3 products: **Pentaboost**, **Biofertilizer**, **EcoShield Silk**
- 8 crop types + 6 growth stages (with stage-specific multipliers)
- Calculates total product, water volume, and spray dilution ratio
- Application method card per product
- Save instructions offline

### 5. 🏡 Home Dashboard
- **Bilingual** toggle: English ↔ हिंदी
- Crop management row (5 default crops + Add Crop)
- Weather cards: Temperature, Spraying Conditions, Humidity
- Hero scan card linking to AI Doctor
- Recent diagnosis history

---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native + Expo SDK 54 |
| Routing | Expo Router v6 (file-based) |
| Styling | NativeWind v4 (TailwindCSS for RN) |
| Camera | expo-camera v17 |
| Image Picker | expo-image-picker |
| Text-to-Speech | expo-speech |
| Blur / Glass | expo-blur |
| Charts | react-native-chart-kit |
| Local Storage | @react-native-async-storage |
| AI (future) | react-native-fast-tflite |
| Weather API | OpenWeather API (free tier) |
| Gestures | react-native-gesture-handler |
| Animation | react-native-reanimated v4 |

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js >= 18
- npm or yarn
- Expo Go app (mobile) OR Android/iOS simulator

### Install & Run

```bash
# 1. Clone the repo
git clone <repo-url>
cd PlantMedPro

# 2. Install dependencies
npm install

# 3. Start the development server
expo start

# OR for specific platforms:
expo start --android
expo start --ios
expo start --web
```

### Environment Variables

Create a `.env` file in the project root (Already created with your provided key):

```env
# OpenWeather API (free tier – 1000 calls/day)
EXPO_PUBLIC_OPENWEATHER_KEY=YOUR_OPENWEATHER_API_KEY
```

---

## 🧠 How the AI Model Works

### Current State (Mock Inference)
The AI diagnosis is currently implemented as a **mock inference engine** in `services/plantAI.ts` with 4 plant diseases based on PlantVillage dataset patterns.

### Production Integration (TFLite)
To integrate a real on-device model:

```ts
// services/plantAI.ts
import { loadTensorflowModel } from 'react-native-fast-tflite';

const model = await loadTensorflowModel(require('../ai-model/plant_disease.tflite'));
const result = await model.run({ input: imageBuffer });
```

**Recommended model:** PlantVillage dataset fine-tuned MobileNetV2 (38 classes, ~8MB)
- Download from: https://huggingface.co/datasets/bpannier/plantvillage_128

### HuggingFace API Alternative (Online)
```ts
const response = await fetch(
  'https://api-inference.huggingface.co/models/google/vit-base-patch16-224',
  { method: 'POST', headers: { Authorization: 'Bearer hf_...' }, body: imageBlob }
);
```

---

## 📡 API Usage

### OpenWeather API
- **Endpoint:** `GET /data/2.5/weather?lat={lat}&lon={lon}&appid={key}&units=metric`
- **Free tier:** 1,000 calls/day
- **Used for:** Temperature, humidity, wind speed → spray recommendations
- **Offline fallback:** Mock data included (Nashik weather defaults)

---

## 📁 Folder Structure

```
PlantMedPro/
├── app/                          # Expo Router screens
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Tab bar configuration
│   │   ├── index.tsx             # 🏡 Home Dashboard
│   │   ├── ai-doctor.tsx         # 📷 AI Camera Screen
│   │   ├── soil.tsx              # 🌾 Soil Health Tracker
│   │   ├── calculator.tsx        # 🧪 Dosage Calculator
│   │   └── guide.tsx             # 🛡️ Eco-Shield Guide
│   ├── diagnosis.tsx             # Diagnosis Results Screen
│   ├── _layout.tsx               # Root Stack Layout
│   └── modal.tsx                 # Generic Modal
│
├── services/                     # Business Logic & APIs
│   ├── plantAI.ts                # AI disease detection service
│   └── weather.ts                # OpenWeather API service
│
├── components/                   # Reusable UI components
│   ├── GlassCard.tsx             # Glassmorphism card
│   ├── haptic-tab.tsx            # Tab with haptic feedback
│   └── ui/
│       └── icon-symbol.tsx       # SF Symbol / vector icons
│
├── constants/                    # App constants
├── hooks/                        # Custom hooks
├── utils/                        # Utility functions
├── ai-model/                     # TFLite model files (add your .tflite here)
├── assets/                       # Images, fonts
├── global.css                    # NativeWind global CSS
└── tailwind.config.js            # TailwindCSS configuration
```

---

## 🌍 Multi-Language Support

The Home screen includes **English ↔ Hindi** toggle. The translation map (`T`) pattern can be extended to include:
- Marathi, Telugu, Tamil, Kannada, Bengali, Punjabi

To extend:
```ts
// In index.tsx – add new language:
const translations = { en: {...}, hi: {...}, mr: {...} };
const T = translations[lang];
```

---

## 🔔 Push Notifications (Firebase)

To enable Firebase push notifications:

1. Create a Firebase project at https://console.firebase.google.com
2. Add `@react-native-firebase/app` and `@react-native-firebase/messaging`
3. Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
4. Use `messaging().getToken()` to register device tokens

---

## 📈 Future Scalability Plan

| Feature | Implementation |
|---------|---------------|
| Real TFLite Model | Add `.tflite` file to `/ai-model/`, update `plantAI.ts` |
| Firebase Auth | Phone OTP via `@react-native-firebase/auth` |
| Firebase Firestore | Cloud sync for diagnoses and soil logs |
| Community Forum | Add Community tab with Firestore posts |
| Market Price | Add Market tab with agri commodity prices API |
| Offline Maps | Leaflet/Mapbox for field mapping |
| Voice Commands | `expo-speech` + `@react-native-voice/voice` |
| AI Chat Bot | Google Gemini API integration in Assistant panel |

---

## 🛠️ Build for Production

```bash
# Build for Android (APK)
eas build --platform android --profile preview

# Build for iOS
eas build --platform ios --profile preview

# Build for Web
expo export --platform web
```

Requires [Expo EAS CLI](https://docs.expo.dev/eas/): `npm install -g eas-cli`

---

## 🙏 Credits

- Plant disease data inspired by **PlantVillage Dataset** (Penn State)
- UI inspired by **Plantix** and **Apple Human Interface Guidelines**
- Icons: **SF Symbols** (via `@expo/vector-icons`)
- Charts: **react-native-chart-kit**

---

*Built with ❤️ for Indian farmers — Jai Kisan! 🌾*
