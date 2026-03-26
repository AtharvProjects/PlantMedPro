import { useState, useRef } from 'react';
import { View, Text, ScrollView, Dimensions, TouchableOpacity, Platform, Animated } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';

const { width } = Dimensions.get('window');

const GUIDE_PAGES = [
  {
    id: '1',
    emoji: '🐛',
    title: 'The Problem',
    subtitle: 'Crops under threat',
    desc: 'Pests, UV radiation, and chemical overuse cause up to 40% crop loss worldwide annually. Conventional pesticides degrade soil, harm ecosystems, and leave residues that are unsafe for consumers.',
    color: '#fef2f2',
    accentColor: '#ef4444',
    hint: 'Did you know? India loses ₹50,000 crore yearly to crop pests.',
  },
  {
    id: '2',
    emoji: '🛡️',
    title: 'Eco-Shield Silk',
    subtitle: 'Nature\'s invisible armor',
    desc: 'Eco-Shield is an organic, biodegradable 20–40 μm silk protein coating that forms an invisible barrier over crop surfaces, blocking pest entry and UV damage without harmful chemicals.',
    color: '#eff6ff',
    accentColor: '#3b82f6',
    hint: 'Made from 100% natural silk proteins — safe for humans and beneficial insects.',
  },
  {
    id: '3',
    emoji: '💧',
    title: 'Application',
    subtitle: 'Simple 3-step process',
    desc: '1. Mix 500 ml of Eco-Shield concentrate per acre with water.\n2. Load into standard agricultural knapsack or tractor sprayer.\n3. Apply in early morning or evening for best adherence. Cures in natural sunlight within 2–3 hours.',
    color: '#f0fdf4',
    accentColor: '#16a34a',
    hint: 'Compatible with all standard agricultural sprayers. No special equipment needed.',
  },
  {
    id: '4',
    emoji: '⚠️',
    title: 'Safety Guide',
    subtitle: 'Handle with care',
    desc: 'Always wear gloves and eye protection while mixing. Keep away from open water bodies. Store in a cool, dry place below 30°C. Do not mix with acidic compounds. Food-safe after drying.',
    color: '#fffbeb',
    accentColor: '#d97706',
    hint: '🟢 Safe · Not toxic · Biodegradable within 30 days',
  },
  {
    id: '5',
    emoji: '🌟',
    title: 'Results',
    subtitle: 'Proven outcomes',
    desc: 'Field trials across 500+ farms show:\n• 65% reduction in pest damage\n• 30% longer shelf life post-harvest\n• 100% natural soil degradation\n• Zero chemical residue in produce',
    color: '#fdf4ff',
    accentColor: '#9333ea',
    hint: 'Eco-Shield is approved by ICAR and registered under organic farming norms.',
  },
];

const SAFETY_INDICATORS = [
  { label: 'Toxicity', level: 0, color: '#16a34a', text: 'Non-toxic' },
  { label: 'Biodegradable', level: 100, color: '#16a34a', text: '30 days' },
  { label: 'Chemical Residue', level: 0, color: '#16a34a', text: 'Zero' },
  { label: 'Bee Safety', level: 90, color: '#d97706', text: 'Safe 🐝' },
];

export default function GuideScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = (event: any) => {
    const x = event.nativeEvent.contentOffset.x;
    const index = Math.round(x / (width - 40));
    setActiveIndex(index);
  };

  const goToSlide = (i: number) => {
    scrollViewRef.current?.scrollTo({ x: i * (width - 40), animated: true });
    setActiveIndex(i);
  };

  const page = GUIDE_PAGES[activeIndex];

  return (
    <View style={{ flex: 1, backgroundColor: page?.color ?? '#f0fdf4' }}>
      {/* Header */}
      <View style={{ paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingHorizontal: 20, paddingBottom: 16 }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#6b7280', letterSpacing: 0.5, textTransform: 'uppercase' }}>Interactive Guide</Text>
        <Text style={{ fontSize: 30, fontWeight: '900', color: '#14532d', letterSpacing: -0.8, marginTop: 4 }}>Eco-Shield Tech</Text>
      </View>

      {/* Slide dots */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 20, marginBottom: 16, gap: 6 }}>
        {GUIDE_PAGES.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => goToSlide(i)}>
            <View style={{
              height: 6, borderRadius: 3,
              width: i === activeIndex ? 28 : 8,
              backgroundColor: i === activeIndex ? (page?.accentColor ?? '#16a34a') : '#d1d5db',
            }} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Horizontal Pager */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled={false}
        snapToInterval={width - 40}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
        style={{ flexGrow: 0 }}>
        {GUIDE_PAGES.map((p) => (
          <View key={p.id} style={{
            width: width - 40,
            backgroundColor: 'white',
            borderRadius: 28,
            padding: 28,
            borderWidth: 2,
            borderColor: `${p.accentColor}20`,
            shadowColor: p.accentColor,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 5,
          }}>
            <Text style={{ fontSize: 64, textAlign: 'center', marginBottom: 16 }}>{p.emoji}</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: p.accentColor, textAlign: 'center', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>{p.subtitle}</Text>
            <Text style={{ fontSize: 26, fontWeight: '900', color: '#111827', textAlign: 'center', marginBottom: 16, letterSpacing: -0.5 }}>{p.title}</Text>
            <Text style={{ fontSize: 15, color: '#4b5563', lineHeight: 24, textAlign: 'left' }}>{p.desc}</Text>

            {/* Hint */}
            <View style={{ backgroundColor: `${p.accentColor}15`, borderRadius: 14, padding: 14, marginTop: 20, borderLeftWidth: 3, borderLeftColor: p.accentColor }}>
              <Text style={{ fontSize: 13, color: p.accentColor, fontWeight: '600', lineHeight: 19 }}>{p.hint}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Navigation Arrows */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 16 }}>
        <TouchableOpacity
          onPress={() => activeIndex > 0 && goToSlide(activeIndex - 1)}
          style={{ opacity: activeIndex === 0 ? 0.3 : 1, backgroundColor: 'white', borderRadius: 20, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 }}>
          <IconSymbol name="arrow.left" size={22} color={page?.accentColor ?? '#16a34a'} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => activeIndex < GUIDE_PAGES.length - 1 && goToSlide(activeIndex + 1)}
          style={{ opacity: activeIndex === GUIDE_PAGES.length - 1 ? 0.3 : 1, backgroundColor: page?.accentColor ?? '#16a34a', borderRadius: 20, padding: 14, shadowColor: page?.accentColor, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 5 }}>
          <IconSymbol name="arrow.right" size={22} color="white" />
        </TouchableOpacity>
      </View>

      {/* Safety Indicators Section */}
      <ScrollView style={{ flex: 1, marginTop: 20 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 130 }}>
        <Text style={{ fontSize: 18, fontWeight: '800', color: '#14532d', marginBottom: 14 }}>Safety Indicators 🛡️</Text>
        <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}>
          {SAFETY_INDICATORS.map((indicator, i) => (
            <View key={i} style={{ marginBottom: i < SAFETY_INDICATORS.length - 1 ? 18 : 0 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#374151' }}>{indicator.label}</Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: indicator.color }}>{indicator.text}</Text>
              </View>
              <View style={{ height: 8, backgroundColor: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                <View style={{ height: 8, width: `${indicator.level === 0 ? 5 : indicator.level}%`, backgroundColor: indicator.level <= 20 ? '#16a34a' : indicator.color, borderRadius: 4 }} />
              </View>
            </View>
          ))}
        </View>

        {/* Step by Step Quick Guide */}
        <Text style={{ fontSize: 18, fontWeight: '800', color: '#14532d', marginTop: 20, marginBottom: 14 }}>Quick Application Steps</Text>
        {[
          { step: '01', title: 'Prepare Solution', desc: 'Add 500ml Eco-Shield per 100L water. Stir well.', emoji: '🧪' },
          { step: '02', title: 'Check Equipment', desc: 'Nozzle size 0.5–1mm. Pressure 2–3 bar.', emoji: '⚙️' },
          { step: '03', title: 'Apply Spray', desc: 'Spray both sides of leaves. Cover completely.', emoji: '💦' },
          { step: '04', title: 'Wait & Cure', desc: 'Allow 2–3 hours of sunlight for bonding.', emoji: '☀️' },
        ].map((s, i) => (
          <View key={i} style={{ flexDirection: 'row', marginBottom: 14, backgroundColor: 'white', borderRadius: 18, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#14532d', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
              <Text style={{ color: 'white', fontWeight: '900', fontSize: 13 }}>{s.step}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 3 }}>{s.emoji} {s.title}</Text>
              <Text style={{ fontSize: 13, color: '#6b7280', lineHeight: 18 }}>{s.desc}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
