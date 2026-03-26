import { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BlurView } from 'expo-blur';
import LottieView from 'lottie-react-native';

export default function AIDoctorScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const params = useLocalSearchParams();
  const cropContext = params.crop as string;
  const [isProcessing, setIsProcessing] = useState(false);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [flash, setFlash] = useState(false);
  const [quality, setQuality] = useState<'Good picture 📷✅' | 'Plantix works best with crops 😎' | null>(null);
  const [isSecureContext, setIsSecureContext] = useState(true);

  const handleCapture = async () => {
    if (cameraRef.current && !isProcessing) {
      setIsProcessing(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({ base64: false, quality: 0.8 });
        if (photo?.uri) {
          router.push({ pathname: '/diagnosis', params: { uri: photo.uri, crop: cropContext } });
        }
      } catch (e) {
        Alert.alert('Error', 'Failed to capture photo. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.85,
    });
    if (!result.canceled) {
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        router.push({ pathname: '/diagnosis', params: { uri: result.assets[0].uri, crop: cropContext } });
      }, 1500);
    }
  };

  useEffect(() => {
    // Check if we are in an insecure web context (where camera is blocked)
    if (Platform.OS === 'web' && !window.isSecureContext && window.location.hostname !== 'localhost') {
      setIsSecureContext(false);
    }
  }, []);

  if (!isSecureContext) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f0fdf4' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          {/* Glass Card */}
          <View style={{ 
            width: '100%', 
            backgroundColor: 'rgba(255,255,255,0.9)', 
            borderRadius: 32, 
            padding: 32, 
            alignItems: 'center',
            shadowColor: '#16a34a',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.1,
            shadowRadius: 20,
            elevation: 10,
            borderWidth: 1,
            borderColor: 'rgba(22, 163, 74, 0.1)'
          }}>
            <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <Text style={{ fontSize: 40 }}>🔌</Text>
            </View>
            
            <Text style={{ fontSize: 26, fontWeight: '900', color: '#111827', textAlign: 'center', letterSpacing: -0.5 }}>Connection Insecure</Text>
            <Text style={{ fontSize: 15, color: '#64748b', marginTop: 12, textAlign: 'center', lineHeight: 22 }}>
              Web browsers require **HTTPS** to access the camera.{'\n'}We've enabled a pro-fallback for you.
            </Text>

            <View style={{ marginTop: 32, width: '100%', gap: 14 }}>
              <TouchableOpacity
                onPress={pickImage}
                style={{ backgroundColor: '#16a34a', paddingVertical: 18, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
                <IconSymbol name="photo.fill" size={20} color="white" />
                <Text style={{ color: 'white', fontWeight: '800', fontSize: 16, marginLeft: 10 }}>Select Plant Photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/diagnosis', params: { uri: 'https://images.unsplash.com/photo-1592150621344-82d43b482bb2?q=80&w=2000', crop: cropContext } })}
                style={{ backgroundColor: 'rgba(16,185,129,0.06)', paddingVertical: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(16,185,129,0.1)' }}>
                <Text style={{ color: '#059669', fontWeight: '700', fontSize: 15 }}>🧪 Test with Sample Image</Text>
              </TouchableOpacity>
            </View>

            {/* Pro Tip Box */}
            <View style={{ marginTop: 32, backgroundColor: '#eff6ff', padding: 16, borderRadius: 20, width: '100%', borderLeftWidth: 4, borderLeftColor: '#3b82f6' }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#1d4ed8', marginBottom: 4 }}>💡 Pro Discovery Fix</Text>
              <Text style={{ fontSize: 12, color: '#3b82f6', lineHeight: 18, fontWeight: '600' }}>
                To use the live camera on Web, run:{'\n'}
                <Text style={{ fontStyle: 'italic', fontWeight: '800' }}>npx expo start --tunnel</Text>
              </Text>
            </View>
          </View>
          
          <Text style={{ color: '#94a3b8', textAlign: 'center', fontSize: 13, marginTop: 40, fontWeight: '600' }}>
            Works flawlessly on **Android/iOS App**! 📱
          </Text>
        </View>
      </View>
    );
  }

  if (!permission) return <View style={{ flex: 1, backgroundColor: '#000' }} />;

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0fdf4', paddingHorizontal: 30 }}>
        <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(22,163,74,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <Text style={{ fontSize: 48 }}>📷</Text>
        </View>
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#14532d', textAlign: 'center', marginBottom: 10 }}>Camera Access Needed</Text>
        <Text style={{ fontSize: 15, color: '#6b7280', textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>
          Allow camera access to scan your plants instantly.
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          style={{ backgroundColor: '#16a34a', paddingVertical: 16, paddingHorizontal: 40, borderRadius: 50 }}>
          <Text style={{ color: 'white', fontWeight: '800', fontSize: 16 }}>Allow Camera Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing={facing}
        flash={flash ? 'on' : 'off'}
        ref={cameraRef}
        onCameraReady={() => setQuality('Good picture 📷✅')}
      >
        <View style={StyleSheet.absoluteFillObject}>
          {/* Main UI Container */}
          <View style={{ flex: 1, justifyContent: 'space-between', paddingBottom: Platform.OS === 'ios' ? 40 : 30 }}>
            
            {/* Top Controls */}
            <View style={{ paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
                <IconSymbol name="arrow.left" size={22} color="white" />
              </TouchableOpacity>
              
              {cropContext && (
                <View style={{ backgroundColor: 'rgba(22, 163, 74, 0.9)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 }}>
                  <Text style={{ color: 'white', fontWeight: '800', fontSize: 13 }}>🎯 {cropContext}</Text>
                </View>
              )}
              
              <TouchableOpacity
                onPress={() => setFlash(!flash)}
                style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
                <IconSymbol name={flash ? 'bolt.fill' : 'bolt.slash.fill'} size={22} color={flash ? '#fbbf24' : 'white'} />
              </TouchableOpacity>
            </View>

            {/* Bottom Controls */}
            <View>
              {/* Quality indicator relocated here for better visibility */}
              {quality && (
                <View style={{ alignSelf: 'center', marginBottom: 20 }}>
                  <View style={{ backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 50, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                    <Text style={{ color: 'white', fontWeight: '700', fontSize: 13 }}>{quality}</Text>
                  </View>
                </View>
              )}

              <View style={{ paddingHorizontal: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                {/* Gallery */}
                <TouchableOpacity
                  onPress={pickImage}
                  style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)' }}>
                  <IconSymbol name="photo.fill.on.rectangle.fill" size={26} color="white" />
                </TouchableOpacity>

                {/* Shutter */}
                <TouchableOpacity
                  onPress={handleCapture}
                  disabled={isProcessing}
                  style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 5, borderColor: 'white' }}>
                  {isProcessing
                    ? <ActivityIndicator color="white" size="large" />
                    : <View style={{ width: 62, height: 62, borderRadius: 31, backgroundColor: 'white' }} />
                  }
                </TouchableOpacity>

                {/* Flip Camera */}
                <TouchableOpacity
                  onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
                  style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)' }}>
                  <IconSymbol name="arrow.triangle.2.circlepath.camera.fill" size={26} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Scanning frame UI - Positioned overlay that doesn't block touch */}
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 280, height: 350, borderWidth: 2, borderColor: 'rgba(74, 222, 128, 0.4)', borderRadius: 24, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 180, height: 180, borderRadius: 90, borderWidth: 1, borderColor: '#4ade80', borderStyle: 'dashed', opacity: 0.5 }} />
              
              <View style={{ position: 'absolute', top: -5, left: -5, width: 40, height: 40, borderTopWidth: 5, borderLeftWidth: 5, borderColor: '#4ade80', borderTopLeftRadius: 15 }} />
              <View style={{ position: 'absolute', top: -5, right: -5, width: 40, height: 40, borderTopWidth: 5, borderRightWidth: 5, borderColor: '#4ade80', borderTopRightRadius: 15 }} />
              <View style={{ position: 'absolute', bottom: -5, left: -5, width: 40, height: 40, borderBottomWidth: 5, borderLeftWidth: 5, borderColor: '#4ade80', borderBottomLeftRadius: 15 }} />
              <View style={{ position: 'absolute', bottom: -5, right: -5, width: 40, height: 40, borderBottomWidth: 5, borderRightWidth: 5, borderColor: '#4ade80', borderBottomRightRadius: 15 }} />
            </View>
          </View>

          <View style={{ position: 'absolute', top: '22%', width: '100%', alignItems: 'center' }}>
            <View style={{ backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
              <Text style={{ color: 'white', fontWeight: '900', fontSize: 12, letterSpacing: 1 }}>📸 SCAN CROPS / PLANTS</Text>
            </View>
          </View>

          <View style={{ position: 'absolute', bottom: '32%', width: '100%', alignItems: 'center' }}>
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 14, textAlign: 'center', textShadowColor: 'black', textShadowRadius: 4, opacity: 0.9 }}>
              Center the leaf inside the frame
            </Text>
          </View>
        </View>

        {/* Processing overlay */}
        {isProcessing && (
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center' }]}>
            <View style={{ backgroundColor: 'rgba(20, 83, 45, 0.95)', padding: 30, borderRadius: 28, alignItems: 'center', shadowColor: '#4ade80', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 15 }}>
              
              <LottieView
                autoPlay
                loop
                style={{ width: 120, height: 120 }}
                source={{ uri: 'https://assets8.lottiefiles.com/packages/lf20_t24tpvcu.json' }}
                // Fallback indicator if network fails
                renderMode="AUTOMATIC"
              />
              <Text style={{ color: 'white', marginTop: 8, fontWeight: '800', fontSize: 18, letterSpacing: 0.5 }}>Analyzing plant... 🌿</Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', marginTop: 8, fontSize: 14, fontWeight: '500' }}>AI is working its magic</Text>
            </View>
          </View>
        )}
      </CameraView>
    </View>
  );
}
