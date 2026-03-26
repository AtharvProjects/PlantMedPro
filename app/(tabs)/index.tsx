import { ScrollView, Text, TouchableOpacity, View, Alert, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useState, useEffect, useCallback } from 'react';
import { fetchWeather, getMockWeather, type WeatherData } from '@/services/weather';

const CROPS = [
  { name: 'Wheat', emoji: '🌾', border: '#f59e0b' },
  { name: 'Rice', emoji: '🍚', border: '#84cc16' },
  { name: 'Tomato', emoji: '🍅', border: '#ef4444' },
  { name: 'Onion', emoji: '🧅', border: '#a855f7' },
  { name: 'Banana', emoji: '🍌', border: '#eab308' },
];

const RECENT_DIAGNOSES = [
  { date: 'Today', disease: 'European Pear Rust', type: 'Fungus', status: 'Complete', color: '#bbf7d0', textColor: '#065f46' },
  { date: 'Yesterday', disease: 'Leaf Blight', type: 'Bacteria', status: 'Treated', color: '#fef9c3', textColor: '#713f12' },
];

const SPRAY_COLOR: Record<string, string> = {
  Ideal: '#16a34a',
  Moderate: '#d97706',
  Poor: '#dc2626',
};

export default function HomeScreen() {
  const router = useRouter();
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [weather, setWeather] = useState<WeatherData>(getMockWeather());
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);

  const T = {
    en: {
      appName: 'PlantMedPro',
      assistant: 'Assistant',
      yourCrops: 'Your Crops',
      addCrop: 'Add Crop',
      spraying: 'Spraying Conditions',
      scanPlant: 'Scan Your Plant',
      scanDesc: 'Capture a photo to detect diseases, pests, or deficiencies instantly.',
      takePicture: 'Take a Picture',
      recentDiagnoses: 'Recent Diagnoses',
      viewAll: 'View All',
      view: 'View',
      locationMsg: 'Allow location for live weather & spray data',
      allow: 'Allow',
      locationGranted: 'Live weather active 🌤️',
    },
    hi: {
      appName: 'PlantMedPro',
      assistant: 'सहायक',
      yourCrops: 'आपकी फसलें',
      addCrop: 'फसल जोड़ें',
      spraying: 'छिड़काव स्थिति',
      scanPlant: 'पौधे को स्कैन करें',
      scanDesc: 'रोग, कीट या कमी तुरंत पहचानने के लिए फोटो लें।',
      takePicture: 'तस्वीर लें',
      recentDiagnoses: 'हाल के निदान',
      viewAll: 'सब देखें',
      view: 'देखें',
      locationMsg: 'लाइव मौसम डेटा के लिए स्थान अनुमति दें',
      allow: 'अनुमति दें',
      locationGranted: 'लाइव मौसम सक्रिय 🌤️',
    },
  }[lang];

  const loadWeatherForLocation = useCallback(async (lat: number, lon: number) => {
    setWeatherLoading(true);
    try {
      const data = await fetchWeather(lat, lon);
      setWeather(data);
      setLocationGranted(true);
    } catch {
      setWeather(getMockWeather());
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  const handleAllowLocation = () => {
    // React Native doesn't have navigator.geolocation on all platforms without a library,
    // so we use global.navigator if available (web) or fall back gracefully
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      setWeatherLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          loadWeatherForLocation(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          // Default to New Delhi if location denied
          loadWeatherForLocation(28.6139, 77.2090);
        },
        { timeout: 8000 }
      );
    } else {
      // On native without expo-location: default to New Delhi
      loadWeatherForLocation(28.6139, 77.2090);
    }
  };

  const sprayColor = SPRAY_COLOR[weather.sprayCondition] ?? '#d97706';

  return (
    <View style={{ flex: 1, backgroundColor: '#f0fdf4' }}>
      {/* Soft background blobs */}
      <View style={{ position: 'absolute', top: -60, right: -60, width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(134, 239, 172, 0.25)' }} />
      <View style={{ position: 'absolute', top: 180, left: -80, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(147, 197, 253, 0.2)' }} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 130 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={{ paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: 28, fontWeight: '900', color: '#14532d', letterSpacing: -0.8 }}>{T.appName}</Text>
            <Text style={{ fontSize: 13, color: '#4ade80', fontWeight: '600', marginTop: 2 }}>🌱 AgriTech Hub</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {/* Language Toggle */}
            <TouchableOpacity
              onPress={() => setLang(lang === 'en' ? 'hi' : 'en')}
              style={{ backgroundColor: 'rgba(22,163,74,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(22,163,74,0.2)' }}>
              <Text style={{ color: '#16a34a', fontWeight: '700', fontSize: 13 }}>{lang === 'en' ? 'हिं' : 'EN'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => Alert.alert(T.assistant, 'Namaste! I can help with crop diseases, soil health, and dosages. What would you like to know?')}
              style={{ backgroundColor: 'rgba(22,163,74,0.1)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(22,163,74,0.2)' }}>
              <IconSymbol name="sparkles" size={14} color="#16a34a" />
              <Text style={{ color: '#16a34a', marginLeft: 6, fontWeight: '700', fontSize: 13 }}>{T.assistant}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Crops Row */}
        <View style={{ paddingHorizontal: 20, marginBottom: 4 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#6b7280', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12 }}>{T.yourCrops}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 20 }} contentContainerStyle={{ paddingRight: 30 }}>
          {CROPS.map((crop, i) => (
            <TouchableOpacity 
              key={i} 
              style={{ alignItems: 'center', marginRight: 18 }} 
              onPress={() => router.push({ pathname: '/(tabs)/ai-doctor', params: { crop: crop.name } })}>
              <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: crop.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3, marginBottom: 6 }}>
                <Text style={{ fontSize: 30 }}>{crop.emoji}</Text>
              </View>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151' }}>{crop.name}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={{ alignItems: 'center', marginRight: 18 }} onPress={() => Alert.alert(T.addCrop, 'Opening crop selection...')}>
            <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(22,163,74,0.08)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(22,163,74,0.25)', borderStyle: 'dashed', marginBottom: 6 }}>
              <IconSymbol name="plus" size={26} color="#16a34a" />
            </View>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#16a34a' }}>{T.addCrop}</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* LIVE Weather Cards */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 20, paddingLeft: 20 }} contentContainerStyle={{ paddingRight: 30 }}>
          {/* Temperature Card */}
          <View style={{ width: 155, backgroundColor: 'rgba(254,243,199,0.95)', borderRadius: 22, padding: 16, marginRight: 12, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)', shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 3 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <IconSymbol name="thermometer.medium" size={14} color="#92400e" />
              <Text style={{ color: '#92400e', marginLeft: 6, fontSize: 12, fontWeight: '600' }}>{weather.city}</Text>
            </View>
            {weatherLoading
              ? <ActivityIndicator color="#d97706" style={{ marginTop: 8 }} />
              : <>
                  <Text style={{ fontSize: 30, fontWeight: '900', color: '#78350f' }}>{weather.temp}°C</Text>
                  <Text style={{ fontSize: 12, color: '#a16207', marginTop: 2, fontWeight: '500', textTransform: 'capitalize' }}>{weather.description}</Text>
                  <Text style={{ fontSize: 11, color: '#a16207', marginTop: 2 }}>Feels {weather.feels_like}°C</Text>
                </>
            }
          </View>

          {/* Spray Condition Card */}
          <View style={{ width: 205, backgroundColor: 'rgba(254,243,199,0.95)', borderRadius: 22, padding: 16, marginRight: 12, borderWidth: 1, borderColor: `${sprayColor}30`, shadowColor: sprayColor, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 3 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <IconSymbol name="drop.triangle.fill" size={12} color="#92400e" />
              <Text style={{ color: '#92400e', marginLeft: 6, fontSize: 12, fontWeight: '600' }}>{T.spraying}</Text>
            </View>
            {weatherLoading
              ? <ActivityIndicator color="#d97706" style={{ marginTop: 8 }} />
              : <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: sprayColor }} />
                    <Text style={{ fontSize: 18, fontWeight: '800', color: '#78350f' }}>{weather.sprayCondition}</Text>
                  </View>
                  <Text style={{ fontSize: 12, color: '#a16207', marginTop: 4, fontWeight: '500', lineHeight: 16 }}>{weather.sprayMessage}</Text>
                </>
            }
          </View>

          {/* Humidity Card */}
          <View style={{ width: 135, backgroundColor: 'rgba(219,234,254,0.95)', borderRadius: 22, padding: 16, marginRight: 12, borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)', shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 3 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <IconSymbol name="humidity.fill" size={14} color="#1e40af" />
              <Text style={{ color: '#1e40af', marginLeft: 6, fontSize: 12, fontWeight: '600' }}>Humidity</Text>
            </View>
            {weatherLoading
              ? <ActivityIndicator color="#3b82f6" style={{ marginTop: 8 }} />
              : <>
                  <Text style={{ fontSize: 28, fontWeight: '900', color: '#1e3a8a' }}>{weather.humidity}%</Text>
                  <Text style={{ fontSize: 11, color: '#1d4ed8', marginTop: 2, fontWeight: '500' }}>Wind {weather.wind_speed} km/h</Text>
                </>
            }
          </View>
        </ScrollView>

        {/* Location Banner */}
        <View style={{ marginTop: 16, marginHorizontal: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: locationGranted ? 'rgba(240,253,244,0.95)' : 'rgba(255,255,255,0.85)', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: locationGranted ? 'rgba(22,163,74,0.2)' : 'rgba(0,0,0,0.06)' }}>
          <IconSymbol name={locationGranted ? 'location.fill' : 'location'} size={16} color="#16a34a" />
          <Text style={{ flex: 1, marginLeft: 10, fontSize: 13, color: '#374151', fontWeight: '500' }}>
            {locationGranted ? T.locationGranted : T.locationMsg}
          </Text>
          {!locationGranted && (
            <TouchableOpacity onPress={handleAllowLocation} disabled={weatherLoading}>
              {weatherLoading
                ? <ActivityIndicator size="small" color="#16a34a" />
                : <Text style={{ color: '#16a34a', fontWeight: '700', fontSize: 14 }}>{T.allow}</Text>
              }
            </TouchableOpacity>
          )}
        </View>

        {/* Scan Hero Card */}
        <View style={{ marginHorizontal: 20, marginTop: 24 }}>
          <View style={{ backgroundColor: '#14532d', borderRadius: 28, padding: 28, alignItems: 'center', shadowColor: '#14532d', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 20, elevation: 12, overflow: 'hidden' }}>
            <View style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(74,222,128,0.12)' }} />
            <View style={{ position: 'absolute', bottom: -20, left: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(74,222,128,0.08)' }} />

            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(74,222,128,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 2, borderColor: 'rgba(74,222,128,0.3)' }}>
              <Text style={{ fontSize: 38 }}>🌿</Text>
            </View>
            <Text style={{ fontSize: 24, fontWeight: '900', color: 'white', marginBottom: 8, textAlign: 'center', letterSpacing: -0.5 }}>{T.scanPlant}</Text>
            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: 20, marginBottom: 24, paddingHorizontal: 10 }}>{T.scanDesc}</Text>

            <View style={{ flexDirection: 'row', marginBottom: 20, gap: 6 }}>
              <View style={{ width: 20, height: 6, borderRadius: 3, backgroundColor: '#4ade80' }} />
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)' }} />
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)' }} />
            </View>

            <TouchableOpacity
              onPress={() => router.push('/(tabs)/ai-doctor')}
              style={{ backgroundColor: '#4ade80', paddingVertical: 15, paddingHorizontal: 48, borderRadius: 50, shadowColor: '#4ade80', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.45, shadowRadius: 10, elevation: 8 }}>
              <Text style={{ color: '#14532d', fontWeight: '800', fontSize: 16 }}>{T.takePicture} 📸</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Diagnoses */}
        <View style={{ marginHorizontal: 20, marginTop: 28 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#14532d', letterSpacing: -0.3 }}>{T.recentDiagnoses}</Text>
            <TouchableOpacity onPress={() => Alert.alert('History', 'All past diagnoses')}>
              <Text style={{ color: '#16a34a', fontWeight: '700', fontSize: 14 }}>{T.viewAll}</Text>
            </TouchableOpacity>
          </View>

          {RECENT_DIAGNOSES.map((diag, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => router.push('/diagnosis')}
              style={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 20, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}>
              <View style={{ width: 60, height: 60, backgroundColor: '#c1fae5', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                <Text style={{ fontSize: 28 }}>🍃</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: '#9ca3af', fontWeight: '600', marginBottom: 2 }}>{diag.date}</Text>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 6 }}>{diag.disease}</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={{ backgroundColor: '#f0fdf4', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(22,163,74,0.2)' }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#15803d' }}>{diag.type}</Text>
                  </View>
                  <View style={{ backgroundColor: diag.color, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: diag.textColor }}>{diag.status}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/diagnosis')}
                style={{ backgroundColor: 'rgba(22,163,74,0.1)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 }}>
                <Text style={{ color: '#16a34a', fontWeight: '700', fontSize: 13 }}>{T.view}</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}
