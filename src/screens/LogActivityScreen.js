import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { logActivity } from '../api/activities';
import DateField from '../components/DateField';
import Screen from '../components/Screen';
import { useLanguage } from '../context/LanguageContext';
import { syncReminderNotifications } from '../services/reminderEngine';
import { parseOptionalNumber } from '../utils/numbers';
import { colors } from '../theme/colors';

const TYPES = [
  { key: 'Water', labelKey: 'optWater' },
  { key: 'Pesticide', labelKey: 'optPesticide' },
  { key: 'Fertilizer', labelKey: 'optFertilizer' },
  { key: 'Weeding', labelKey: 'optWeeding' },
  { key: 'EarthingUp', labelKey: 'optEarthingUp' },
  { key: 'Sieving', labelKey: 'optSieving' },
  { key: 'Other', labelKey: 'optOther' },
];

export default function LogActivityScreen({ route, navigation }) {
  const { cropCycleId, prefillType } = route.params;
  const { strings } = useLanguage();
  const t = strings.logActivity;

  const [activityType, setActivityType] = useState(prefillType ?? 'Water');
  const [activityDate, setActivityDate] = useState(new Date().toISOString().slice(0, 10));
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    setError(null);
    let parsedCost;
    try {
      parsedCost = parseOptionalNumber(cost);
    } catch (err) {
      setError(err.message);
      return;
    }
    setSaving(true);
    try {
      await logActivity({
        cropCycleId,
        activityType,
        activityDate,
        cost: parsedCost,
        notes: notes || null,
      });
      await syncReminderNotifications(strings.reminders);
      navigation.goBack();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
    <View style={styles.screen}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{t.title}</Text>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.cancel}>✕</Text>
        </Pressable>
      </View>

      <View style={styles.optionList}>
        {TYPES.map(({ key, labelKey }) => (
          <Pressable key={key} style={styles.option} onPress={() => setActivityType(key)}>
            <View style={[styles.radio, activityType === key && styles.radioSelected]} />
            <Text style={styles.optionText}>{t[labelKey]}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.row}>
        <View style={styles.field}>
          <Text style={styles.label}>{t.dateLabel}</Text>
          <DateField value={activityDate} onChange={setActivityDate} />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>{t.costLabel}</Text>
          <TextInput style={styles.input} value={cost} onChangeText={setCost} keyboardType="numeric" />
        </View>
      </View>

      <Text style={styles.label}>{t.notesLabel}</Text>
      <TextInput style={[styles.input, styles.notesInput]} value={notes} onChangeText={setNotes} multiline />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Pressable style={styles.button} onPress={submit} disabled={saving}>
        <Text style={styles.buttonText}>{t.saveBtn}</Text>
      </Pressable>
    </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, padding: 22, gap: 12 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 21, fontWeight: '600', color: colors.ink },
  cancel: { fontSize: 20, color: colors.mutedInk, paddingHorizontal: 4 },
  errorText: { color: colors.danger, fontSize: 13 },
  optionList: { gap: 4 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.dashedBorder, borderStyle: 'dashed' },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: colors.border },
  radioSelected: { backgroundColor: colors.accent },
  optionText: { fontSize: 16, color: colors.ink },
  row: { flexDirection: 'row', gap: 12 },
  field: { flex: 1, gap: 4 },
  label: { fontSize: 13, color: colors.mutedInk },
  input: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, backgroundColor: colors.card },
  notesInput: { height: 70, textAlignVertical: 'top' },
  button: { backgroundColor: colors.accent, borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  buttonText: { color: colors.background, fontSize: 17, fontWeight: '600' },
});
