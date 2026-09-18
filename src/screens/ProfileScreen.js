import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { changePassword, deleteAccount, updateLanguage } from '../api/auth';
import GuideModal from '../components/GuideModal';
import LanguagePicker from '../components/LanguagePicker';
import Screen from '../components/Screen';
import ScreenHeader from '../components/ScreenHeader';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { colors } from '../theme/colors';

export default function ProfileScreen({ navigation }) {
  const { user, signOut } = useAuth();
  const { strings, language, setLanguage } = useLanguage();
  const t = strings.profile;

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState(null); // { type: 'error' | 'success', text }
  const [saving, setSaving] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [guideVisible, setGuideVisible] = useState(false);

  const handleLanguageChange = async (code) => {
    await setLanguage(code);
    try {
      await updateLanguage(code);
    } catch {
      // best-effort — local UI language already switched regardless of server sync outcome
    }
  };

  const handleChangePassword = async () => {
    setMessage(null);
    if (!currentPassword || !newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: t.passwordMismatch });
      return;
    }
    setSaving(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setMessage({ type: 'success', text: t.passwordChanged });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const isUnauthorized = err.response?.status === 401;
      setMessage({ type: 'error', text: isUnauthorized ? t.wrongCurrentPassword : 'Something went wrong. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <ScreenHeader title={t.title} subtitle={user?.name} />

      <View style={styles.card}>
        <Text style={styles.label}>{t.languageLabel}</Text>
        <LanguagePicker value={language} onChange={handleLanguageChange} />
      </View>

      <Pressable style={styles.myCropsButton} onPress={() => navigation.navigate('SelectCrops')}>
        <Text style={styles.myCropsButtonText}>{strings.myCrops.title}</Text>
      </Pressable>

      <Pressable style={styles.myCropsButton} onPress={() => setGuideVisible(true)}>
        <Text style={styles.myCropsButtonText}>{strings.help.menuLabel}</Text>
      </Pressable>

      {user?.role === 'Admin' ? (
        <Pressable style={styles.myCropsButton} onPress={() => navigation.navigate('Admin')}>
          <Text style={styles.myCropsButtonText}>{strings.admin.title}</Text>
        </Pressable>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.label}>{t.changePassword}</Text>
        <TextInput
          style={styles.input}
          placeholder={t.currentPasswordLabel}
          placeholderTextColor={colors.mutedInk}
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />
        <TextInput
          style={styles.input}
          placeholder={t.newPasswordLabel}
          placeholderTextColor={colors.mutedInk}
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <TextInput
          style={styles.input}
          placeholder={t.confirmPasswordLabel}
          placeholderTextColor={colors.mutedInk}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        {message ? (
          <Text style={[styles.message, message.type === 'error' ? styles.errorText : styles.successText]}>
            {message.text}
          </Text>
        ) : null}
        <Pressable style={styles.button} onPress={handleChangePassword} disabled={saving}>
          {saving ? <ActivityIndicator color={colors.background} /> : <Text style={styles.buttonText}>{t.saveBtn}</Text>}
        </Pressable>
      </View>

      <Pressable style={styles.logoutButton} onPress={signOut}>
        <Text style={styles.logoutText}>{t.logoutBtn}</Text>
      </Pressable>

      <Pressable style={styles.deleteAccountButton} onPress={() => setDeleteModalVisible(true)}>
        <Text style={styles.deleteAccountText}>{t.deleteAccountBtn}</Text>
      </Pressable>
    </ScrollView>

    <DeleteAccountModal
      visible={deleteModalVisible}
      onClose={() => setDeleteModalVisible(false)}
      onDeleted={signOut}
      strings={t}
    />
    <GuideModal visible={guideVisible} onClose={() => setGuideVisible(false)} />
    </Screen>
  );
}

function DeleteAccountModal({ visible, onClose, onDeleted, strings: t }) {
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const close = () => {
    setConfirmText('');
    setPassword('');
    setError(null);
    onClose();
  };

  const handleDelete = async () => {
    setError(null);
    if (confirmText !== t.deleteAccountConfirmWord) {
      setError(t.deleteAccountTypeMismatch);
      return;
    }
    if (!password) return;
    setDeleting(true);
    try {
      await deleteAccount({ currentPassword: password });
      setConfirmText('');
      setPassword('');
      onDeleted();
    } catch (err) {
      const isUnauthorized = err.response?.status === 401;
      setError(isUnauthorized ? t.wrongCurrentPassword : 'Something went wrong. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close} />
      <View style={styles.sheet}>
        <Text style={styles.sheetTitle}>{t.deleteAccountTitle}</Text>
        <Text style={styles.warningText}>{t.deleteAccountWarning}</Text>

        <Text style={styles.smallLabel}>
          {t.deleteAccountConfirmLabel} ({t.deleteAccountConfirmWord})
        </Text>
        <TextInput
          style={styles.input}
          value={confirmText}
          onChangeText={setConfirmText}
          autoCapitalize="characters"
          placeholder={t.deleteAccountConfirmWord}
          placeholderTextColor={colors.mutedInk}
        />

        <Text style={styles.smallLabel}>{t.deleteAccountPasswordLabel}</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable style={styles.deleteConfirmButton} onPress={handleDelete} disabled={deleting}>
          {deleting ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={styles.deleteConfirmText}>{t.deleteAccountConfirmBtn}</Text>
          )}
        </Pressable>
        <Pressable style={styles.cancelButton} onPress={close}>
          <Text style={styles.cancelText}>{t.deleteAccountCancelBtn}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  card: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.card, padding: 16, gap: 10 },
  label: { fontSize: 15, fontWeight: '600', color: colors.ink, marginBottom: 4 },
  smallLabel: { fontSize: 13, color: colors.mutedInk, marginTop: 4 },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: colors.background,
  },
  message: { fontSize: 13 },
  errorText: { color: colors.danger, fontSize: 13 },
  successText: { color: colors.accent },
  button: { backgroundColor: colors.accent, borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  buttonText: { color: colors.background, fontSize: 15, fontWeight: '600' },
  myCropsButton: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 8, paddingVertical: 12, alignItems: 'center', backgroundColor: colors.card },
  myCropsButtonText: { color: colors.ink, fontSize: 15, fontWeight: '600' },
  logoutButton: { borderWidth: 1.5, borderColor: colors.danger, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  logoutText: { color: colors.danger, fontSize: 15, fontWeight: '600' },
  deleteAccountButton: { paddingVertical: 8, alignItems: 'center' },
  deleteAccountText: { color: colors.danger, fontSize: 13, textDecorationLine: 'underline' },
  backdrop: { flex: 1, backgroundColor: 'rgba(30,58,41,0.35)' },
  sheet: { backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 22, gap: 8 },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: colors.danger },
  warningText: { fontSize: 14, color: colors.ink, marginBottom: 6, lineHeight: 20 },
  deleteConfirmButton: { backgroundColor: colors.danger, borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 10 },
  deleteConfirmText: { color: colors.background, fontSize: 15, fontWeight: '600' },
  cancelButton: { paddingVertical: 10, alignItems: 'center' },
  cancelText: { color: colors.mutedInk, fontSize: 14 },
});
