import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Platform,
  Share, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { fetchTreatmentPlan } from '@/services/aiChat';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_KEY || '';

interface TreatmentStep {
  title: string;
  desc: string;
  icon: string;
  color: string;
}

const DEFAULT_STEPS: TreatmentStep[] = [
  { title: 'Isolate Infected Area', desc: 'Remove all visibly infected leaves and move affected plants away from healthy sections immediately.', icon: 'hand.raised.fill', color: '#ef4444' },
  { title: 'Apply Treatment Solution', desc: 'Mix recommended fungicide/bactericide with water as per label. Spray thoroughly on all affected surfaces.', icon: 'drop.fill', color: '#16a34a' },
  { title: 'Monitor Recovery', desc: 'Check every 2–3 days for new growth or disease spread. Repeat treatment if symptoms persist after 7 days.', icon: 'eye.fill', color: '#3b82f6' },
  { title: 'Preventive Follow-up', desc: 'After recovery, apply a preventive spray and ensure proper spacing, drainage, and ventilation.', icon: 'checkmark.circle.fill', color: '#d97706' },
];

export default function TreatmentScreen() {
  const router = useRouter();
  const { name = 'Plant Disease' } = useLocalSearchParams();
  const diseaseName = name as string;
  const [steps, setSteps] = useState<TreatmentStep[]>(DEFAULT_STEPS);
  const [loading, setLoading] = useState(true);
  const [proTip, setProTip] = useState('Always apply sprays in the early morning or late evening (before 9 AM or after 5 PM) to avoid leaf burn and maximize absorption.');

  useEffect(() => {
    loadAITreatmentSteps();
  }, [diseaseName]);

  const loadAITreatmentSteps = async () => {
    if (diseaseName?.toLowerCase() === 'healthy') {
      setSteps([{ title: 'No Treatment Needed', desc: 'Your plant is completely healthy. Continue your regular care routines.', icon: 'checkmark.seal.fill', color: '#16a34a' }]);
      setProTip('Keep up the good work! Make sure to water regularly and monitor your plants for any early signs of pests.');
      setLoading(false);
      return;
    }
    if (diseaseName === 'Plant Disease') {
      setLoading(false);
      return;
    }
    try {
      const data = await fetchTreatmentPlan(diseaseName);
      if (data && Array.isArray(data.steps) && data.steps.length === 4) {
        setSteps(data.steps);
        if (data.proTip) setProTip(data.proTip);
      }
    } catch (e) {
      console.warn('Treatment AI load failed, using defaults:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      const stepText = steps.map((s, i) => `${i + 1}. ${s.title}\n   ${s.desc}`).join('\n\n');
      await Share.share({
        message: `🌿 Treatment Plan for ${diseaseName}\n\n${stepText}\n\n💡 Pro Tip: ${proTip}\n\nShared via PlantMedPro 🌾`,
      });
    } catch (e) {
      Alert.alert('Share', 'Could not share treatment plan.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <View style={{ paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingBottom: 20, paddingHorizontal: 20, backgroundColor: 'white', flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginRight: 15 }}>
          <IconSymbol name="arrow.left" size={20} color="#111" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>Treatment Plan</Text>
          <Text style={{ fontSize: 20, fontWeight: '900', color: '#111' }} numberOfLines={1}>{diseaseName}</Text>
        </View>
        <TouchableOpacity
          onPress={handleShare}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center' }}>
          <IconSymbol name="square.and.arrow.up" size={18} color="#16a34a" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={{ marginTop: 16, color: '#6b7280', fontWeight: '600', fontSize: 15 }}>
            Generating treatment plan...
          </Text>
          <Text style={{ marginTop: 6, color: '#9ca3af', fontSize: 13 }}>
            Customized for {diseaseName}
          </Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
          {/* Smart Badge */}
          <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', borderRadius: 14, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: '#bfdbfe' }}>
              <Text style={{ fontSize: 18, marginRight: 10 }}>✨</Text>
              <Text style={{ fontSize: 13, color: '#1d4ed8', fontWeight: '700', flex: 1 }}>
                Smart treatment plan specific to <Text style={{ fontStyle: 'italic' }}>{diseaseName}</Text>
              </Text>
            </View>
          </View>

          <Text style={{ fontSize: 16, color: '#4b5563', lineHeight: 24, marginBottom: 24 }}>
            Follow these steps carefully to ensure your crop recovers from <Text style={{ fontWeight: '700' }}>{diseaseName}</Text>.
          </Text>

          {steps.map((step, i) => (
            <View key={i} style={{ flexDirection: 'row', marginBottom: 24, backgroundColor: 'white', borderRadius: 20, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3, borderWidth: 1, borderColor: `${step.color}20` }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: `${step.color}15`, alignItems: 'center', justifyContent: 'center', marginRight: 16, flexShrink: 0 }}>
                <IconSymbol name={step.icon as any} size={22} color={step.color} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: step.color, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                    <Text style={{ color: 'white', fontWeight: '900', fontSize: 11 }}>0{i + 1}</Text>
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827', flex: 1 }}>{step.title}</Text>
                </View>
                <Text style={{ fontSize: 14, color: '#4b5563', lineHeight: 21 }}>{step.desc}</Text>
              </View>
            </View>
          ))}

          {/* Pro Tip */}
          <View style={{ backgroundColor: '#fffbeb', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#fef3c7', marginTop: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <IconSymbol name="info.circle.fill" size={18} color="#d97706" />
              <Text style={{ marginLeft: 10, fontSize: 16, fontWeight: '800', color: '#92400e' }}>Pro Tip 💡</Text>
            </View>
            <Text style={{ fontSize: 14, color: '#b45309', lineHeight: 21 }}>{proTip}</Text>
          </View>
        </ScrollView>
      )}

      {/* Footer */}
      <View style={{ position: 'absolute', bottom: 0, width: '100%', padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20, backgroundColor: 'rgba(255,255,255,0.95)', borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)')}
          style={{ backgroundColor: '#16a34a', paddingVertical: 18, borderRadius: 16, alignItems: 'center', shadowColor: '#16a34a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 }}>
          <Text style={{ color: 'white', fontWeight: '800', fontSize: 17 }}>✅ Done — Back to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
