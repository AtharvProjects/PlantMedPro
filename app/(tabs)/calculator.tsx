import { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, Share } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';

type Product = 'Pentaboost' | 'Biofertilizer' | 'EcoShield Silk';

const PRODUCTS: Record<Product, {
  emoji: string;
  description: string;
  color: string;
  bgColor: string;
  perAcreValue: number;
  unit: string;
  applicationMethod: string;
}> = {
  Pentaboost: {
    emoji: '⚡',
    description: 'Micronutrient booster with 5 essential elements',
    color: '#b45309',
    bgColor: '#fef3c7',
    perAcreValue: 250,
    unit: 'ml',
    applicationMethod: 'Foliar spray. Mix in water and apply during early morning or evening.',
  },
  Biofertilizer: {
    emoji: '🌿',
    description: 'Organic microbial inoculant for root health',
    color: '#15803d',
    bgColor: '#f0fdf4',
    perAcreValue: 4000,
    unit: 'gm',
    applicationMethod: 'Soil drench. Mix with compost and apply near root zone.',
  },
  'EcoShield Silk': {
    emoji: '🛡️',
    description: 'Protective silk coating (20–40 μm) for crops',
    color: '#1d4ed8',
    bgColor: '#eff6ff',
    perAcreValue: 500,
    unit: 'ml',
    applicationMethod: 'Foliar spray. Ensure full coverage of leaf surfaces. Apply in the morning.',
  },
};

const CROPS = ['Wheat', 'Rice', 'Cotton', 'Soybean', 'Maize', 'Sugarcane', 'Tomato', 'Potato'];
const STAGES = ['Germination', 'Seedling', 'Vegetative', 'Flowering', 'Fruiting', 'Harvest'];
const STAGE_MULTIPLIERS: Record<string, number> = {
  Germination: 0.5, Seedling: 0.75, Vegetative: 1.0,
  Flowering: 1.25, Fruiting: 1.0, Harvest: 0.75,
};

export default function CalculatorScreen() {
  const [area, setArea] = useState('1');
  const [water, setWater] = useState('150');
  const [product, setProduct] = useState<Product>('Pentaboost');
  const [crop, setCrop] = useState('Wheat');
  const [stage, setStage] = useState('Vegetative');
  const [showResult, setShowResult] = useState(false);

  const selectedProduct = PRODUCTS[product];
  const totalArea = parseFloat(area) || 0;
  const totalWater = parseFloat(water) || 0;
  const multiplier = STAGE_MULTIPLIERS[stage] ?? 1;
  const totalProduct = totalArea * selectedProduct.perAcreValue * multiplier;
  const totalWaterNeeded = totalArea * totalWater;
  const dilution = totalWaterNeeded > 0 ? (totalProduct / totalWaterNeeded).toFixed(2) : '0';

  const formatProduct = () => {
    if (selectedProduct.unit === 'gm' && totalProduct >= 1000) {
      return `${(totalProduct / 1000).toFixed(2)} kg`;
    }
    return `${totalProduct.toFixed(0)} ${selectedProduct.unit}`;
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#f0fdf4' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Decorative */}
      <View style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(251,191,36,0.15)' }} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingHorizontal: 20, paddingBottom: 20 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#6b7280', letterSpacing: 0.5, textTransform: 'uppercase' }}>Precision Farming</Text>
          <Text style={{ fontSize: 30, fontWeight: '900', color: '#14532d', letterSpacing: -0.8, marginTop: 4 }}>Dosage Calculator</Text>
        </View>

        {/* Product Selection */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#1f2937', marginBottom: 12 }}>Select Product</Text>
          <View style={{ gap: 10 }}>
            {(Object.keys(PRODUCTS) as Product[]).map((p) => {
              const prod = PRODUCTS[p];
              const isSelected = product === p;
              return (
                <TouchableOpacity
                  key={p}
                  onPress={() => { setProduct(p); setShowResult(false); }}
                  style={{
                    backgroundColor: isSelected ? prod.bgColor : 'white',
                    borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center',
                    borderWidth: 2, borderColor: isSelected ? prod.color : '#e5e7eb',
                    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
                  }}>
                  <Text style={{ fontSize: 28, marginRight: 14 }}>{prod.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: prod.color }}>{p}</Text>
                    <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{prod.description}</Text>
                  </View>
                  {isSelected && (
                    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: prod.color, alignItems: 'center', justifyContent: 'center' }}>
                      <IconSymbol name="checkmark" size={12} color="white" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Crop & Stage */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#1f2937', marginBottom: 12 }}>Crop Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 20 }}>
            {CROPS.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => { setCrop(c); setShowResult(false); }}
                style={{
                  paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
                  backgroundColor: crop === c ? '#16a34a' : 'white',
                  borderWidth: 1.5, borderColor: crop === c ? '#16a34a' : '#e5e7eb',
                }}>
                <Text style={{ fontWeight: '700', fontSize: 14, color: crop === c ? 'white' : '#374151' }}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#1f2937', marginBottom: 12 }}>Growth Stage</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 20 }}>
            {STAGES.map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => { setStage(s); setShowResult(false); }}
                style={{
                  paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
                  backgroundColor: stage === s ? '#d97706' : 'white',
                  borderWidth: 1.5, borderColor: stage === s ? '#d97706' : '#e5e7eb',
                }}>
                <Text style={{ fontWeight: '700', fontSize: 14, color: stage === s ? 'white' : '#374151' }}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Area & Water Inputs */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}>
            <View style={{ flexDirection: 'row', gap: 14, marginBottom: 0 }}>
              {[
                { label: 'Land Area (Acres)', placeholder: '1', value: area, setter: setArea, icon: 'map.fill' as any, color: '#16a34a' },
                { label: 'Water / Acre (L)', placeholder: '150', value: water, setter: setWater, icon: 'drop.fill' as any, color: '#3b82f6' },
              ].map((field, i) => (
                <View key={i} style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 8 }}>{field.label}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 14, paddingHorizontal: 12 }}>
                    <IconSymbol name={field.icon} size={16} color={field.color} />
                    <TextInput
                      value={field.value}
                      onChangeText={(v) => { field.setter(v); setShowResult(false); }}
                      keyboardType="decimal-pad"
                      placeholder={field.placeholder}
                      placeholderTextColor="#d1d5db"
                      style={{ flex: 1, padding: 12, fontSize: 18, fontWeight: '700', color: '#111827' }}
                    />
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => setShowResult(true)}
              style={{ marginTop: 16, backgroundColor: '#16a34a', paddingVertical: 15, borderRadius: 16, alignItems: 'center', shadowColor: '#16a34a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 }}>
              <Text style={{ color: 'white', fontWeight: '800', fontSize: 16 }}>Calculate Dosage ⚗️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Results */}
        {showResult && totalArea > 0 && (
          <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#1f2937', marginBottom: 12 }}>Application Formula 📋</Text>
            <View style={{ backgroundColor: '#14532d', borderRadius: 24, padding: 24, shadowColor: '#14532d', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 }}>
              {/* Main dosage */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <View>
                  <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: '600' }}>Total {product} Required</Text>
                  <Text style={{ color: '#4ade80', fontSize: 38, fontWeight: '900', marginTop: 4 }}>{formatProduct()}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 }}>for {totalArea} acre(s) · {stage}</Text>
                </View>
                <Text style={{ fontSize: 40 }}>{selectedProduct.emoji}</Text>
              </View>

              <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 16 }} />

              <View style={{ flexDirection: 'row', gap: 16 }}>
                {[
                  { label: 'Total Water', value: `${totalWaterNeeded} L` },
                  { label: 'Dilution', value: `${dilution} ${selectedProduct.unit}/L` },
                  { label: 'Crop', value: crop },
                ].map((item, i) => (
                  <View key={i} style={{ flex: 1 }}>
                    <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600' }}>{item.label}</Text>
                    <Text style={{ color: 'white', fontSize: 14, fontWeight: '800', marginTop: 3 }}>{item.value}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Application Method */}
            <View style={{ backgroundColor: selectedProduct.bgColor, borderRadius: 20, padding: 18, marginTop: 12, borderWidth: 1.5, borderColor: `${selectedProduct.color}30` }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: selectedProduct.color, marginBottom: 6 }}>📌 Application Method</Text>
              <Text style={{ fontSize: 14, color: '#374151', lineHeight: 21 }}>{selectedProduct.applicationMethod}</Text>
            </View>

            <TouchableOpacity
              onPress={async () => {
                try {
                  await Share.share({
                    message: `🌿 PlantMedPro — Dosage Instructions\n\nProduct: ${product} ${selectedProduct.emoji}\nCrop: ${crop} | Stage: ${stage}\nArea: ${totalArea} acre(s)\n\n📊 Formula:\n• Total ${product}: ${formatProduct()}\n• Total Water: ${totalWaterNeeded} L\n• Dilution Rate: ${dilution} ${selectedProduct.unit}/L\n\n📌 Application:\n${selectedProduct.applicationMethod}\n\nGenerated by PlantMedPro 🌾`,
                  });
                } catch (e) {
                  Alert.alert('Share', 'Could not share dosage instructions.');
                }
              }}
              style={{ backgroundColor: '#d97706', paddingVertical: 15, borderRadius: 16, alignItems: 'center', marginTop: 12, flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
              <IconSymbol name="square.and.arrow.up" size={18} color="white" />
              <Text style={{ color: 'white', fontWeight: '800', fontSize: 15 }}>Share Dosage Instructions</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
