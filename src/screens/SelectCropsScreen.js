import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getSelectedCropTypeIds, setCropTypeIds } from '../api/auth';
import { listCropTypes } from '../api/cropTypes';
import LoadingSpinner from '../components/LoadingSpinner';
import Screen from '../components/Screen';
import ScreenHeader from '../components/ScreenHeader';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { colors } from '../theme/colors';
import { translateCropName } from '../utils/cropNames';

export default function SelectCropsScreen({ navigation, route }) {
  const onboarding = route.params?.onboarding ?? false;
  const { strings } = useLanguage();
  const { markCropSelectionComplete } = useAuth();
  const t = strings.myCrops;

  const [loading, setLoading] = useState(true);
  const [cropTypes, setCropTypes] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [all, selected] = await Promise.all([listCropTypes(), getSelectedCropTypeIds()]);
      setCropTypes(all);
      setSelectedIds(new Set(selected));
      setLoading(false);
    })();
  }, []);

  const toggle = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const save = async (ids) => {
    setSaving(true);
    try {
      await setCropTypeIds(ids);
      await markCropSelectionComplete();
      if (!onboarding) {
        navigation.goBack();
      }
      // In onboarding mode, AppNavigator remounts its Stack.Navigator (keyed on the onboarding
      // gate) once `hasCompletedCropSelection` flips true, landing on HomeTabs automatically.
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <Screen>
      <ScreenHeader title={t.title} onBack={onboarding ? undefined : () => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>{t.subtitle}</Text>
        <View style={styles.grid}>
          {cropTypes.map((cropType) => {
            const selected = selectedIds.has(cropType.id);
            return (
              <Pressable
                key={cropType.id}
                onPress={() => toggle(cropType.id)}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {translateCropName(cropType.name, strings.common)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.hint}>{t.noneSelectedHint}</Text>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.saveButton} onPress={() => save(Array.from(selectedIds))} disabled={saving}>
          {saving ? <ActivityIndicator color={colors.background} /> : <Text style={styles.saveButtonText}>{t.saveBtn}</Text>}
        </Pressable>
        {onboarding ? (
          <Pressable style={styles.skipButton} onPress={() => save([])} disabled={saving}>
            <Text style={styles.skipButtonText}>{t.skipBtn}</Text>
          </Pressable>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingTop: 8, paddingBottom: 100 },
  subtitle: { fontSize: 14, color: colors.mutedInk, marginBottom: 16, lineHeight: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: colors.card,
  },
  chipSelected: { backgroundColor: colors.accent, borderColor: colors.accentDark },
  chipText: { fontSize: 14, color: colors.ink },
  chipTextSelected: { color: colors.background, fontWeight: '600' },
  hint: { fontSize: 12, color: colors.mutedInk, marginTop: 16 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    gap: 8,
    backgroundColor: colors.background,
    borderTopWidth: 1.5,
    borderTopColor: colors.border,
  },
  saveButton: { backgroundColor: colors.accent, borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  saveButtonText: { color: colors.background, fontSize: 16, fontWeight: '600' },
  skipButton: { paddingVertical: 8, alignItems: 'center' },
  skipButtonText: { color: colors.mutedInk, fontSize: 14 },
});
