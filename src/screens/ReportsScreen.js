import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { listFarms } from '../api/farms';
import { getPnlByCropCycle, getPnlSummary } from '../api/reports';
import EmptyState from '../components/EmptyState';
import ExpensePieChart from '../components/ExpensePieChart';
import LoadingSpinner from '../components/LoadingSpinner';
import PnlCard from '../components/PnlCard';
import Screen from '../components/Screen';
import ScreenHeader from '../components/ScreenHeader';
import { useLanguage } from '../context/LanguageContext';
import { colors } from '../theme/colors';
import { translateCropName } from '../utils/cropNames';

export default function ReportsScreen() {
  const { strings } = useLanguage();
  const t = strings.reports;

  const [loading, setLoading] = useState(true);
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState(null); // null = All Farms
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, profit: 0, perCrop: [] });
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);

  const load = useCallback(async (farmId) => {
    const [farmsData, summaryData] = await Promise.all([listFarms(), getPnlSummary(farmId ?? undefined)]);
    setFarms(farmsData);
    setSummary(summaryData);

    const perCyclePnl = await Promise.all(
      summaryData.perCrop.map((crop) => getPnlByCropCycle(crop.cropCycleId))
    );
    const merged = new Map();
    for (const pnl of perCyclePnl) {
      for (const item of pnl.categoryBreakdown) {
        merged.set(item.category, (merged.get(item.category) ?? 0) + item.amount);
      }
    }
    setCategoryBreakdown(Array.from(merged, ([category, amount]) => ({ category, amount })));
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load(selectedFarmId).finally(() => setLoading(false));
    }, [load, selectedFarmId])
  );

  if (loading) return <LoadingSpinner />;

  const maxProfit = Math.max(...summary.perCrop.map((c) => Math.abs(c.profit)), 1);
  const categoryLabels = {
    Seeds: strings.expenses.seeds,
    Fertilizer: strings.expenses.fertilizer,
    Pesticide: strings.expenses.pesticide,
    Labor: strings.expenses.labor,
    Irrigation: strings.expenses.irrigation,
    Equipment: strings.expenses.equipment,
    Other: strings.expenses.other,
  };

  return (
    <Screen>
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <ScreenHeader title={t.title} subtitle={t.seasonPill} />

      {farms.length > 0 ? (
        <View style={styles.filterRow}>
          <Pressable
            onPress={() => setSelectedFarmId(null)}
            style={[styles.filterChip, selectedFarmId === null && styles.filterChipSelected]}
          >
            <Text style={[styles.filterChipText, selectedFarmId === null && styles.filterChipTextSelected]}>
              {t.allFarms}
            </Text>
          </Pressable>
          {farms.map((farm) => (
            <Pressable
              key={farm.id}
              onPress={() => setSelectedFarmId(farm.id)}
              style={[styles.filterChip, selectedFarmId === farm.id && styles.filterChipSelected]}
            >
              <Text style={[styles.filterChipText, selectedFarmId === farm.id && styles.filterChipTextSelected]}>
                {farm.name}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <PnlCard
        income={summary.totalIncome}
        expense={summary.totalExpense}
        profit={summary.profit}
        incomeLabel={strings.dashboard.income}
        expenseLabel={strings.dashboard.expense}
        profitLabel={strings.dashboard.profit}
      />

      {categoryBreakdown.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{t.expenseByCategory}</Text>
          <ExpensePieChart data={categoryBreakdown} categoryLabels={categoryLabels} />
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardLabel}>{t.perCropComparison}</Text>
        {summary.perCrop.length === 0 ? (
          <EmptyState message={strings.dashboard.noCycles} />
        ) : (
          summary.perCrop.map((crop) => {
            const isProfit = crop.profit >= 0;
            const widthPct = Math.max((Math.abs(crop.profit) / maxProfit) * 100, 4);
            return (
              <View key={crop.cropCycleId} style={styles.barRow}>
                <View style={styles.barLabelBox}>
                  <Text style={styles.barLabel} numberOfLines={1}>{translateCropName(crop.cropTypeName, strings.common)}</Text>
                  <Text style={styles.barSubLabel} numberOfLines={1}>
                    {crop.cycleLabel ? `${crop.cycleLabel} · ` : ''}
                    {crop.sownDate?.slice(0, 4)}
                  </Text>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${widthPct}%`, backgroundColor: isProfit ? colors.accent : colors.danger },
                    ]}
                  />
                </View>
                <Text style={[styles.barValue, { color: isProfit ? colors.accent : colors.danger }]}>
                  {isProfit ? '+' : '−'}₹{Math.abs(crop.profit).toLocaleString('en-IN')}
                </Text>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 20, gap: 16 },
  card: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.card, padding: 16 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.card },
  filterChipSelected: { backgroundColor: colors.ink },
  filterChipText: { fontSize: 13, color: colors.ink },
  filterChipTextSelected: { color: colors.background },
  cardLabel: { fontSize: 15, color: colors.mutedInk, marginBottom: 12 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  barLabelBox: { width: 84 },
  barLabel: { fontSize: 14, color: colors.ink },
  barSubLabel: { fontSize: 11, color: colors.mutedInk },
  barTrack: { flex: 1, height: 16, borderRadius: 8, backgroundColor: '#eee' },
  barFill: { height: 16, borderRadius: 8 },
  barValue: { fontSize: 14, fontWeight: '600', width: 90, textAlign: 'right' },
});
