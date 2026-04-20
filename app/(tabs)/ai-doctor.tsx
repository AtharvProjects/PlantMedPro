import { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
  Platform, Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { setCachedBase64 } from '@/services/plantAI';

export default function AIDoctorScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const params = useLocalSearchParams();
  const cropContext = params.crop as string;
  const [isCapturing, setIsCapturing] = useState(false);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [flash, setFlash] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing || !cameraReady) return;
    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: false, // Don't extract 12MP raw base64 to avoid OOM
        quality: 1,
        skipProcessing: false,
      });
      
      if (photo?.uri) {
        // Downscale image to vastly reduce API payload size (from 10MB+ to ~150KB)
        const manipResult = await ImageManipulator.manipulateAsync(
          photo.uri,
          [{ resize: { width: 800 } }],
          { compress: 0.8, base64: true }
        );

        if (manipResult.base64) {
          setCachedBase64(manipResult.base64);
        }
        
        // Navigate immediately — analysis happens on the diagnosis screen
        router.push({
          pathname: '/diagnosis',
          params: {
            uri: manipResult.uri,
            crop: cropContext,
            temp: params.temp,
            humidity: params.humidity,
            condition: params.condition
          }
        });
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.9,
        base64: true, // Native direct base64 extraction
      });
      if (!result.canceled && result.assets[0]?.uri) {
        if (result.assets[0].base64) {
          setCachedBase64(result.assets[0].base64);
        }
        
        // No setTimeout — navigate immediately, analysis happens on diagnosis screen
        router.push({
          pathname: '/diagnosis',
          params: {
            uri: result.assets[0].uri,
            crop: cropContext,
            temp: params.temp,
            humidity: params.humidity,
            condition: params.condition
          },
        });
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open image gallery. Please check permissions.');
    }
  };

  if (!permission) return <View style={{ flex: 1, backgroundColor: '#000' }} />;

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0fdf4', paddingHorizontal: 30 }}>
        <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(22,163,74,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <Text style={{ fontSize: 48 }}>📷</Text>
        </View>
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#14532d', textAlign: 'center', marginBottom: 10 }}>
          Camera Access Needed
        </Text>
        <Text style={{ fontSize: 15, color: '#6b7280', textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>
          Allow camera access to scan your plants and detect diseases instantly.
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          style={{ backgroundColor: '#16a34a', paddingVertical: 16, paddingHorizontal: 40, borderRadius: 50 }}>
          <Text style={{ color: 'white', fontWeight: '800', fontSize: 16 }}>Allow Camera Access</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={pickImage} style={{ marginTop: 16 }}>
          <Text style={{ color: '#16a34a', fontWeight: '700', fontSize: 15 }}>Or pick from gallery →</Text>
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
        onCameraReady={() => setCameraReady(true)}
      >
        <View style={StyleSheet.absoluteFillObject}>
          <View style={{ flex: 1, justifyContent: 'space-between', paddingBottom: Platform.OS === 'ios' ? 40 : 30 }}>

            {/* Top Controls */}
            <View style={{ paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
                <IconSymbol name="arrow.left" size={22} color="white" />
              </TouchableOpacity>

              {cropContext && (
                <View style={{ backgroundColor: 'rgba(22, 163, 74, 0.9)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center' }}>
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
              {cameraReady && (
                <View style={{ alignSelf: 'center', marginBottom: 20 }}>
                  <View style={{ backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 50, borderWidth: 1, borderColor: 'rgba(74,222,128,0.3)' }}>
                    <Text style={{ color: '#4ade80', fontWeight: '700', fontSize: 12 }}>📷 Camera Ready</Text>
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
                  disabled={isCapturing || !cameraReady}
                  style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 5, borderColor: 'white', opacity: isCapturing ? 0.7 : 1 }}>
                  {isCapturing
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

        {/* Scanning frame overlay — non-interactive */}
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
              <Text style={{ color: 'white', fontWeight: '900', fontSize: 12, letterSpacing: 1 }}>📸 ALIGN LEAF IN FRAME</Text>
            </View>
          </View>

          <View style={{ position: 'absolute', bottom: '32%', width: '100%', alignItems: 'center' }}>
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 14, textAlign: 'center', textShadowColor: 'black', textShadowRadius: 4, opacity: 0.9 }}>
              Center the leaf inside the frame
            </Text>
          </View>
        </View>

        {/* Capturing overlay */}
        {isCapturing && (
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center' }]}>
            <View style={{ backgroundColor: 'rgba(20, 83, 45, 0.95)', padding: 30, borderRadius: 28, alignItems: 'center', shadowColor: '#4ade80', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 15 }}>
              <ActivityIndicator size="large" color="#4ade80" />
              <Text style={{ color: 'white', marginTop: 16, fontWeight: '800', fontSize: 18 }}>Capturing... 📸</Text>
            </View>
          </View>
        )}
      </CameraView>
    </View>
  );
}
