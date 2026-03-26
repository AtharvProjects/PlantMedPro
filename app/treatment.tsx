import { View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function TreatmentScreen() {
  const router = useRouter();
  const { name = 'Plant Disease' } = useLocalSearchParams();

  const STEPS = [
    { title: 'Isolation', desc: 'Remove all infected leaves and move the plant away from healthy sections.', icon: 'hand.raised.fill', color: '#ef4444' },
    { title: 'Organic Solution', desc: 'Mix 5ml Pentaboost with 1L water. Spray thoroughly on the affected area.', icon: 'drop.fill', color: '#16a34a' },
    { title: 'Monitoring', desc: 'Check every 2 days for new growth. Repeat spray if symptoms persist.', icon: 'eye.fill', color: '#3b82f6' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <View style={{
        paddingTop: Platform.OS === 'ios' ? 60 : 48,
        paddingBottom: 20,
        paddingHorizontal: 20,
        backgroundColor: 'white',
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
      }}>
        <TouchableOpacity onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginRight: 15 }}>
          <IconSymbol name="arrow.left" size={20} color="#111" />
        </TouchableOpacity>
        <View>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>Treatment Plan</Text>
          <Text style={{ fontSize: 20, fontWeight: '900', color: '#111' }}>{name}</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <Text style={{ fontSize: 16, color: '#4b5563', lineHeight: 24, marginBottom: 24 }}>
          Follow these steps carefully to ensure your crop recovers fully from infection.
        </Text>

        {STEPS.map((step, i) => (
          <View key={i} style={{ flexDirection: 'row', marginBottom: 24 }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: `${step.color}15`, alignItems: 'center', justifyContent: 'center', marginRight: 18 }}>
              <IconSymbol name={step.icon as any} size={22} color={step.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 4 }}>{step.title}</Text>
              <Text style={{ fontSize: 15, color: '#4b5563', lineHeight: 22 }}>{step.desc}</Text>
            </View>
          </View>
        ))}

        {/* Note Card */}
        <View style={{ backgroundColor: '#fffbeb', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#fef3c7', marginTop: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <IconSymbol name="info.circle.fill" size={18} color="#d97706" />
            <Text style={{ marginLeft: 10, fontSize: 16, fontWeight: '800', color: '#92400e' }}>Pro Tip</Text>
          </View>
          <Text style={{ fontSize: 14, color: '#b45309', lineHeight: 21 }}>
            Always apply sprays in the early morning or late evening (before 9 AM or after 5 PM) to avoid leaf burn and ensure maximum absorption by the plant.
          </Text>
        </View>
      </ScrollView>

      {/* Button */}
      <View style={{ position: 'absolute', bottom: 0, width: '100%', padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20, backgroundColor: 'rgba(255,255,255,0.9)' }}>
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)')}
          style={{ backgroundColor: '#16a34a', paddingVertical: 18, borderRadius: 16, alignItems: 'center', shadowColor: '#16a34a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 }}>
          <Text style={{ color: 'white', fontWeight: '800', fontSize: 17 }}>Finish Treatment Guide</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
