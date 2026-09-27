import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Button from '../../components/Button';
import ContourBackdrop from '../../components/brand/ContourBackdrop';
import GycLockup from '../../components/brand/GycLockup';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { Fonts } from '../../constants/Typography';
import { signInWithEmail, signUpWithEmail } from '../../services/authService';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;
type Mode = 'signIn' | 'signUp';

export default function WelcomeScreen(_props: Props) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compact = height < 720;

  const [mode, setMode] = useState<Mode>('signIn');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);

  const { signIn: signInWithGoogle, loading: googleLoading } = useGoogleAuth(setGoogleError);

  const modeAnim = useRef(new Animated.Value(0)).current;
  const intro = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(intro, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [intro]);

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    setMode(next);
    Animated.timing(modeAnim, {
      toValue: next === 'signUp' ? 1 : 0,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  };

  const handleSubmit = async () => {
    if (mode === 'signIn') {
      if (!email || !password) return notify('Please enter your email and password.');
      setLoading(true);
      try {
        await signInWithEmail(email.trim(), password);
      } catch (e: any) {
        notify(e.message ?? 'Please check your credentials.', 'Sign in failed');
      } finally {
        setLoading(false);
      }
      return;
    }
    if (!name || !email || !password) return notify('Please fill in your name, email, and password.');
    if (password.length < 6) return notify('Password should be at least 6 characters.', 'Weak password');
    setLoading(true);
    try {
      await signUpWithEmail(name.trim(), email.trim(), password);
    } catch (e: any) {
      notify(e.message ?? 'Please try again.', 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const introStyle = {
    opacity: intro,
    transform: [{ translateY: intro.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
  };

  const nameField = {
    height: modeAnim.interpolate({ inputRange: [0, 1], outputRange: [0, compact ? 62 : 68] }),
    opacity: modeAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] }),
  };

  const inputStyle = (key: string) => [styles.input, focused === key && styles.inputFocused];

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.xl }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}>
        <View style={[styles.hero, { paddingTop: insets.top + (compact ? Spacing.md : Spacing.lg) }]}>
          <ContourBackdrop style={styles.heroBackdrop} />
          <Animated.View style={[styles.heroContent, introStyle]}>
            <View style={styles.greeting}>
              <Text style={styles.greetingText}>Welcome</Text>
            </View>
            <GycLockup logoSize={compact ? 118 : 140} inverted style={styles.lockup} />
          </Animated.View>
        </View>

        <Animated.View style={[styles.sheet, introStyle]}>
          <Text style={[styles.title, compact && styles.titleCompact]}>
            {mode === 'signIn' ? 'Sign in' : 'Create account'}
          </Text>
          <Text style={styles.subtitle}>
            {mode === 'signIn'
              ? 'Welcome back to your local work network.'
              : 'Hire and get hired by trusted people across Meghalaya.'}
          </Text>

          <View style={styles.form}>
            <Animated.View style={[styles.fieldWrap, nameField]}>
              <TextInput
                style={inputStyle('name')}
                placeholder="Full name"
                placeholderTextColor={Colors.textMuted}
                value={name}
                onChangeText={setName}
                editable={mode === 'signUp'}
                onFocus={() => setFocused('name')}
                onBlur={() => setFocused(null)}
              />
            </Animated.View>

            <TextInput
              style={inputStyle('email')}
              placeholder="Email address"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
            />

            <TextInput
              style={inputStyle('password')}
              placeholder="Password"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
            />

            <Button
              title={mode === 'signIn' ? 'Sign in' : 'Create account'}
              icon="arrowRight"
              onPress={handleSubmit}
              loading={loading}
              style={styles.submit}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <Button
              title="Continue with Google"
              onPress={() => {
                setGoogleError(null);
                signInWithGoogle();
              }}
              disabled={googleLoading || loading}
              loading={googleLoading}
              variant="outline"
            />

            {googleError ? (
              <Text style={styles.errorText} accessibilityLiveRegion="polite" numberOfLines={3}>
                {googleError}
              </Text>
            ) : null}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {mode === 'signIn' ? "Don't have an account?" : 'Already have an account?'}
            </Text>
            <Pressable
              onPress={() => switchMode(mode === 'signIn' ? 'signUp' : 'signIn')}
              hitSlop={8}>
              <Text style={styles.footerLink}>{mode === 'signIn' ? 'Create one' : 'Sign in'}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function notify(message: string, title = 'Missing info') {
  Alert.alert(title, message);
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1 },

  hero: { alignItems: 'center', minHeight: 300 },
  heroBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: -40 },
  heroContent: { alignItems: 'center' },
  greeting: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  greetingText: { fontFamily: Fonts.bodySemibold, fontSize: 12.5, color: 'rgba(255,255,255,0.8)', letterSpacing: 0.4 },
  lockup: { marginTop: Spacing.md },

  sheet: {
    marginTop: -28,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg + 6,
    flexGrow: 1,
    overflow: 'hidden',
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -6 },
    elevation: 6,
  },

  title: {
    fontFamily: Fonts.display,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.6,
    color: Colors.text,
  },
  titleCompact: {
    fontSize: 24,
    lineHeight: 30,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textLight,
    marginTop: Spacing.xs,
  },

  form: {
    marginTop: Spacing.lg,
  },
  fieldWrap: { overflow: 'hidden' },
  input: {
    borderWidth: 1.2,
    borderColor: Colors.border,
    backgroundColor: '#F8FAFD',
    borderRadius: 14,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 5,
    fontSize: 15,
    fontFamily: Fonts.body,
    color: Colors.text,
    marginBottom: Spacing.sm + 4,
  },
  inputFocused: {
    borderColor: Colors.accent,
    backgroundColor: Colors.surface,
  },

  submit: {
    marginTop: Spacing.xs,
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: {
    marginHorizontal: Spacing.md,
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: Fonts.body,
  },

  errorText: {
    color: Colors.error,
    fontFamily: Fonts.body,
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: Spacing.md,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  footerText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.textLight,
  },
  footerLink: {
    fontFamily: Fonts.bodySemibold,
    fontSize: 14,
    color: Colors.accent,
    marginLeft: Spacing.xs + 2,
  },
});
