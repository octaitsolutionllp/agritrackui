import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import LanguagePicker from '../components/LanguagePicker';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { colors } from '../theme/colors';

export default function LoginScreen() {
  const { strings, language, setLanguage } = useLanguage();
  const t = strings.login;
  const { signIn, register } = useAuth();

  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      if (isSignup) {
        await register({ name, emailOrPhone, password, preferredLanguage: language });
      } else {
        await signIn({ emailOrPhone, password });
      }
    } catch (err) {
      setError(err.response?.data?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.appName}>{t.appName}</Text>
        <Text style={styles.tagline}>{t.tagline}</Text>
      </View>

      <LanguagePicker value={language} onChange={setLanguage} />

      <View style={styles.form}>
        {isSignup ? (
          <TextInput
            style={styles.input}
            placeholder="Name"
            placeholderTextColor={colors.mutedInk}
            value={name}
            onChangeText={setName}
          />
        ) : null}
        <TextInput
          style={styles.input}
          placeholder={t.emailPlaceholder}
          placeholderTextColor={colors.mutedInk}
          autoCapitalize="none"
          keyboardType="email-address"
          value={emailOrPhone}
          onChangeText={setEmailOrPhone}
        />
        <TextInput
          style={styles.input}
          placeholder={t.passwordPlaceholder}
          placeholderTextColor={colors.mutedInk}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.button} onPress={handleSubmit} disabled={submitting}>
        {submitting ? (
          <ActivityIndicator color={colors.background} />
        ) : (
          <Text style={styles.buttonText}>{isSignup ? t.signupLink : t.loginBtn}</Text>
        )}
      </Pressable>

      <Pressable onPress={() => setIsSignup((v) => !v)}>
        <Text style={styles.link}>{isSignup ? t.loginBtn : t.signupLink}</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, padding: 28, justifyContent: 'center', gap: 20 },
  header: { alignItems: 'center', gap: 4, marginBottom: 4 },
  appName: { fontSize: 30, fontWeight: '700', color: colors.ink },
  tagline: { fontSize: 15, color: colors.mutedInk },
  form: { gap: 14 },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.ink,
    backgroundColor: colors.card,
  },
  error: { color: colors.danger, fontSize: 14, textAlign: 'center' },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: { color: colors.background, fontSize: 17, fontWeight: '600' },
  link: { textAlign: 'center', color: colors.ink, textDecorationLine: 'underline', fontSize: 15 },
});
