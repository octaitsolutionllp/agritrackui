import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { createUser, listUsers, listUsersCreatedByMe, resetUserPassword, setUserRole } from '../api/admin';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import Screen from '../components/Screen';
import ScreenHeader from '../components/ScreenHeader';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { colors } from '../theme/colors';

export default function AdminScreen({ navigation }) {
  const { strings, language } = useLanguage();
  const { user: currentUser } = useAuth();
  const t = strings.admin;

  const [tab, setTab] = useState('all'); // 'all' | 'mine'
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState([]);
  const [myUsers, setMyUsers] = useState([]);
  const [addUserVisible, setAddUserVisible] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [roleError, setRoleError] = useState(null);

  const load = useCallback(async () => {
    const [all, mine] = await Promise.all([listUsers(), listUsersCreatedByMe()]);
    setAllUsers(all);
    setMyUsers(mine);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().finally(() => setLoading(false));
    }, [load])
  );

  const handleToggleRole = async (targetUser) => {
    setRoleError(null);
    const nextRole = targetUser.role === 'Admin' ? 'User' : 'Admin';
    try {
      await setUserRole(targetUser.id, nextRole);
      await load();
    } catch (err) {
      setRoleError(err.response?.data?.message ?? t.cannotChangeSelf);
    }
  };

  if (loading) return <LoadingSpinner />;

  const users = tab === 'all' ? allUsers : myUsers;

  return (
    <Screen>
      <ScreenHeader
        title={t.title}
        onBack={() => navigation.goBack()}
        right={
          <Pressable style={styles.addChip} onPress={() => setAddUserVisible(true)}>
            <Text style={styles.addChipText}>{t.addUserBtn}</Text>
          </Pressable>
        }
      />

      <View style={styles.tabRow}>
        <Pressable style={[styles.tab, tab === 'all' && styles.tabActive]} onPress={() => setTab('all')}>
          <Text style={[styles.tabText, tab === 'all' && styles.tabTextActive]}>{t.tabAllUsers}</Text>
        </Pressable>
        <Pressable style={[styles.tab, tab === 'mine' && styles.tabActive]} onPress={() => setTab('mine')}>
          <Text style={[styles.tabText, tab === 'mine' && styles.tabTextActive]}>{t.tabCreatedByMe}</Text>
        </Pressable>
      </View>

      {roleError ? <Text style={styles.errorText}>{roleError}</Text> : null}

      <FlatList
        contentContainerStyle={styles.content}
        data={users}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<EmptyState message={t.noUsers} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.userName}>{item.name}</Text>
              <View style={[styles.rolePill, item.role === 'Admin' && styles.rolePillAdmin]}>
                <Text style={[styles.rolePillText, item.role === 'Admin' && styles.rolePillTextAdmin]}>
                  {item.role === 'Admin' ? t.roleAdmin : t.roleUser}
                </Text>
              </View>
            </View>
            <Text style={styles.userMeta}>{item.emailOrPhone}</Text>
            <Text style={styles.userMeta}>{item.createdByName ? t.createdBy(item.createdByName) : t.selfRegistered}</Text>

            <View style={styles.actionsRow}>
              <Pressable
                style={styles.actionChip}
                onPress={() => navigation.navigate('AdminUserDetail', { userId: item.id, userName: item.name })}
              >
                <Text style={styles.actionChipText}>{t.viewDataBtn}</Text>
              </Pressable>
              <Pressable style={styles.actionChip} onPress={() => setResetPasswordUser(item)}>
                <Text style={styles.actionChipText}>{t.resetPasswordBtn}</Text>
              </Pressable>
              {item.id !== currentUser?.id ? (
                <Pressable style={styles.actionChip} onPress={() => handleToggleRole(item)}>
                  <Text style={styles.actionChipText}>{item.role === 'Admin' ? t.makeUserBtn : t.makeAdminBtn}</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        )}
      />

      <AddUserModal visible={addUserVisible} onClose={() => setAddUserVisible(false)} onCreated={load} t={t} language={language} />
      <ResetPasswordModal user={resetPasswordUser} onClose={() => setResetPasswordUser(null)} t={t} />
    </Screen>
  );
}

function AddUserModal({ visible, onClose, onCreated, t, language }) {
  const [name, setName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const close = () => {
    setName('');
    setEmailOrPhone('');
    setPassword('');
    setError(null);
    setSuccess(false);
    onClose();
  };

  const submit = async () => {
    setError(null);
    setSaving(true);
    try {
      await createUser({ name: name.trim(), emailOrPhone: emailOrPhone.trim(), password, preferredLanguage: language });
      setSuccess(true);
      await onCreated();
      setTimeout(close, 900);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close} />
      <View style={styles.sheet}>
        <Text style={styles.sheetTitle}>{t.addUserTitle}</Text>
        <TextInput style={styles.input} placeholder={t.namePlaceholder} placeholderTextColor={colors.mutedInk} value={name} onChangeText={setName} />
        <TextInput
          style={styles.input}
          placeholder={t.emailPlaceholder}
          placeholderTextColor={colors.mutedInk}
          autoCapitalize="none"
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
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {success ? <Text style={styles.successText}>{t.userCreated}</Text> : null}
        <Pressable style={styles.button} onPress={submit} disabled={saving}>
          {saving ? <ActivityIndicator color={colors.background} /> : <Text style={styles.buttonText}>{t.saveBtn}</Text>}
        </Pressable>
        <Pressable style={styles.cancelButton} onPress={close}>
          <Text style={styles.cancelText}>{t.cancelBtn}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

function ResetPasswordModal({ user, onClose, t }) {
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const close = () => {
    setNewPassword('');
    setError(null);
    setSuccess(false);
    onClose();
  };

  const submit = async () => {
    setError(null);
    setSaving(true);
    try {
      await resetUserPassword(user.id, newPassword);
      setSuccess(true);
      setTimeout(close, 900);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={!!user} transparent animationType="slide" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close} />
      <View style={styles.sheet}>
        <Text style={styles.sheetTitle}>{user ? t.resetPasswordTitle(user.name) : ''}</Text>
        <TextInput
          style={styles.input}
          placeholder={t.newPasswordPlaceholder}
          placeholderTextColor={colors.mutedInk}
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {success ? <Text style={styles.successText}>{t.resetSuccess}</Text> : null}
        <Pressable style={styles.button} onPress={submit} disabled={saving}>
          {saving ? <ActivityIndicator color={colors.background} /> : <Text style={styles.buttonText}>{t.confirmBtn}</Text>}
        </Pressable>
        <Pressable style={styles.cancelButton} onPress={close}>
          <Text style={styles.cancelText}>{t.cancelBtn}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  addChip: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  addChipText: { color: colors.ink, fontSize: 14 },
  tabRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 8 },
  tab: { flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: 8, paddingVertical: 8, alignItems: 'center', backgroundColor: colors.card },
  tabActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  tabText: { fontSize: 13, color: colors.ink, fontWeight: '600' },
  tabTextActive: { color: colors.background },
  content: { padding: 20, paddingTop: 4 },
  card: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 10, backgroundColor: colors.card, padding: 14, marginBottom: 12 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  userName: { fontSize: 16, fontWeight: '600', color: colors.ink },
  userMeta: { fontSize: 13, color: colors.mutedInk, marginTop: 2 },
  rolePill: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  rolePillAdmin: { backgroundColor: colors.gold, borderColor: colors.gold },
  rolePillText: { fontSize: 12, color: colors.ink },
  rolePillTextAdmin: { color: colors.ink, fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionChip: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 },
  actionChipText: { fontSize: 12, color: colors.ink, fontWeight: '500' },
  errorText: { color: colors.danger, fontSize: 13, textAlign: 'center', paddingHorizontal: 20, marginBottom: 6 },
  successText: { color: colors.accent, fontSize: 13, textAlign: 'center' },
  backdrop: { flex: 1, backgroundColor: 'rgba(30,58,41,0.35)' },
  sheet: { backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 22, gap: 10 },
  sheetTitle: { fontSize: 18, fontWeight: '600', color: colors.ink, marginBottom: 4 },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: colors.card,
  },
  button: { backgroundColor: colors.accent, borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  buttonText: { color: colors.background, fontSize: 15, fontWeight: '600' },
  cancelButton: { paddingVertical: 8, alignItems: 'center' },
  cancelText: { color: colors.mutedInk, fontSize: 14 },
});
