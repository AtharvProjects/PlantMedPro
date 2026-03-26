import { BlurView } from 'expo-blur';
import { ViewProps } from 'react-native';

export interface GlassCardProps extends ViewProps {
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
}

export function GlassCard({ children, style, intensity = 50, tint = 'default', ...props }: GlassCardProps) {
  return (
    <BlurView
      intensity={intensity}
      tint={tint}
      style={[{ borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }, style]}
      {...props}
    >
      {children}
    </BlurView>
  );
}
