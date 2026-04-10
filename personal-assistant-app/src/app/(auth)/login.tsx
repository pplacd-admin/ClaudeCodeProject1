import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../../services/firebase/config';
import { useAuthStore } from '../../store/auth.store';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  // Redirect if already logged in
  if (user) {
    router.replace('/(tabs)');
    return null;
  }

  const handleGoogleSignIn = async () => {
    // In a real EAS build, use expo-auth-session with Google OAuth
    // For now, show placeholder
    alert('Google Sign-In requires an EAS Development Build.\nRun: eas build --profile development --platform ios');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>V</Text>
        </View>
        <Text style={styles.title}>Vivek AI</Text>
        <Text style={styles.subtitle}>Your personal AI operating system</Text>
      </View>

      <View style={styles.features}>
        {[
          ['🎯', 'Daily goals & inbox zero'],
          ['🧠', 'Microlearning: Claude & Gemini'],
          ['💡', '$500M business idea engine'],
          ['🎙️', 'Voice assistant, always ready'],
        ].map(([icon, text]) => (
          <View key={text} style={styles.featureRow}>
            <Text style={styles.featureIcon}>{icon}</Text>
            <Text style={styles.featureText}>{text}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn}>
        <Text style={styles.googleButtonText}>Continue with Google</Text>
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        Connect your Gmail for inbox management.{'\n'}Your data stays private.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.xl,
    justifyContent: 'space-between',
    paddingVertical: SPACING.xxl * 1.5,
  },
  header: { alignItems: 'center', gap: SPACING.md },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { fontSize: 40, fontWeight: '700', color: COLORS.text },
  title: { fontSize: FONT_SIZE.xxxl, fontWeight: '700', color: COLORS.text },
  subtitle: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, textAlign: 'center' },
  features: { gap: SPACING.md },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  featureIcon: { fontSize: 24, width: 36 },
  featureText: { fontSize: FONT_SIZE.md, color: COLORS.text },
  googleButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  googleButtonText: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.text },
  disclaimer: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
