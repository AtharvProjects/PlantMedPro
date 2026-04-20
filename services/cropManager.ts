import AsyncStorage from '@react-native-async-storage/async-storage';

const CROPS_KEY = '@plantmedpro_user_crops';

export interface UserCrop {
  name: string;
  emoji: string;
  border: string;
}

export const DEFAULT_CROPS: UserCrop[] = [
  { name: 'Wheat', emoji: '🌾', border: '#f59e0b' },
  { name: 'Rice', emoji: '🍚', border: '#84cc16' },
  { name: 'Tomato', emoji: '🍅', border: '#ef4444' },
  { name: 'Onion', emoji: '🧅', border: '#a855f7' },
  { name: 'Banana', emoji: '🍌', border: '#eab308' },
];

export const ALL_AVAILABLE_CROPS: UserCrop[] = [
  { name: 'Wheat', emoji: '🌾', border: '#f59e0b' },
  { name: 'Rice', emoji: '🍚', border: '#84cc16' },
  { name: 'Tomato', emoji: '🍅', border: '#ef4444' },
  { name: 'Onion', emoji: '🧅', border: '#a855f7' },
  { name: 'Banana', emoji: '🍌', border: '#eab308' },
  { name: 'Cotton', emoji: '☁️', border: '#6b7280' },
  { name: 'Sugarcane', emoji: '🎋', border: '#16a34a' },
  { name: 'Potato', emoji: '🥔', border: '#92400e' },
  { name: 'Soybean', emoji: '🫘', border: '#65a30d' },
  { name: 'Maize', emoji: '🌽', border: '#d97706' },
  { name: 'Mango', emoji: '🥭', border: '#dc2626' },
  { name: 'Grapes', emoji: '🍇', border: '#7c3aed' },
  { name: 'Apple', emoji: '🍎', border: '#b91c1c' },
  { name: 'Chilli', emoji: '🌶️', border: '#9a1515' },
  { name: 'Brinjal', emoji: '🍆', border: '#6d28d9' },
  { name: 'Groundnut', emoji: '🥜', border: '#b45309' },
  { name: 'Turmeric', emoji: '🟡', border: '#ca8a04' },
  { name: 'Ginger', emoji: '🫚', border: '#a16207' },
  { name: 'Garlic', emoji: '🧄', border: '#4b5563' },
  { name: 'Cabbage', emoji: '🥬', border: '#15803d' },
];

export async function getCrops(): Promise<UserCrop[]> {
  try {
    const data = await AsyncStorage.getItem(CROPS_KEY);
    if (data) return JSON.parse(data);
    return DEFAULT_CROPS;
  } catch {
    return DEFAULT_CROPS;
  }
}

export async function addCrop(crop: UserCrop): Promise<UserCrop[]> {
  const current = await getCrops();
  if (current.find((c) => c.name === crop.name)) return current; // No duplicates
  const updated = [...current, crop];
  await AsyncStorage.setItem(CROPS_KEY, JSON.stringify(updated));
  return updated;
}

export async function removeCrop(name: string): Promise<UserCrop[]> {
  const current = await getCrops();
  const updated = current.filter((c) => c.name !== name);
  await AsyncStorage.setItem(CROPS_KEY, JSON.stringify(updated));
  return updated;
}

export async function resetCrops(): Promise<UserCrop[]> {
  await AsyncStorage.setItem(CROPS_KEY, JSON.stringify(DEFAULT_CROPS));
  return DEFAULT_CROPS;
}
