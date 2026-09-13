import React from 'react';
import { PieChart } from 'react-native-gifted-charts';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

const PALETTE = [colors.accent, colors.clay, colors.ink, colors.gold, colors.danger, colors.mutedInk];

export default function ExpensePieChart({ data, categoryLabels }) {
  const total = data.reduce((sum, item) => sum + item.amount, 0) || 1;
  const chartData = data.map((item, index) => ({
    value: item.amount,
    color: PALETTE[index % PALETTE.length],
  }));

  return (
    <View style={styles.row}>
      <PieChart data={chartData} radius={55} innerRadius={28} donut />
      <View style={styles.legend}>
        {data.map((item, index) => (
          <View key={item.category} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: PALETTE[index % PALETTE.length] }]} />
            <Text style={styles.legendText}>
              {categoryLabels[item.category] ?? item.category} {Math.round((item.amount / total) * 100)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  legend: { gap: 6 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 14, color: colors.ink },
});
