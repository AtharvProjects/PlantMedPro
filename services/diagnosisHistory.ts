import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DiagnosisResult } from './plantAI';

const LOCAL_KEY = '@plantmedpro_diagnosis_history';

export interface StoredDiagnosis {
  id: string;
  created_at: string;
  crop: string;
  disease: string;
  confidence: number;
  severity: string;
  type: string;
  source: string;
  image_uri?: string;
}

/**
 * Save a diagnosis to both Supabase (cloud) and AsyncStorage (offline fallback).
 * Offline-first: always saves locally, syncs to cloud when available.
 */
export async function saveDiagnosis(
  result: DiagnosisResult,
  imageUri?: string
): Promise<void> {
  if (!result.success || result.isNotPlant) return;

  const entry: StoredDiagnosis = {
    id: Date.now().toString(),
    created_at: new Date().toISOString(),
    crop: result.crop,
    disease: result.disease,
    confidence: result.confidence,
    severity: result.severity,
    type: result.type,
    source: result.source,
    image_uri: imageUri,
  };

  // Save locally first (always works, even offline)
  try {
    const existing = await AsyncStorage.getItem(LOCAL_KEY);
    const list: StoredDiagnosis[] = existing ? JSON.parse(existing) : [];
    const updated = [entry, ...list].slice(0, 100); // Keep last 100
    await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Local history save failed:', e);
  }

  // Sync to Supabase (best-effort, fails silently)
  try {
    await supabase.from('diagnoses').insert({
      crop: entry.crop,
      disease: entry.disease,
      confidence: entry.confidence,
      severity: entry.severity,
      type: entry.type,
      source: entry.source,
      image_uri: entry.image_uri,
    });
  } catch (e) {
    console.warn('Supabase sync failed (offline?) — data saved locally:', e);
  }
}

/**
 * Fetch recent diagnoses. Tries Supabase first, falls back to local storage.
 */
export async function getRecentDiagnoses(limit: number = 10): Promise<StoredDiagnosis[]> {
  // Try Supabase cloud
  try {
    const { data, error } = await supabase
      .from('diagnoses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!error && data && data.length > 0) {
      return data as StoredDiagnosis[];
    }
  } catch (e) {
    console.warn('Supabase fetch failed — using local history');
  }

  // Fall back to local AsyncStorage
  try {
    const data = await AsyncStorage.getItem(LOCAL_KEY);
    const list: StoredDiagnosis[] = data ? JSON.parse(data) : [];
    return list.slice(0, limit);
  } catch {
    return [];
  }
}

/**
 * Format ISO timestamp to relative display string.
 */
export function formatDiagnosisDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  } catch {
    return 'Recently';
  }
}

/**
 * Clear all history (local + cloud).
 */
export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(LOCAL_KEY);
  try {
    // Delete all rows — use a always-false condition as a workaround
    // since Supabase requires a filter for delete
    await supabase.from('diagnoses').delete().gt('confidence', -1);
  } catch (e) {
    console.warn('Supabase history clear failed');
  }
}
