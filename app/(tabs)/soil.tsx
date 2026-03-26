import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Dimensions, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart } from 'react-native-chart-kit';
import { IconSymbol } from '@/components/ui/icon-symbol';
import Svg, { Circle } from 'react-native-svg';

const { width } = Dimensions.get('window');

type SoilDataPoint = { date: string; score: number };

const MICROBIAL_LABELS = ['Bacteria', 'Fungi', 'Actino', 'Protozoa'];
const MICROBIAL_COLORS = ['#4ade80', '#60a5fa', '#f472b6', '#fb923c'];
const IDEAL = [0.25, 0.25, 0.25, 0.25];

export default function SoilScreen() {
  const [ph, setPh] = useState('');
  const [moisture, setMoisture] = useState('');
  const [npk, setNpk] = useState('');
  const [carbon, setCarbon] = useState('');
  const [history, setHistory] = useState<SoilDataPoint[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [microbial, setMicrobial] = useState([0.3, 0.2, 0.28, 0.22]);

  useEffect(() => { loadHistory(); }, []);

  const loadHistory = async () => {
    try {
      const data = await AsyncStorage.getItem('@soil_history');
      if (data) {
        setHistory(JSON.parse(data));
      } else {
        setHistory([
          { date: 'Mon', score: 62 }, { date: 'Tue', score: 68 },
          { date: 'Wed', score: 71 }, { date: 'Thu', score: 74 }, { date: 'Fri', score: 70 },
        ]);
      }
    } catch (e) { /* ignore */ }
  };

  const calculateScore = () => {
    const p = parseFloat(ph) || 6.5;
    const m = parseFloat(moisture) || 50;
    const n = parseFloat(npk) || 100;
    let s = 40;
    if (p >= 6.0 && p <= 7.5) s += 25;
    else if (p >= 5.5 && p <= 8.0) s += 12;
    if (m >= 40 && m <= 60) s += 20;
    else if (m >= 20 && m <= 80) s += 8;
    if (n > 100) s += 15;
    else if (n > 50) s += 8;
    return Math.min(100, Math.round(s));
  };

  const handleSave = async () => {
    if (!ph && !moisture && !npk) {
      Alert.alert('Missing Data', 'Please enter at least pH, moisture, or NPK values.');
      return;
    }
    const newScore = calculateScore();
    setScore(newScore);
    // Slightly randomize microbial to simulate sensor
    setMicrobial([
      0.22 + Math.random() * 0.12,
      0.18 + Math.random() * 0.10,
      0.22 + Math.random() * 0.12,
      0.18 + Math.random() * 0.10,
    ]);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const newPoint = { date: dayNames[new Date().getDay()], score: newScore };
    const newHistory = [...history, newPoint].slice(-6);
    setHistory(newHistory);
    try {
      await AsyncStorage.setItem('@soil_history', JSON.stringify(newHistory));
    } catch (e) { /* ignore */ }
    Alert.alert('✅ Saved!', `Your soil health score is ${newScore}/100`);
    setPh(''); setMoisture(''); setNpk(''); setCarbon('');
  };

  const getScoreColor = (s: number) => {
    if (s >= 75) return '#16a34a';
    if (s >= 50) return '#d97706';
    return '#dc2626';
  };

  const getScoreLabel = (s: number) => {
    if (s >= 75) return 'Healthy 🌱';
    if (s >= 50) return 'Moderate ⚠️';
    return 'Poor 🚨';
  };

  const chartData = {
    labels: history.map(h => h.date),
    datasets: [{ data: history.map(h => h.score), strokeWidth: 2 }],
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f0fdf4' }}>
      {/* Decorative BG */}
      <View style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(134,239,172,0.2)' }} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingHorizontal: 20, paddingBottom: 20 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#6b7280', letterSpacing: 0.5, textTransform: 'uppercase' }}>Track & Improve</Text>
          <Text style={{ fontSize: 30, fontWeight: '900', color: '#14532d', letterSpacing: -0.8, marginTop: 4 }}>Soil Health</Text>
        </View>

        {/* Score Card */}
        {score !== null && (
          <View style={{ marginHorizontal: 20, marginBottom: 20, backgroundColor: getScoreColor(score), borderRadius: 24, padding: 24, alignItems: 'center', shadowColor: getScoreColor(score), shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 }}>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' }}>Your Soil Score</Text>
            <Text style={{ color: 'white', fontSize: 64, fontWeight: '900', lineHeight: 70 }}>{score}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 18, fontWeight: '700' }}>{getScoreLabel(score)}</Text>
          </View>
        )}

        {/* Chart */}
        <View style={{ marginHorizontal: 20, backgroundColor: 'white', borderRadius: 24, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}>
          <Text style={{ fontSize: 17, fontWeight: '800', color: '#14532d', marginBottom: 14 }}>Health Trend 📈</Text>
          {history.length > 1 ? (
            <LineChart
              data={chartData}
              width={width - 82}
              height={180}
              yAxisSuffix="%"
              chartConfig={{
                backgroundColor: 'transparent',
                backgroundGradientFrom: '#f0fdf4',
                backgroundGradientFromOpacity: 1,
                backgroundGradientTo: '#f0fdf4',
                backgroundGradientToOpacity: 1,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(22, 163, 74, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(75, 85, 99, ${opacity})`,
                style: { borderRadius: 16 },
                propsForDots: { r: '5', strokeWidth: '2', stroke: '#16a34a' },
              }}
              bezier
              style={{ marginVertical: 4, borderRadius: 16 }}
              withInnerLines={false}
              withOuterLines={false}
            />
          ) : (
            <View style={{ height: 180, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb', borderRadius: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: '#d1d5db' }}>
              <Text style={{ color: '#9ca3af', fontWeight: '600' }}>Not enough data for trend... 📊</Text>
              <Text style={{ color: '#d1d5db', fontSize: 12, marginTop: 4 }}>Add at least 2 logs</Text>
            </View>
          )}
        </View>

        {/* Microbial Balance */}
        <View style={{ marginHorizontal: 20, backgroundColor: 'white', borderRadius: 24, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}>
          <Text style={{ fontSize: 17, fontWeight: '800', color: '#14532d', marginBottom: 4 }}>Microbial Balance 🦠</Text>
          <Text style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>Ideal ratio: 1:1:1:1</Text>
          {MICROBIAL_LABELS.map((label, i) => (
            <View key={i} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>{label}</Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: MICROBIAL_COLORS[i] }}>{(microbial[i] * 100).toFixed(0)}%</Text>
              </View>
              <View style={{ height: 8, backgroundColor: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                <View style={{ height: 8, width: `${(Math.max(0, Math.min(1, microbial[i])) || 0) * 100}%`, backgroundColor: MICROBIAL_COLORS[i], borderRadius: 4 }} />
              </View>
            </View>
          ))}
        </View>

        {/* Input Form */}
        <View style={{ marginHorizontal: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#14532d', marginBottom: 14 }}>Log Parameters 🌾</Text>
          <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 14 }}>
              {[
                { label: 'pH Level', placeholder: '6.5', value: ph, setter: setPh },
                { label: 'Moisture %', placeholder: '45', value: moisture, setter: setMoisture },
              ].map((field, i) => (
                <View key={i} style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6 }}>{field.label}</Text>
                  <TextInput
                    value={field.value}
                    onChangeText={field.setter}
                    keyboardType="decimal-pad"
                    placeholder={field.placeholder}
                    placeholderTextColor="#d1d5db"
                    style={{ backgroundColor: '#f9fafb', borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 14, padding: 12, fontSize: 16, fontWeight: '600', color: '#111827' }}
                  />
                </View>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'NPK Value', placeholder: '120', value: npk, setter: setNpk },
                { label: 'Carbon %', placeholder: '2.5', value: carbon, setter: setCarbon },
              ].map((field, i) => (
                <View key={i} style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6 }}>{field.label}</Text>
                  <TextInput
                    value={field.value}
                    onChangeText={field.setter}
                    keyboardType="decimal-pad"
                    placeholder={field.placeholder}
                    placeholderTextColor="#d1d5db"
                    style={{ backgroundColor: '#f9fafb', borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 14, padding: 12, fontSize: 16, fontWeight: '600', color: '#111827' }}
                  />
                </View>
              ))}
            </View>

            <TouchableOpacity
              onPress={handleSave}
              style={{ backgroundColor: '#16a34a', paddingVertical: 16, borderRadius: 18, alignItems: 'center', shadowColor: '#16a34a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 }}>
              <Text style={{ color: 'white', fontWeight: '800', fontSize: 16 }}>Calculate & Log Soil Data 🧪</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Improvement Tips */}
        <View style={{ marginHorizontal: 20, marginTop: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#14532d', marginBottom: 14 }}>Improvement Tips 💡</Text>
          {[
            { icon: '🌿', title: 'Add Organic Matter', desc: 'Use vermicompost or green manure to improve microbial activity.', color: '#f0fdf4' },
            { icon: '💧', title: 'Regulate Moisture', desc: 'Aim for 40–60% field capacity. Use drip irrigation for precision.', color: '#eff6ff' },
            { icon: '⚗️', title: 'Correct pH', desc: 'Add lime to raise pH or sulfur to lower it. Target 6.0–7.5.', color: '#fff7ed' },
          ].map((tip, i) => (
            <View key={i} style={{ backgroundColor: tip.color, borderRadius: 18, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' }}>
              <Text style={{ fontSize: 28, marginRight: 14 }}>{tip.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#1f2937', marginBottom: 3 }}>{tip.title}</Text>
                <Text style={{ fontSize: 13, color: '#6b7280', lineHeight: 18 }}>{tip.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
