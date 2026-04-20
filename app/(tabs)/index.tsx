import { useState, useEffect, useCallback } from 'react';
import {
  ScrollView, Text, TouchableOpacity, View, Alert,
  Platform, ActivityIndicator, TextInput, StyleSheet
} from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { fetchWeather, getMockWeather, type WeatherData } from '@/services/weather';
import {
  getRecentDiagnoses, formatDiagnosisDate, clearHistory, type StoredDiagnosis,
} from '@/services/diagnosisHistory';
import { askPlantExpert, type ChatMessage } from '@/services/aiChat';
import { BlurView } from 'expo-blur';

import * as Location from 'expo-location';

const SPRAY_COLOR: Record<string, string> = {
  Ideal: '#16a34a',
  Moderate: '#d97706',
  Poor: '#dc2626',
};

const TYPE_EMOJI: Record<string, string> = {
  Fungus: '🍄',
  Bacteria: '🦠',
  Virus: '🧬',
  Pest: '🐛',
  Healthy: '🌿',
};

export default function HomeScreen() {
  const router = useRouter();
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [weather, setWeather] = useState<WeatherData>(getMockWeather());
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);

  const [recentDiagnoses, setRecentDiagnoses] = useState<StoredDiagnosis[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Chat Modal State
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isBotThinking, setIsBotThinking] = useState(false);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setHistoryLoading(true);
    const history = await getRecentDiagnoses(5);
    setRecentDiagnoses(history);
    setHistoryLoading(false);
  };

  const T_translations = {
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
      noHistory: 'No diagnoses yet — scan your first plant!',
      clearHistory: 'Clear History',
      clearConfirm: 'Are you sure you want to delete all past diagnoses?',
      cancel: 'Cancel',
      clearAll: 'Clear All',
      humidity: 'Humidity',
      wind: 'Wind',
      feels: 'Feels',
      kmh: 'km/h',
      match: 'match',
      expertTitle: 'Virtual Assistant',
      expertDesc: 'Ask about crop care, weather, and farming',
      typeMessage: 'Ask a question...',
      thinking: 'Assistant is thinking...',
      suggestions: [
        'What should I plant this season?',
        'How to improve soil health?',
        'Organic ways to stop pests?',
      ],
      clearBtn: 'Clear',
      cameraError: 'Camera error',
    },
    hi: {
      appName: 'प्लांटमेडप्रो',
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
      noHistory: 'अभी तक कोई निदान नहीं — पहले पौधे को स्कैन करें!',
      clearHistory: 'इतिहास मिटाएं',
      clearConfirm: 'क्या आप सुनिश्चित हैं कि आप सभी पिछले निदानों को हटाना चाहते हैं?',
      cancel: 'रद्द करें',
      clearAll: 'सभी हटाएं',
      humidity: 'नमी',
      wind: 'हवा',
      feels: 'महसूस',
      kmh: 'किमी/घं',
      match: 'प्रमाणित',
      expertTitle: 'कृषि सहायक',
      expertDesc: 'खेती, मौसम और देखभाल के बारे में पूछें',
      typeMessage: 'अपना सवाल पूछें...',
      thinking: 'सहायक सोच रहा है...',
      suggestions: [
        'इस मौसम में क्या उगाएं?',
        'मिट्टी को कैसे सुधारें?',
        'कीट रोकने का जैविक तरीका?',
      ],
      clearBtn: 'हटाएं',
      cameraError: 'कैमरा त्रुटि',
    },
  };

  const T = T_translations[lang];

  const handleClearHistory = () => {
    Alert.alert(T.clearHistory, T.clearConfirm, [
      { text: T.cancel, style: 'cancel' },
      {
        text: T.clearAll, style: 'destructive',
        onPress: async () => {
          await clearHistory();
          setRecentDiagnoses([]);
        },
      },
    ]);
  };

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

  const handleAllowLocation = async () => {
    try {
      setWeatherLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        // Ensure location services are on
        const enabled = await Location.hasServicesEnabledAsync();
        if (!enabled) {
          Alert.alert(
            lang === 'en' ? 'Location Disabled' : 'स्थान बंद है',
            lang === 'en' ? 'Please enable GPS to get weather for your farm.' : 'कृपया अपने खेत का मौसम जानने के लिए GPS चालू करें।'
          );
        }

        let loc = await Location.getLastKnownPositionAsync();
        if (!loc) {
          // getCurrentPositionAsync can hang in APKs if accuracy is set to High/Low without a timeout or dialog
          loc = await Location.getCurrentPositionAsync({ 
            accuracy: Location.Accuracy.Balanced,
            mayShowUserSettingsDialog: true
          });
        }
        if (loc) {
          loadWeatherForLocation(loc.coords.latitude, loc.coords.longitude);
        } else {
          // If still null, fallback to Delhi
          loadWeatherForLocation(28.6139, 77.2090);
        }
      } else {
        // User denied permissions — fallback to Delhi
        loadWeatherForLocation(28.6139, 77.2090);
      }
    } catch (e) {
      console.warn('Location exception:', e);
      // Failsafe fallback
      loadWeatherForLocation(28.6139, 77.2090);
    } finally {
      setWeatherLoading(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    const updatedHistory = [...chatMessages, { role: 'user' as const, content: userMsg }];
    setChatMessages(updatedHistory);
    setIsBotThinking(true);
    // Passing a generic context since this is the global assistant
    const response = await askPlantExpert(
      userMsg,
      { crop: 'General Farming', disease: 'General Inquiry' },
      chatMessages
    );
    setChatMessages([...updatedHistory, { role: 'model' as const, content: response }]);
    setIsBotThinking(false);
  };

  const sprayColor = SPRAY_COLOR[weather.sprayCondition] ?? '#d97706';

  return (
    <View style={{ flex: 1, backgroundColor: '#f0fdf4' }}>
      {/* Background blobs */}
      <View style={{ position: 'absolute', top: -60, right: -60, width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(134, 239, 172, 0.25)' }} />
      <View style={{ position: 'absolute', top: 180, left: -80, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(147, 197, 253, 0.2)' }} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 130 }} showsVerticalScrollIndicator={false}>

        <View style={{ paddingTop: Platform.OS === 'ios' ? 50 : 38, paddingHorizontal: 20, paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: 28, fontWeight: '900', color: '#14532d', letterSpacing: -0.8 }}>{T.appName}</Text>
            <Text style={{ fontSize: 13, color: '#4ade80', fontWeight: '600', marginTop: 2 }}>🌱 AgriTech Hub</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity
              onPress={() => setLang(lang === 'en' ? 'hi' : 'en')}
              style={{ backgroundColor: 'rgba(22,163,74,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(22,163,74,0.2)' }}>
              <Text style={{ color: '#16a34a', fontWeight: '700', fontSize: 13 }}>{lang === 'en' ? 'हिं' : 'EN'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowChat(true)}
              style={{ backgroundColor: 'rgba(22,163,74,0.1)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(22,163,74,0.2)' }}>
              <IconSymbol name="sparkles" size={14} color="#16a34a" />
              <Text style={{ color: '#16a34a', marginLeft: 6, fontWeight: '700', fontSize: 13 }}>{T.assistant}</Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* Weather Cards */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10, paddingLeft: 20 }} contentContainerStyle={{ paddingRight: 30 }}>
          {/* Temperature */}
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
                  <Text style={{ fontSize: 11, color: '#a16207', marginTop: 2 }}>{T.feels} {weather.feels_like}°C</Text>
                </>
            }
          </View>

          {/* Spray Condition */}
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

          {/* Humidity */}
          <View style={{ width: 135, backgroundColor: 'rgba(219,234,254,0.95)', borderRadius: 22, padding: 16, marginRight: 12, borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)', shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 3 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <IconSymbol name="humidity.fill" size={14} color="#1e40af" />
              <Text style={{ color: '#1e40af', marginLeft: 6, fontSize: 12, fontWeight: '600' }}>{T.humidity}</Text>
            </View>
            {weatherLoading
              ? <ActivityIndicator color="#3b82f6" style={{ marginTop: 8 }} />
              : <>
                  <Text style={{ fontSize: 28, fontWeight: '900', color: '#1e3a8a' }}>{weather.humidity}%</Text>
                  <Text style={{ fontSize: 11, color: '#1d4ed8', marginTop: 2, fontWeight: '500' }}>{T.wind} {weather.wind_speed} {T.kmh}</Text>
                </>
            }
          </View>
        </ScrollView>

        {/* Location Banner */}
        <View style={{ marginTop: 12, marginHorizontal: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: locationGranted ? 'rgba(240,253,244,0.95)' : 'rgba(255,255,255,0.85)', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: locationGranted ? 'rgba(22,163,74,0.2)' : 'rgba(0,0,0,0.06)' }}>
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

        {/* Hero Scan Card */}
        <View style={{ marginHorizontal: 20, marginTop: 16 }}>
          <View style={{ backgroundColor: '#14532d', borderRadius: 24, padding: 20, alignItems: 'center', shadowColor: '#14532d', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 20, elevation: 12, overflow: 'hidden' }}>
            <View style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(74,222,128,0.12)' }} />
            <View style={{ position: 'absolute', bottom: -20, left: -30, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(74,222,128,0.08)' }} />
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(74,222,128,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 2, borderColor: 'rgba(74,222,128,0.3)' }}>
              <Text style={{ fontSize: 32 }}>🌿</Text>
            </View>
            <Text style={{ fontSize: 22, fontWeight: '900', color: 'white', marginBottom: 6, textAlign: 'center', letterSpacing: -0.5 }}>{T.scanPlant}</Text>
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: 18, marginBottom: 16, paddingHorizontal: 10 }}>{T.scanDesc}</Text>
            <TouchableOpacity
              onPress={() => router.push({
                pathname: '/(tabs)/ai-doctor',
                params: {
                  temp: weather.temp,
                  humidity: weather.humidity,
                  condition: weather.description
                }
              })}
              style={{ backgroundColor: '#4ade80', paddingVertical: 15, paddingHorizontal: 48, borderRadius: 50, shadowColor: '#4ade80', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.45, shadowRadius: 10, elevation: 8 }}>
              <Text style={{ color: '#14532d', fontWeight: '800', fontSize: 16 }}>{T.takePicture} 📸</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Diagnoses */}
        <View style={{ marginHorizontal: 20, marginTop: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#14532d', letterSpacing: -0.3 }}>{T.recentDiagnoses}</Text>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <TouchableOpacity onPress={handleClearHistory}>
                <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 14 }}>🗑️ {T.clearBtn}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={loadHistory}>
                <Text style={{ color: '#16a34a', fontWeight: '700', fontSize: 14 }}>↻ {T.viewAll}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {historyLoading ? (
            <View style={{ padding: 30, alignItems: 'center' }}>
              <ActivityIndicator color="#16a34a" />
            </View>
          ) : recentDiagnoses.length === 0 ? (
            <View style={{ backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', borderStyle: 'dashed' }}>
              <Text style={{ fontSize: 36, marginBottom: 12 }}>🌱</Text>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#6b7280', textAlign: 'center' }}>{T.noHistory}</Text>
            </View>
          ) : (
            recentDiagnoses.map((diag, i) => {
              const severityColor = diag.severity === 'Low' ? '#16a34a' : diag.severity === 'Medium' ? '#d97706' : '#dc2626';
              const isHealthy = diag.disease?.toLowerCase() === 'healthy';
              return (
                <TouchableOpacity
                  key={diag.id || i}
                  onPress={() => {
                    // Navigate to diagnosis.tsx bypassing ai-doctor scanning state
                    router.push({
                      pathname: '/diagnosis',
                      params: {
                        historyData: JSON.stringify(diag)
                      }
                    });
                  }}
                  style={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 20, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}>
                  <View style={{ width: 60, height: 60, backgroundColor: isHealthy ? '#c1fae5' : '#fee2e2', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                    <Text style={{ fontSize: 28 }}>{TYPE_EMOJI[diag.type] || '🍃'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, color: '#9ca3af', fontWeight: '600', marginBottom: 2 }}>
                      {diag.crop} · {formatDiagnosisDate(diag.created_at)}
                    </Text>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 6 }} numberOfLines={1}>
                      {diag.disease}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <View style={{ backgroundColor: '#f0fdf4', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(22,163,74,0.2)' }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#15803d' }}>{diag.type}</Text>
                      </View>
                      <View style={{ backgroundColor: `${severityColor}15`, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: severityColor }}>{diag.confidence}% {T.match}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Global Assistant Chat Modal */}
      {showChat && (
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 100, justifyContent: 'flex-end' }]}>
          <BlurView intensity={100} tint="light" style={{ height: '85%', width: '100%', borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden', padding: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <View>
                <Text style={{ fontSize: 24, fontWeight: '900', color: '#111', letterSpacing: -0.5 }}>{T.expertTitle}</Text>
                <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '600' }}>{T.expertDesc}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowChat(false)}
                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}>
                <IconSymbol name="xmark" size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1, marginBottom: 16 }} showsVerticalScrollIndicator={false}>
              {chatMessages.length === 0 ? (
                <View style={{ marginTop: 20, alignItems: 'center', paddingHorizontal: 10 }}>
                  <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#e0f2fe', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <Text style={{ fontSize: 40 }}>👩‍🌾</Text>
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#1e293b', textAlign: 'center', marginBottom: 16 }}>
                    {lang === 'en' ? "Namaste! How can I help you today?" : "नमस्ते! मैं आपकी क्या सहायता कर सकता हूँ?"}
                  </Text>
                  <View style={{ marginTop: 10, width: '100%', gap: 10 }}>
                    {T.suggestions.map((q, i) => (
                      <TouchableOpacity key={i} onPress={() => setChatInput(q)} style={{ backgroundColor: 'white', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' }}>
                        <Text style={{ color: '#0ea5e9', fontWeight: '700', fontSize: 13 }}>💬 {q}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : (
                chatMessages.map((msg, idx) => (
                  <View key={idx} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', marginBottom: 16 }}>
                    <View style={{ backgroundColor: msg.role === 'user' ? '#0ea5e9' : '#f1f5f9', padding: 14, borderRadius: 18, borderBottomRightRadius: msg.role === 'user' ? 4 : 18, borderBottomLeftRadius: msg.role === 'model' ? 4 : 18 }}>
                      <Text style={{ color: msg.role === 'user' ? 'white' : '#334155', fontSize: 15, fontWeight: '500', lineHeight: 22 }}>
                        {msg.content}
                      </Text>
                    </View>
                  </View>
                ))
              )}
              {isBotThinking && (
                <View style={{ alignSelf: 'flex-start', backgroundColor: '#f1f5f9', padding: 14, borderRadius: 18, borderBottomLeftRadius: 4, flexDirection: 'row', alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#0ea5e9" />
                  <Text style={{ marginLeft: 10, color: '#64748b', fontSize: 14, fontWeight: '600' }}>{T.thinking}</Text>
                </View>
              )}
            </ScrollView>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ flex: 1, backgroundColor: 'white', borderRadius: 20, paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 14 : 10, borderWidth: 1, borderColor: '#e2e8f0' }}>
                <TextInput
                  placeholder={T.typeMessage}
                  value={chatInput}
                  onChangeText={setChatInput}
                  onSubmitEditing={handleSendChat}
                  returnKeyType="send"
                  style={{ fontSize: 16, color: '#1e293b' }}
                  placeholderTextColor="#94a3b8"
                />
              </View>
              <TouchableOpacity
                onPress={handleSendChat}
                disabled={!chatInput.trim() || isBotThinking}
                style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: chatInput.trim() ? '#0ea5e9' : '#e2e8f0', alignItems: 'center', justifyContent: 'center' }}>
                <IconSymbol name="paperplane.fill" size={20} color={chatInput.trim() ? 'white' : '#94a3b8'} />
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      )}
    </View>
  );
}
