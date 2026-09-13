import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { listCropCycles } from '../api/cropCycles';
import { getPnlSummary } from '../api/reports';
import EmptyState from '../components/EmptyState';
import GuideModal from '../components/GuideModal';
import LoadingSpinner from '../components/LoadingSpinner';
import PnlCard from '../components/PnlCard';
import Screen from '../components/Screen';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { syncReminderNotifications } from '../services/reminderEngine';
import { colors } from '../theme/colors';
import { translateCropName } from '../utils/cropNames';
import { storage } from '../utils/storage';

const GUIDE_SEEN_KEY_PREFIX = 'agritrack_guide_seen_';

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const { strings } = useLanguage();
  const t = strings.dashboard;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pnl, setPnl] = useState({ income: 0, expense: 0, profit: 0 });
  const [cycles, setCycles] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [guideVisible, setGuideVisible] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const seen = await storage.getItem(`${GUIDE_SEEN_KEY_PREFIX}${user.id}`);
      if (!seen) setGuideVisible(true);
    })();
  }, [user?.id]);

  const closeGuide = () => {
    setGuideVisible(false);
    if (user?.id) storage.setItem(`${GUIDE_SEEN_KEY_PREFIX}${user.id}`, '1');
  };

  const load = useCallback(async () => {
    const [summary, activeCycles, reminderData] = await Promise.all([
      getPnlSummary(),
      listCropCycles('Active'),
      syncReminderNotifications(strings.reminders),
    ]);
    setPnl({ income: summary.totalIncome, expense: summary.totalExpense, profit: summary.profit });
    setCycles(activeCycles);
    setReminders(reminderData.today);
  }, [strings]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().finally(() => setLoading(false));
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <Screen>
    <FlatList
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={
        <View>
          <Text style={styles.greeting}>{t.greeting(user?.name ?? '')}</Text>

          <PnlCard
            label={t.seasonLabel}
            income={pnl.income}
            expense={pnl.expense}
            profit={pnl.profit}
            incomeLabel={t.income}
            expenseLabel={t.expense}
            profitLabel={t.profit}
          />

          <Text style={styles.sectionTitle}>{t.remindersToday}</Text>
          {reminders.length === 0 ? (
            <EmptyState message={t.noReminders} />
          ) : (
            reminders.map((reminder) => (
              <View key={`${reminder.cropCycleId}-${reminder.reminderType}`} style={styles.reminderRow}>
                <Text style={styles.reminderText}>
                  {reminder.reminderType === 'Water'
                    ? strings.reminders.water(reminder.fieldName, translateCropName(reminder.cropTypeName, strings.common))
                    : strings.reminders.pesticide(reminder.fieldName, translateCropName(reminder.cropTypeName, strings.common))}
                </Text>
              </View>
            ))
          )}

          <Text style={styles.sectionTitle}>{t.activeCycles}</Text>
        </View>
      }
      data={cycles}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={{ gap: 12 }}
      contentInsetAdjustmentBehavior="automatic"
      ListEmptyComponent={<EmptyState message={t.noCycles} />}
      renderItem={({ item }) => (
        <Pressable
          style={styles.cycleCard}
          onPress={() => navigation.navigate('CropCycle', { cropCycleId: item.id })}
        >
          <Text style={styles.cycleCrop}>
            {translateCropName(item.cropTypeName, strings.common)}
            {item.cycleLabel ? ` · ${item.cycleLabel}` : ''}
          </Text>
          <Text style={styles.cycleField}>{item.fieldName}</Text>
          <View style={styles.stagePill}>
            <Text style={styles.stagePillText}>{item.currentStage}</Text>
          </View>
        </Pressable>
      )}
    />
    <GuideModal visible={guideVisible} onClose={closeGuide} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 16 },
  greeting: { fontSize: 22, fontWeight: '600', color: colors.ink, marginBottom: 4 },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: colors.ink, marginTop: 16, marginBottom: 8 },
  reminderRow: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    backgroundColor: colors.card,
  },
  reminderText: { fontSize: 15, color: colors.ink },
  cycleCard: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    backgroundColor: colors.card,
    marginBottom: 12,
  },
  cycleCrop: { fontSize: 16, fontWeight: '600', color: colors.ink },
  cycleField: { fontSize: 13, color: colors.mutedInk, marginTop: 2 },
  stagePill: {
    marginTop: 8,
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  stagePillText: { fontSize: 12, color: colors.ink },
});
