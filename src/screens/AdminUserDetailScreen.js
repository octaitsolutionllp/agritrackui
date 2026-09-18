import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { getUserData } from '../api/admin';
import LoadingSpinner from '../components/LoadingSpinner';
import PnlCard from '../components/PnlCard';
import Screen from '../components/Screen';
import ScreenHeader from '../components/ScreenHeader';
import { useLanguage } from '../context/LanguageContext';
import { colors } from '../theme/colors';
import { translateCropName } from '../utils/cropNames';
import { translateStageName } from '../utils/stageNames';

// Read-only view of one user's data for an admin — reuses the same GET /api/admin/users/{id}/data
// payload shape as the user's own Farms/Crop Cycles/Reports screens, just without any of the
// edit actions (no add farm, no log activity, etc.) since an admin is only ever looking here,
// not acting on the user's behalf.
export default function AdminUserDetailScreen({ navigation, route }) {
  const { userId, userName } = route.params;
  const { strings } = useLanguage();
  const t = strings.admin;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    setLoading(true);
    getUserData(userId)
      .then(setData)
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading || !data) return <LoadingSpinner />;

  return (
    <Screen>
      <ScreenHeader title={t.userDataTitle(userName)} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <PnlCard
          label={strings.dashboard.seasonLabel}
          income={data.pnl.totalIncome}
          expense={data.pnl.totalExpense}
          profit={data.pnl.profit}
          incomeLabel={strings.dashboard.income}
          expenseLabel={strings.dashboard.expense}
          profitLabel={strings.dashboard.profit}
        />

        <Text style={styles.sectionTitle}>{t.farmsSection}</Text>
        {data.farms.length === 0 ? (
          <Text style={styles.emptyText}>{t.noFarms}</Text>
        ) : (
          data.farms.map((farm) => (
            <View key={farm.id} style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>{farm.name}</Text>
                {farm.totalAreaAcres ? (
                  <Text style={styles.cardMeta}>
                    {farm.totalAreaAcres} {strings.farms.acres}
                  </Text>
                ) : null}
              </View>
              {farm.fields.map((field) => (
                <View key={field.id} style={styles.fieldRow}>
                  <Text style={styles.fieldName}>{field.name}</Text>
                  <Text style={styles.cardMeta}>
                    {field.areaAcres ? `${field.areaAcres} ${strings.farms.acres}` : strings.farms.empty}
                  </Text>
                </View>
              ))}
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>{t.cropCyclesSection}</Text>
        {data.cropCycles.length === 0 ? (
          <Text style={styles.emptyText}>{t.noCropCycles}</Text>
        ) : (
          data.cropCycles.map((cycle) => (
            <View key={cycle.id} style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>
                  {translateCropName(cycle.cropTypeName, strings.common)}
                  {cycle.cycleLabel ? ` · ${cycle.cycleLabel}` : ''}
                </Text>
                <View style={styles.stagePill}>
                  <Text style={styles.stagePillText}>{translateStageName(cycle.currentStage, strings.cropCycle)}</Text>
                </View>
              </View>
              <Text style={styles.cardMeta}>{cycle.fieldName}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingTop: 4, gap: 4, paddingBottom: 32 },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: colors.ink, marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: colors.mutedInk, paddingVertical: 8 },
  card: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 10, backgroundColor: colors.card, padding: 14, marginBottom: 10 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.ink },
  cardMeta: { fontSize: 13, color: colors.mutedInk, marginTop: 2 },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: colors.dashedBorder,
    borderStyle: 'dashed',
    marginTop: 6,
  },
  fieldName: { fontSize: 14, color: colors.ink },
  stagePill: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  stagePillText: { fontSize: 12, color: colors.ink },
});
