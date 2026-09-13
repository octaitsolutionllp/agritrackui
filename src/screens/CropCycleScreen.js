import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { deleteActivity, listActivities } from '../api/activities';
import { advanceCropCycleStage, createCropCycle, getCropCycle, getCycleLineage } from '../api/cropCycles';
import DateField from '../components/DateField';
import DeleteButton from '../components/DeleteButton';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import Screen from '../components/Screen';
import ScreenHeader from '../components/ScreenHeader';
import StageProgressBar from '../components/StageProgressBar';
import { useLanguage } from '../context/LanguageContext';
import { syncReminderNotifications } from '../services/reminderEngine';
import { colors } from '../theme/colors';
import { translateCropName } from '../utils/cropNames';

const ACTIVITY_LABEL_KEY = {
  Water: 'optWater',
  Pesticide: 'optPesticide',
  Fertilizer: 'optFertilizer',
  Weeding: 'optWeeding',
  EarthingUp: 'optEarthingUp',
  Sieving: 'optSieving',
  Other: 'optOther',
};

function suggestNextLabel(cycles) {
  const khodvaNumbers = cycles
    .map((c) => c.cycleLabel?.match(/khodva\s*(\d+)/i))
    .filter(Boolean)
    .map((m) => parseInt(m[1], 10));
  const next = khodvaNumbers.length > 0 ? Math.max(...khodvaNumbers) + 1 : 1;
  return `Khodva ${next}`;
}

export default function CropCycleScreen({ route, navigation }) {
  const { cropCycleId } = route.params;
  const { strings } = useLanguage();
  const t = strings.cropCycle;
  const tl = strings.lineage;

  const [loading, setLoading] = useState(true);
  const [cycle, setCycle] = useState(null);
  const [activities, setActivities] = useState([]);
  const [lineage, setLineage] = useState(null);
  const [advancing, setAdvancing] = useState(false);
  const [nextCycleVisible, setNextCycleVisible] = useState(false);

  const load = useCallback(async () => {
    const [cycleData, activityData, lineageData] = await Promise.all([
      getCropCycle(cropCycleId),
      listActivities(cropCycleId),
      getCycleLineage(cropCycleId),
    ]);
    setCycle(cycleData);
    setActivities(activityData);
    setLineage(lineageData);
  }, [cropCycleId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().finally(() => setLoading(false));
    }, [load])
  );

  const handleDeleteActivity = async (id) => {
    await deleteActivity(id);
    await load();
  };

  const handleAdvance = async () => {
    setAdvancing(true);
    try {
      await advanceCropCycleStage(cropCycleId);
      await load();
      await syncReminderNotifications(strings.reminders);
    } finally {
      setAdvancing(false);
    }
  };

  const handleStartNextCycle = async ({ cycleLabel, sownDate }) => {
    const created = await createCropCycle({
      fieldId: cycle.fieldId,
      cropTypeId: cycle.cropTypeId,
      sownDate,
      expectedHarvestDate: null,
      cycleLabel,
      parentCropCycleId: cycle.id,
    });
    setNextCycleVisible(false);
    navigation.push('CropCycle', { cropCycleId: created.id });
  };

  if (loading || !cycle) return <LoadingSpinner />;

  const canAdvance = cycle.status === 'Active' && cycle.currentStage !== 'Harvested';
  const canStartNext = cycle.status === 'Completed';
  const cycleTitle = [cycle.fieldName, translateCropName(cycle.cropTypeName, strings.common), cycle.cycleLabel]
    .filter(Boolean)
    .join(' · ');

  return (
    <Screen>
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <ScreenHeader
        title={cycleTitle}
        subtitle={`${t.sownLabel} ${cycle.sownDate}   ${cycle.expectedHarvestDate ? `· ${t.harvestLabel} ${cycle.expectedHarvestDate}` : ''}`}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.card}>
        <Text style={styles.cardLabel}>{t.stageProgress}</Text>
        <StageProgressBar
          currentStage={cycle.currentStage}
          labels={[t.stageLandPrep, t.stageSow, t.stageGerm, t.stageVeg, t.stageFlower, t.stageFruit]}
        />
        {canAdvance ? (
          <Pressable style={styles.primaryButton} onPress={handleAdvance} disabled={advancing}>
            <Text style={styles.primaryButtonText}>{t.advanceStage}</Text>
          </Pressable>
        ) : null}
        {canStartNext ? (
          <Pressable style={styles.nextCycleButton} onPress={() => setNextCycleVisible(true)}>
            <Text style={styles.nextCycleButtonText}>{t.startNextCycleBtn}</Text>
          </Pressable>
        ) : null}
      </View>

      {lineage && lineage.cycles.length > 1 ? (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{tl.title}</Text>
          {lineage.cycles.map((c) => {
            const isCurrent = c.id === cycle.id;
            const isProfit = c.profit >= 0;
            return (
              <Pressable
                key={c.id}
                style={[styles.lineageRow, isCurrent && styles.lineageRowCurrent]}
                onPress={() => !isCurrent && navigation.push('CropCycle', { cropCycleId: c.id })}
                disabled={isCurrent}
              >
                <View>
                  <Text style={styles.lineageLabel}>
                    {c.cycleLabel ?? translateCropName(c.cropTypeName, strings.common)} {isCurrent ? `(${tl.current})` : ''}
                  </Text>
                  <Text style={styles.lineageDate}>{c.sownDate}</Text>
                </View>
                <Text style={[styles.lineageProfit, { color: isProfit ? colors.accent : colors.danger }]}>
                  {isProfit ? '+' : '−'}₹{Math.abs(c.profit).toLocaleString('en-IN')}
                </Text>
              </Pressable>
            );
          })}
          <View style={styles.lifetimeRow}>
            <Text style={styles.lifetimeLabel}>{tl.lifetimeTotal}</Text>
            <Text
              style={[
                styles.lifetimeValue,
                { color: lineage.lifetimeProfit >= 0 ? colors.accent : colors.danger },
              ]}
            >
              {lineage.lifetimeProfit >= 0 ? '+' : '−'}₹{Math.abs(lineage.lifetimeProfit).toLocaleString('en-IN')}
            </Text>
          </View>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>{t.recentActivity}</Text>
      {activities.length === 0 ? (
        <EmptyState message={t.noActivity} />
      ) : (
        activities.map((activity) => (
          <View key={activity.id} style={styles.activityRow}>
            <View>
              <Text style={styles.activityType}>{strings.logActivity[ACTIVITY_LABEL_KEY[activity.activityType]]}</Text>
              <Text style={styles.activityDate}>{activity.activityDate}</Text>
            </View>
            <DeleteButton onConfirm={() => handleDeleteActivity(activity.id)} />
          </View>
        ))
      )}

      <View style={styles.actionsRow}>
        <Pressable
          style={styles.outlineButton}
          onPress={() => navigation.navigate('LogActivity', { cropCycleId })}
        >
          <Text style={styles.outlineButtonText}>{t.logActivityBtn}</Text>
        </Pressable>
        <Pressable
          style={styles.outlineButton}
          onPress={() => navigation.navigate('Expenses', { cropCycleId })}
        >
          <Text style={styles.outlineButtonText}>{t.addExpenseBtn}</Text>
        </Pressable>
      </View>
      <View style={styles.harvestRow}>
        <Pressable
          style={styles.harvestButton}
          onPress={() => navigation.navigate('Harvest', { cropCycleId })}
        >
          <Text style={styles.harvestButtonText}>{t.recordHarvestBtn}</Text>
        </Pressable>
      </View>
    </ScrollView>

    <StartNextCycleModal
      visible={nextCycleVisible}
      onClose={() => setNextCycleVisible(false)}
      onSubmit={handleStartNextCycle}
      suggestedLabel={lineage ? suggestNextLabel(lineage.cycles) : 'Khodva 1'}
      strings={tl}
    />
    </Screen>
  );
}

function StartNextCycleModal({ visible, onClose, onSubmit, suggestedLabel, strings: tl }) {
  const [cycleLabel, setCycleLabel] = useState(suggestedLabel);
  const [sownDate, setSownDate] = useState(new Date().toISOString().slice(0, 10));

  React.useEffect(() => {
    if (visible) setCycleLabel(suggestedLabel);
  }, [visible, suggestedLabel]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <Text style={styles.sheetTitle}>{tl.startNextTitle}</Text>

        <Text style={styles.label}>{tl.dateLabel}</Text>
        <DateField value={sownDate} onChange={setSownDate} />

        <Text style={styles.label}>Label</Text>
        <TextInput style={styles.input} value={cycleLabel} onChangeText={setCycleLabel} />

        <Pressable style={styles.primaryButton} onPress={() => onSubmit({ cycleLabel, sownDate })}>
          <Text style={styles.primaryButtonText}>{tl.saveBtn}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingBottom: 32 },
  card: {
    marginHorizontal: 20,
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.card,
    padding: 16,
  },
  cardLabel: { fontSize: 14, color: colors.mutedInk, marginBottom: 10 },
  primaryButton: { marginTop: 14, backgroundColor: colors.accent, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  primaryButtonText: { color: colors.background, fontSize: 16, fontWeight: '600' },
  nextCycleButton: { marginTop: 10, borderWidth: 1.5, borderColor: colors.gold, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  nextCycleButtonText: { color: colors.ink, fontSize: 15, fontWeight: '600' },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: colors.ink, marginHorizontal: 20, marginTop: 20, marginBottom: 8 },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.card,
    padding: 12,
    marginBottom: 8,
  },
  activityType: { fontSize: 15, color: colors.ink },
  activityDate: { fontSize: 13, color: colors.mutedInk },
  actionsRow: { flexDirection: 'row', gap: 12, marginHorizontal: 20, marginTop: 16 },
  outlineButton: { flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  outlineButtonText: { color: colors.ink, fontSize: 15, fontWeight: '500' },
  harvestRow: { marginHorizontal: 20, marginTop: 12 },
  harvestButton: { backgroundColor: colors.gold, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  harvestButtonText: { color: colors.ink, fontSize: 15, fontWeight: '600' },
  lineageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.dashedBorder,
    borderStyle: 'dashed',
  },
  lineageRowCurrent: { opacity: 1 },
  lineageLabel: { fontSize: 15, color: colors.ink, fontWeight: '600' },
  lineageDate: { fontSize: 12, color: colors.mutedInk },
  lineageProfit: { fontSize: 14, fontWeight: '600' },
  lifetimeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 2, borderTopColor: colors.border, marginTop: 4 },
  lifetimeLabel: { fontSize: 15, fontWeight: '600', color: colors.ink },
  lifetimeValue: { fontSize: 16, fontWeight: '700' },
  backdrop: { flex: 1, backgroundColor: 'rgba(30,58,41,0.35)' },
  sheet: { backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 22, gap: 8 },
  sheetTitle: { fontSize: 20, fontWeight: '600', color: colors.ink, marginBottom: 4 },
  label: { fontSize: 13, color: colors.mutedInk },
  input: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, backgroundColor: colors.card },
});
