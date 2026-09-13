import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import Screen from '../components/Screen';
import ScreenHeader from '../components/ScreenHeader';
import { useLanguage } from '../context/LanguageContext';
import { syncReminderNotifications } from '../services/reminderEngine';
import { colors } from '../theme/colors';
import { translateCropName } from '../utils/cropNames';

function reminderKey(r) {
  return `${r.cropCycleId}-${r.reminderType}`;
}

export default function RemindersScreen({ navigation }) {
  const { strings } = useLanguage();
  const t = strings.reminders;

  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState({ today: [], upcoming: [] });
  const [snoozed, setSnoozed] = useState(new Set());

  const load = useCallback(async () => {
    const data = await syncReminderNotifications(t);
    setReminders(data);
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().finally(() => setLoading(false));
    }, [load])
  );

  if (loading) return <LoadingSpinner />;

  const todayVisible = reminders.today.filter((r) => !snoozed.has(reminderKey(r)));
  const upcomingDaysAway = (dueDate) => {
    const days = Math.round((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    return t.inDays(Math.max(days, 1));
  };

  const describe = (reminder) => {
    const cropName = translateCropName(reminder.cropTypeName, strings.common);
    return reminder.reminderType === 'Water' ? t.water(reminder.fieldName, cropName) : t.pesticide(reminder.fieldName, cropName);
  };

  return (
    <Screen>
      <ScreenHeader title={t.title} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>{t.today}</Text>
        {todayVisible.length === 0 ? (
          <EmptyState message={t.noReminders} />
        ) : (
          todayVisible.map((reminder) => (
            <View key={reminderKey(reminder)} style={styles.card}>
              <Text style={styles.reminderText}>{describe(reminder)}</Text>
              <View style={styles.actionsRow}>
                <Pressable
                  style={styles.markDoneChip}
                  onPress={() =>
                    navigation.navigate('LogActivity', {
                      cropCycleId: reminder.cropCycleId,
                      prefillType: reminder.reminderType,
                    })
                  }
                >
                  <Text style={styles.markDoneText}>{t.markDone}</Text>
                </Pressable>
                <Pressable
                  style={styles.snoozeChip}
                  onPress={() => setSnoozed((prev) => new Set(prev).add(reminderKey(reminder)))}
                >
                  <Text style={styles.snoozeText}>{t.snooze}</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}

        {reminders.upcoming.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>{t.upcoming}</Text>
            {reminders.upcoming.map((reminder) => (
              <View key={reminderKey(reminder)} style={styles.upcomingRow}>
                <Text style={styles.upcomingText}>
                  {describe(reminder)} — {upcomingDaysAway(reminder.dueDate)}
                </Text>
              </View>
            ))}
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingTop: 4 },
  sectionLabel: { fontSize: 13, color: colors.mutedInk, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 14, marginBottom: 8 },
  card: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 10, backgroundColor: colors.card, padding: 14, marginBottom: 10 },
  reminderText: { fontSize: 16, color: colors.ink, marginBottom: 10 },
  actionsRow: { flexDirection: 'row', gap: 10 },
  markDoneChip: { backgroundColor: colors.accent, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6 },
  markDoneText: { color: colors.background, fontSize: 13, fontWeight: '600' },
  snoozeChip: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6 },
  snoozeText: { color: colors.ink, fontSize: 13 },
  upcomingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  upcomingText: { fontSize: 14, color: colors.mutedInk },
});
