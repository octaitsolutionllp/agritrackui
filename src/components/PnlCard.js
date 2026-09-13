import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

export default function PnlCard({ label, income, expense, profit, incomeLabel, expenseLabel, profitLabel }) {
  const isProfit = profit >= 0;
  return (
    <View style={styles.card}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row}>
        <View>
          <Text style={styles.itemLabel}>{incomeLabel}</Text>
          <Text style={styles.value}>₹{income.toLocaleString('en-IN')}</Text>
        </View>
        <View>
          <Text style={styles.itemLabel}>{expenseLabel}</Text>
          <Text style={styles.value}>₹{expense.toLocaleString('en-IN')}</Text>
        </View>
        <View>
          <Text style={styles.itemLabel}>{profitLabel}</Text>
          <Text style={[styles.value, { color: isProfit ? colors.accent : colors.danger }]}>
            {isProfit ? '▲' : '▼'} ₹{Math.abs(profit).toLocaleString('en-IN')}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.card,
    padding: 16,
  },
  label: { fontSize: 14, color: colors.mutedInk, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  itemLabel: { fontSize: 13, color: colors.mutedInk },
  value: { fontSize: 18, fontWeight: '600', color: colors.ink, marginTop: 2 },
});
