import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_KEY;
const CHAT_MODELS = ['gemini-2.0-flash', 'gemini-flash-latest'];

const TEST_IMAGES = [
  {
    name: 'Rice Blast',
    url: 'https://bugwoodcloud.org/images/768x512/5573033.jpg',
    expected: 'Rice___Blast'
  },
  {
    name: 'Tomato Early Blight',
    url: 'https://extension.umn.edu/sites/extension.umn.edu/files/early-blight-tomato-spots.jpg',
    expected: 'Tomato___Early_blight'
  },
  {
    name: 'Cotton Leaf Curl',
    url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT6-mXGv5p6N9iE0G4C_6X6Z_G1jE1z-R8S_g&s', 
    expected: 'Cotton___Leaf_curl'
  }
];

async function callGemini(base64Image) {
  const prompt = `You are a plant pathologist AI. Analyze this image and identify the plant and any disease present.
You MUST return your answer in EXACTLY this format: CROP___DISEASE_NAME
Return ONLY the formatted label — nothing else.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const body = {
    contents: [{
      parts: [
        { text: prompt },
        { inlineData: { mimeType: 'image/jpeg', data: base64Image } }
      ]
    }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 256 }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'ERROR';
}

async function runTests() {
  console.log('🚀 Starting PlantMedPro Vision Test Suite...\n');
  
  for (const test of TEST_IMAGES) {
    console.log(`Testing: ${test.name}`);
    try {
      const imgRes = await fetch(test.url);
      const buffer = await imgRes.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      
      const result = await callGemini(base64);
      const success = result.toLowerCase().includes(test.expected.split('___')[1].toLowerCase());
      
      console.log(`   URL: ${test.url}`);
      console.log(`   AI Result: ${result}`);
      console.log(`   Expected: ${test.expected}`);
      console.log(`   Status: ${success ? '✅ PASS' : '❌ FAIL'}\n`);
    } catch (e) {
      console.error(`   ❌ Error testing ${test.name}:`, e.message);
    }
  }
}

runTests();
