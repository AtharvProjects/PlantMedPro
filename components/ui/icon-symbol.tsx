// Fallback for using MaterialIcons on Android and web.
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  // Common UI
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'chevron.left': 'chevron-left',
  'arrow.left': 'arrow-back',
  'arrow.right': 'arrow-forward',
  'xmark': 'close',
  'square.and.arrow.up': 'share',

  // Camera & Media
  'bolt.fill': 'bolt',
  'bolt.slash.fill': 'flash-off',
  'photo.fill.on.rectangle.fill': 'photo-library',
  'arrow.triangle.2.circlepath.camera.fill': 'flip-camera-ios',
  'photo.on.rectangle.fill': 'photo-library',

  // Status & Feedback
  'sparkle': 'auto-awesome',
  'eye.slash.fill': 'visibility-off',
  'exclamationmark.triangle.fill': 'warning',
  'checkmark.circle.fill': 'check-circle',
  'info.circle.fill': 'info',

  // Media Playback
  'speaker.wave.3.fill': 'volume-up',
  'speaker.wave.2': 'volume-down',
  'play.fill': 'play-arrow',

  // Weather
  'cloud.bolt.rain.fill': 'thunderstorm',
  'sun.max.fill': 'wb-sunny',
  'cloud.fill': 'cloud',
  'thermometer.medium': 'thermostat',
  'drop.triangle.fill': 'water-drop',
  'humidity.fill': 'water-drop',

  // Custom App Icons
  'sparkles': 'auto-awesome',
  'leaf.fill': 'eco',
  'chart.bar.fill': 'bar-chart',
  'camera.fill': 'photo-camera',
  'camera': 'photo-camera',
  'flask.fill': 'science',
  'shield.lefthalf.filled': 'security',
  'location.fill': 'location-on',
  'location': 'location-on',

  // Treatment Icons
  'hand.raised.fill': 'pan-tool',
  'drop.fill': 'water-drop',
  'eye.fill': 'visibility',
  'bug.fill': 'bug-report',
  'scissors': 'content-cut',
  'shield.fill': 'security',
  'cross.case.fill': 'medical-services',
  'checkmark.seal.fill': 'verified',
} as Record<string, ComponentProps<typeof MaterialIcons>['name']>;

export type IconSymbolName = keyof typeof MAPPING;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: string; // Allow string to prevent crash if mapping is missing
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  const iconName = MAPPING[name as IconSymbolName] || 'help-outline';
  return <MaterialIcons color={color} size={size} name={iconName} style={style} />;
}
