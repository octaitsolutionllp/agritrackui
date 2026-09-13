import { Ionicons } from '@expo/vector-icons';
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

const TYPE_STYLE = {
  Water: { icon: 'water', color: colors.water, tint: colors.waterTint },
  Pesticide: { icon: 'flask', color: colors.clay, tint: colors.goldTint },
};

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

  const cropAndField = (reminder) => {
    const cropName = translateCropName(reminder.cropTypeName, strings.common);
    return `${reminder.fieldName} · ${cropName}`;
  };

  const typeLabel = (reminder) => (reminder.reminderType === 'Water' ? t.typeWater : t.typePesticide);

  return (
    <Screen>
      <ScreenHeader title={t.title} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>{t.today}</Text>
        {todayVisible.length === 0 ? (
          <EmptyState message={t.noReminders} />
        ) : (
          todayVisible.map((reminder) => {
            const typeStyle = TYPE_STYLE[reminder.reminderType] ?? TYPE_STYLE.Water;
            return (
              <View key={reminderKey(reminder)} style={styles.card}>
                <View style={styles.cardTopRow}>
                  <View style={[styles.iconBadge, { backgroundColor: typeStyle.tint }]}>
                    <Ionicons name={typeStyle.icon} size={20} color={typeStyle.color} />
                  </View>
                  <View style={styles.cardTextCol}>
                    <Text style={styles.reminderTitle}>{cropAndField(reminder)}</Text>
                    <Text style={[styles.reminderType, { color: typeStyle.color }]}>{typeLabel(reminder)}</Text>
                  </View>
                </View>
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
                    <Ionicons name="checkmark" size={15} color={colors.background} />
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
            );
          })
        )}

        {reminders.upcoming.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>{t.upcoming}</Text>
            {reminders.upcoming.map((reminder) => {
              const typeStyle = TYPE_STYLE[reminder.reminderType] ?? TYPE_STYLE.Water;
              return (
                <View key={reminderKey(reminder)} style={styles.upcomingRow}>
                  <View style={[styles.iconBadgeSmall, { backgroundColor: typeStyle.tint }]}>
                    <Ionicons name={typeStyle.icon} size={15} color={typeStyle.color} />
                  </View>
                  <Text style={styles.upcomingText} numberOfLines={1}>
                    {cropAndField(reminder)}
                  </Text>
                  <Text style={styles.upcomingDue}>{upcomingDaysAway(reminder.dueDate)}</Text>
                </View>
              );
            })}
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingTop: 4, paddingBottom: 32 },
  sectionLabel: { fontSize: 13, color: colors.mutedInk, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 14, marginBottom: 8 },
  card: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.card, padding: 14, marginBottom: 10 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  iconBadge: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  iconBadgeSmall: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardTextCol: { flex: 1 },
  reminderTitle: { fontSize: 16, fontWeight: '600', color: colors.ink },
  reminderType: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  actionsRow: { flexDirection: 'row', gap: 10 },
  markDoneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.accent,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  markDoneText: { color: colors.background, fontSize: 13, fontWeight: '600' },
  snoozeChip: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 7 },
  snoozeText: { color: colors.ink, fontSize: 13 },
  upcomingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: colors.dashedBorder,
    borderRadius: 10,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  upcomingText: { flex: 1, fontSize: 14, color: colors.ink },
  upcomingDue: { fontSize: 12, color: colors.mutedInk },
});
