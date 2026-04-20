import { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity, Platform,
  Share, Alert, StyleSheet, ActivityIndicator, TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { analyzePlant, type DiagnosisResult } from '@/services/plantAI';
import { askPlantExpert, type ChatMessage } from '@/services/aiChat';
import { saveDiagnosis } from '@/services/diagnosisHistory';
import { BlurView } from 'expo-blur';

export default function DiagnosisScreen() {
  const params = useLocalSearchParams();
  const { uri, crop } = params;
  const router = useRouter();
  const analyzedUri = useRef<string | null>(null);
  const [disease, setDisease] = useState<DiagnosisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [noPlant, setNoPlant] = useState(false);
  const [activeTab, setActiveTab] = useState<'symptoms' | 'treatment' | 'prevention'>('symptoms');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [isOfflineResult, setIsOfflineResult] = useState(false);

  useEffect(() => {
    let isActive = true;
    const performAnalysis = async () => {
      if (params.historyData) {
        try {
          const parsed = JSON.parse(params.historyData as string);
          if (!isActive) return;
          setDisease(parsed);
          setIsAnalyzing(false);
          const isEstimate = parsed.source?.toLowerCase().includes('estimate') || 
            parsed.source?.toLowerCase().includes('offline');
          setIsOfflineResult(isEstimate);
          return;
        } catch (e) {
          console.error('Failed to parse history', e);
        }
      }

      if (!uri) {
        if (!isActive) return;
        setIsAnalyzing(false);
        setNoPlant(true);
        return;
      }

      if (analyzedUri.current === uri) return;
      analyzedUri.current = uri as string;
      try {
        const result = await analyzePlant(uri as string, crop as string);
        if (result && !result.isNotPlant) {
          if (!isActive) return;
          setDisease(result);
          // Detect if this is an offline/fallback estimate
          const isEstimate = result.source?.toLowerCase().includes('estimate') ||
            result.source?.toLowerCase().includes('offline');
          setIsOfflineResult(isEstimate);
          // Only save confirmed diagnoses to history (not estimates)
          if (!isEstimate) {
            await saveDiagnosis(result, uri as string);
          }
        } else {
          if (isActive) setNoPlant(true);
        }
      } catch (e) {
        console.error('Diagnosis failed:', e);
        if (isActive) setNoPlant(true);
      } finally {
        if (isActive) setIsAnalyzing(false);
      }
    };
    performAnalysis();
    return () => { isActive = false; };
  }, [uri, params.historyData]);

  const handleShare = async () => {
    if (!disease) return;
    try {
      await Share.share({
        message: `🌿 PlantMedPro Diagnosis Report\n\nCrop: ${disease.crop}\nDisease: ${disease.disease}\nConfidence: ${disease.confidence}%\nSeverity: ${disease.severity}\n\n📋 Symptoms:\n${disease.symptoms.map((s) => `• ${s}`).join('\n')}\n\n💊 Treatment:\n${disease.treatment.map((t) => `• ${t}`).join('\n')}\n\nShared via PlantMedPro 🌾`,
      });
    } catch (e) {
      console.warn('Share failed:', e);
    }
  };

  const handleSpeak = () => {
    if (!disease) return;
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }
    const text = `Diagnosis for ${disease.crop}: ${disease.disease}. Confidence: ${disease.confidence} percent. Severity: ${disease.severity}. Symptoms: ${disease.symptoms.join('. ')}. Treatment: ${disease.treatment.join('. ')}`;
    Speech.speak(text, {
      language: 'en-IN',
      rate: 0.85,
      pitch: 1.0,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
    setIsSpeaking(true);
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || !disease) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    const updatedHistory = [...chatMessages, { role: 'user' as const, content: userMsg }];
    setChatMessages(updatedHistory);
    setIsBotThinking(true);
    const response = await askPlantExpert(
      userMsg,
      { crop: disease.crop, disease: disease.disease },
      chatMessages
    );
    setChatMessages([...updatedHistory, { role: 'model' as const, content: response }]);
    setIsBotThinking(false);
  };

  const getSeverityColor = (s: string) =>
    s === 'Low' ? '#16a34a' : s === 'Medium' ? '#d97706' : '#dc2626';

  if (isAnalyzing) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(22,163,74,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <Text style={{ fontSize: 50 }}>🔬</Text>
        </View>
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#14532d', textAlign: 'center' }}>Analyzing Plant...</Text>
        <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 8, textAlign: 'center', paddingHorizontal: 30 }}>
          Scanning for diseases,{'\n'}pests, and nutrient deficiencies
        </Text>
        <View style={{ width: 200, height: 4, backgroundColor: '#d1fae5', borderRadius: 2, marginTop: 32, overflow: 'hidden' }}>
          <View style={{ width: '80%', height: 4, backgroundColor: '#16a34a', borderRadius: 2 }} />
        </View>
        <Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 16, fontWeight: '500' }}>
          This may take 5–10 seconds
        </Text>
      </View>
    );
  }

  if (noPlant) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fef2f2', alignItems: 'center', justifyContent: 'center', padding: 30 }}>
        <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <IconSymbol name="eye.slash.fill" size={40} color="#ef4444" />
        </View>
        <Text style={{ fontSize: 24, fontWeight: '900', color: '#991b1b', textAlign: 'center' }}>No Plant Detected</Text>
        <Text style={{ fontSize: 15, color: '#b91c1c', marginTop: 12, textAlign: 'center', lineHeight: 22 }}>
          We couldn't identify a plant in this image. Please ensure the leaf is clearly visible, centered, and well-lit.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ backgroundColor: '#ef4444', marginTop: 32, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 14 }}>
          <Text style={{ color: 'white', fontWeight: '800' }}>Try Again 📸</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!disease) return null;

  const humidity = parseFloat(params.humidity as string) || 0;
  const temperature = parseFloat(params.temp as string) || 0;
  const isHighRiskWeather = (humidity > 75 || temperature > 32) && disease?.type !== 'Healthy';

  const typeColor = disease?.type === 'Healthy' ? '#16a34a' : disease?.type === 'Virus' ? '#9333ea' : disease?.type === 'Bacteria' ? '#3b82f6' : '#d97706';

  const tabContent = disease ? {
    symptoms: disease.symptoms,
    treatment: disease.treatment,
    prevention: disease.prevention,
  }[activeTab] || [] : [];

  const SUGGESTED_QUESTIONS = [
    'What organic pesticide should I use?',
    'Will this spread to other crops?',
    'How many days to recover?',
    'What to avoid while treating?',
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Header Container */}
      <View style={{ position: 'absolute', top: 0, width: '100%', zIndex: 10, elevation: 20 }}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(249,250,251,0.98)' }]} />
        )}
        <View style={{ paddingTop: Platform.OS === 'ios' ? 58 : 44, paddingBottom: 14, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.07)' }}>
          <TouchableOpacity onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}>
            <IconSymbol name="chevron.left" size={22} color="#111" />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: '900', color: '#111', letterSpacing: -0.5 }}>{disease?.crop || 'Crop'} Diagnosis</Text>
          <TouchableOpacity onPress={handleShare} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}>
            <IconSymbol name="square.and.arrow.up" size={18} color="#111" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 110, paddingBottom: 160 }} showsVerticalScrollIndicator={false}>
        {/* Diagnosis Card */}
        <View style={{ marginHorizontal: 20, marginTop: 22, backgroundColor: 'white', borderRadius: 28, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 4 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 26, fontWeight: '900', color: '#111827', letterSpacing: -0.8, lineHeight: 32 }}>
                {disease?.disease || 'Analyzing...'}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                <View style={{ backgroundColor: `${typeColor}15`, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: `${typeColor}40` }}>
                  <Text style={{ color: typeColor, fontWeight: '800', fontSize: 12 }}>{disease.type}</Text>
                </View>
                <View style={{ backgroundColor: `${getSeverityColor(disease.severity)}15`, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 }}>
                  <Text style={{ color: getSeverityColor(disease.severity), fontWeight: '800', fontSize: 12 }}>{disease.severity} RISK</Text>
                </View>
              </View>
            </View>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#dcfce7' }}>
              <Text style={{ fontSize: 34 }}>{disease.type === 'Healthy' ? '🌿' : '🍂'}</Text>
            </View>
          </View>

          <View style={{ marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#f3f4f6', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontSize: 12, color: '#9ca3af', fontWeight: '700', textTransform: 'uppercase' }}>Confidence</Text>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#16a34a' }}>{disease.confidence}% Match</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 12, color: '#9ca3af', fontWeight: '700', textTransform: 'uppercase' }}>Scientific Name</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#111827', fontStyle: 'italic' }} numberOfLines={1}>
                {disease.scientificName}
              </Text>
            </View>
          </View>
        </View>

        {/* Captured Image */}
        <View style={{ marginHorizontal: 20, marginTop: 20, borderRadius: 24, overflow: 'hidden', height: 220 }}>
          {uri ? (
            <Image source={{ uri: uri as string }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <View style={{ flex: 1, backgroundColor: '#c1fae5', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 60 }}>🌿</Text>
            </View>
          )}
          <View style={{ position: 'absolute', top: 14, right: 14, backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 }}>
            <Text style={{ color: '#4ade80', fontWeight: '800', fontSize: 14 }}>{disease.confidence}% Match</Text>
          </View>
        </View>

        {/* Weather Risk Advisory */}
        {isHighRiskWeather && (
          <View style={{ marginHorizontal: 20, marginTop: 16, backgroundColor: '#fff7ed', borderRadius: 20, padding: 18, borderLeftWidth: 6, borderColor: '#f97316', flexDirection: 'row', alignItems: 'center', shadowColor: '#f97316', shadowOpacity: 0.1, shadowRadius: 10, elevation: 3 }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#ffedd5', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
              <IconSymbol name="cloud.bolt.rain.fill" size={22} color="#f97316" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#9a3412', marginBottom: 2 }}>Weather Risk Advisory</Text>
              <Text style={{ fontSize: 13, color: '#c2410c', lineHeight: 18 }}>
                Current conditions ({temperature}°C, {humidity}% humidity) favor rapid disease spread. Apply treatment immediately.
              </Text>
            </View>
          </View>
        )}

        {/* Offline Warning Banner */}
        {isOfflineResult && (
          <View style={{ marginHorizontal: 20, marginTop: 16, backgroundColor: '#fffbeb', borderRadius: 16, padding: 14, borderWidth: 1.5, borderColor: '#fcd34d', flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 20, marginRight: 10 }}>⚠️</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '800', color: '#92400e', fontSize: 13 }}>Scanner Offline — Context Estimate</Text>
              <Text style={{ color: '#a16207', fontSize: 12, marginTop: 2, lineHeight: 16 }}>The scanner is temporarily unavailable. This is a context-based estimate. Please retake the photo when network is available for an accurate diagnosis.</Text>
              <Text style={{ color: '#78350f', fontSize: 10, marginTop: 4, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>Debug: {disease.source}</Text>
            </View>
          </View>
        )}

        {/* Listen & Status */}
        <View style={{ marginHorizontal: 20, marginTop: 16 }}>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
            <TouchableOpacity
              onPress={handleSpeak}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', borderRadius: 16, paddingVertical: 12, borderWidth: 1.5, borderColor: isSpeaking ? '#16a34a' : '#e5e7eb' }}>
              <IconSymbol name={isSpeaking ? 'speaker.wave.3.fill' : 'speaker.wave.2'} size={18} color={isSpeaking ? '#16a34a' : '#6b7280'} />
              <Text style={{ marginLeft: 8, fontWeight: '700', color: isSpeaking ? '#16a34a' : '#374151', fontSize: 14 }}>{isSpeaking ? 'Speaking...' : 'Listen (en-IN)'}</Text>
            </TouchableOpacity>
            {!isOfflineResult ? (
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1.5, borderColor: '#bbf7d0' }}>
                <IconSymbol name="checkmark.circle.fill" size={18} color="#16a34a" />
                <Text style={{ marginLeft: 8, fontWeight: '700', color: '#15803d', fontSize: 13 }}>Saved to History ✓</Text>
              </View>
            ) : (
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef3c7', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1.5, borderColor: '#fcd34d' }}>
                <IconSymbol name="exclamationmark.triangle.fill" size={18} color="#d97706" />
                <Text style={{ marginLeft: 8, fontWeight: '700', color: '#b45309', fontSize: 13 }}>Estimate Only</Text>
              </View>
            )}
          </View>

          {/* Tabs */}
          <View style={{ flexDirection: 'row', backgroundColor: '#f3f4f6', borderRadius: 16, padding: 4, marginBottom: 16 }}>
            {(['symptoms', 'treatment', 'prevention'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={{ flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: activeTab === tab ? 'white' : 'transparent', alignItems: 'center' }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: activeTab === tab ? '#111827' : '#9ca3af', textTransform: 'capitalize' }}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#f3f4f6' }}>
            {tabContent.map((item: string, i: number) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: i < tabContent.length - 1 ? 14 : 0 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: activeTab === 'treatment' ? '#16a34a' : activeTab === 'prevention' ? '#3b82f6' : '#d97706', marginTop: 8, marginRight: 12 }} />
                <Text style={{ flex: 1, fontSize: 15, color: '#374151', lineHeight: 22 }}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Action Footer */}
      <BlurView intensity={95} tint="light" style={{ position: 'absolute', bottom: 0, width: '100%', paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 44 : 24, paddingHorizontal: 20, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity
            onPress={() => setShowChat(true)}
            style={{ flex: 1, backgroundColor: '#0ea5e9', paddingVertical: 16, borderRadius: 20, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', shadowColor: '#0ea5e9', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}>
            <IconSymbol name="sparkle" size={18} color="white" />
            <Text style={{ color: 'white', fontWeight: '800', fontSize: 16, marginLeft: 8 }}>Ask Expert</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/treatment', params: { name: disease?.disease } })}
            style={{ flex: 1, backgroundColor: '#16a34a', paddingVertical: 16, borderRadius: 20, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', shadowColor: '#16a34a', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}>
            <Text style={{ color: 'white', fontWeight: '800', fontSize: 16 }}>Treat Plan 🌿</Text>
          </TouchableOpacity>
        </View>
      </BlurView>

      {/* Chat Modal */}
      {showChat && (
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 100, justifyContent: 'flex-end' }]}>
          <BlurView intensity={100} tint="light" style={{ height: '85%', width: '100%', borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden', padding: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <View>
                <Text style={{ fontSize: 24, fontWeight: '900', color: '#111', letterSpacing: -0.5 }}>Specialist</Text>
                <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '600' }}>Expert advice for {disease?.crop}</Text>
              </View>
              <TouchableOpacity
                onPress={() => { setShowChat(false); Speech.stop(); setIsSpeaking(false); }}
                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}>
                <IconSymbol name="xmark" size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1, marginBottom: 16 }} showsVerticalScrollIndicator={false}>
              {chatMessages.length === 0 ? (
                <View style={{ marginTop: 20, alignItems: 'center', paddingHorizontal: 10 }}>
                  <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#e0f2fe', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <Text style={{ fontSize: 40 }}>🧑‍🌾</Text>
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#1e293b', textAlign: 'center' }}>Hello! I'm your Agricultural Expert.</Text>
                  <Text style={{ fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
                    Ask me anything about {disease?.disease} or farming practices for {disease?.crop}.
                  </Text>
                  <View style={{ marginTop: 20, width: '100%', gap: 10 }}>
                    {SUGGESTED_QUESTIONS.map((q, i) => (
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
                  <Text style={{ marginLeft: 10, color: '#64748b', fontSize: 14, fontWeight: '600' }}>Expert is thinking...</Text>
                </View>
              )}
            </ScrollView>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ flex: 1, backgroundColor: 'white', borderRadius: 20, paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 14 : 10, borderWidth: 1, borderColor: '#e2e8f0' }}>
                <TextInput
                  placeholder="Ask a question..."
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
                disabled={!chatInput.trim()}
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

const styles = StyleSheet.create({});
