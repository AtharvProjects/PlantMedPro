import urllib.request
import json
import base64
import os
import time

# Simple .env parser
def load_env(file_path):
    env = {}
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            for line in f:
                if '=' in line and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    env[key] = value
    return env

env = load_env('.env')
GEMINI_API_KEY = env.get('EXPO_PUBLIC_GEMINI_KEY')

# Local test images
BASE_DIR = os.path.join(os.getcwd(), 'scratch', 'test_images')
TEST_IMAGES = [
    {
        "name": "Rice Blast",
        "file": os.path.join(BASE_DIR, "rice_blast.jpg"),
        "expected": "Rice___Blast"
    },
    {
        "name": "Tomato Early Blight",
        "file": os.path.join(BASE_DIR, "tomato_early_blight.jpg"),
        "expected": "Tomato___Early_blight"
    },
    {
        "name": "Cotton Leaf Curl",
        "file": os.path.join(BASE_DIR, "cotton_leaf_curl.jpg"),
        "expected": "Cotton___Leaf_curl"
    }
]

def analyze_image(image_path):
    print(f"  Processing Local File: {os.path.basename(image_path)}")
    try:
        with open(image_path, 'rb') as f:
            image_data = f.read()
            base64_image = base64.b64encode(image_data).decode('utf-8')
    except Exception as e:
        return f"FILE ERROR: {e}"

    prompt = """You are a plant pathologist AI. Analyze this image and identify the plant and any disease present.

You MUST return your answer in EXACTLY this format with no markdown or extra text:
CROP___DISEASE_NAME

Key diagnostic hints:
- Rice Blast: Look for diamond-shaped lesions with gray centers and brown borders.
- Tomato Early Blight: Look for dark spots with concentric "target" rings.
- Cotton Leaf Curl: Look for upward/downward leaf curling and thickened veins.

Rules:
- Use underscores within names, triple underscore between crop and disease
- If the plant is healthy: use "healthy" as the disease name
- If it's not a plant leaf: return exactly "Background_without_leaves"
- Works for ALL plants/crops/trees.

Return ONLY the formatted label — nothing else."""

    # Trying latest stable model found in listModels
    api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    
    body = {
        "contents": [{
            "parts": [
                {"text": prompt},
                {"inlineData": {"mimeType": "image/jpeg", "data": base64_image}}
            ]
        }],
        "generationConfig": {"temperature": 0.1, "maxOutputTokens": 256}
    }

    # Retry logic for 429 and fallback to secondary model if needed
    models_to_try = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
    
    for model in models_to_try:
        current_api_url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_API_KEY}"
        for attempt in range(2):
            try:
                req = urllib.request.Request(current_api_url, data=json.dumps(body).encode('utf-8'), headers={'Content-Type': 'application/json'})
                with urllib.request.urlopen(req) as response:
                    result = json.loads(response.read().decode('utf-8'))
                    return result['candidates'][0]['content']['parts'][0]['text'].strip()
            except urllib.error.HTTPError as e:
                if e.code == 429:
                    print(f"    ⚠️ {model} rate limited. Trying next/retrying...")
                    time.sleep(1)
                    continue
                print(f"    ❌ {model} failed with {e.code}")
                break # Try next model
            except Exception as e:
                print(f"    ❌ {model} error: {e}")
                break # Try next model
    return "API ERROR: All models failed"

def run_tests():
    print("🚀 Starting PlantMedPro Vision Test Suite (Local Mode)...\n")
    if not GEMINI_API_KEY:
        print("❌ ERROR: EXPO_PUBLIC_GEMINI_KEY not found in .env")
        return

    for test in TEST_IMAGES:
        print(f"Testing: {test['name']}")
        if not os.path.exists(test['file']):
            print(f"    ❌ File not found: {test['file']}")
            continue
            
        result = analyze_image(test['file'])
        
        # Check if result contains disease part
        success = test['expected'].split('___')[1].lower() in result.lower()
        
        print(f"    AI Result: {result}")
        print(f"    Expected:  {test['expected']}")
        print(f"    Status:    {'✅ PASS' if success else '❌ FAIL'}\n")
        time.sleep(1) # Base delay between tests

if __name__ == "__main__":
    run_tests()
