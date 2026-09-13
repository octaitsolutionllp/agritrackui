import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { createExpense, deleteExpense, listExpenses } from '../api/expenses';
import { getPnlByCropCycle } from '../api/reports';
import DateField from '../components/DateField';
import DeleteButton from '../components/DeleteButton';
import EmptyState from '../components/EmptyState';
import { parseRequiredNumber } from '../utils/numbers';
import LoadingSpinner from '../components/LoadingSpinner';
import Screen from '../components/Screen';
import ScreenHeader from '../components/ScreenHeader';
import { useLanguage } from '../context/LanguageContext';
import { colors } from '../theme/colors';

const CATEGORIES = ['Seeds', 'Fertilizer', 'Pesticide', 'Labor', 'Irrigation', 'Equipment', 'Other'];

export default function ExpensesScreen({ route, navigation }) {
  const { cropCycleId } = route.params;
  const { strings } = useLanguage();
  const t = strings.expenses;

  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [pnl, setPnl] = useState(null);
  const [addVisible, setAddVisible] = useState(false);

  const load = useCallback(async () => {
    const [expensesData, pnlData] = await Promise.all([listExpenses(cropCycleId), getPnlByCropCycle(cropCycleId)]);
    setExpenses(expensesData);
    setPnl(pnlData);
  }, [cropCycleId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().finally(() => setLoading(false));
    }, [load])
  );

  if (loading) return <LoadingSpinner />;

  // Authoritative total — includes any Cost logged alongside an Activity, not just this list.
  const listTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
  const total = pnl?.totalExpense ?? listTotal;
  const activityCostIncluded = total - listTotal;
  const categoryLabel = (category) => t[category.toLowerCase()] ?? category;

  const handleDeleteExpense = async (id) => {
    await deleteExpense(id);
    await load();
  };

  return (
    <Screen>
      <ScreenHeader title={t.title} onBack={() => navigation.goBack()} />

      <FlatList
        contentContainerStyle={styles.content}
        data={expenses}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<EmptyState message={t.noExpenses} />}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.category}>{categoryLabel(item.category)}</Text>
            <Text style={styles.date}>{item.expenseDate}</Text>
            <Text style={styles.amount}>₹{item.amount.toLocaleString('en-IN')}</Text>
            <DeleteButton onConfirm={() => handleDeleteExpense(item.id)} />
          </View>
        )}
        ListFooterComponent={
          expenses.length > 0 || activityCostIncluded > 0 ? (
            <View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>{t.total}</Text>
                <Text style={styles.totalAmount}>₹{total.toLocaleString('en-IN')}</Text>
              </View>
              {activityCostIncluded > 0 ? (
                <Text style={styles.activityCostNote}>
                  {t.includesActivityCost(activityCostIncluded.toLocaleString('en-IN'))}
                </Text>
              ) : null}
            </View>
          ) : null
        }
      />

      <Pressable style={styles.addButton} onPress={() => setAddVisible(true)}>
        <Text style={styles.addButtonText}>{t.addExpenseBtn}</Text>
      </Pressable>

      <AddExpenseModal
        visible={addVisible}
        onClose={() => setAddVisible(false)}
        cropCycleId={cropCycleId}
        onCreated={load}
        strings={t}
        categoryLabel={categoryLabel}
      />
    </Screen>
  );
}

function AddExpenseModal({ visible, onClose, cropCycleId, onCreated, strings: t, categoryLabel }) {
  const [category, setCategory] = useState('Seeds');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);

  const submit = async () => {
    setError(null);
    let parsedAmount;
    try {
      parsedAmount = parseRequiredNumber(amount);
    } catch (err) {
      setError(err.message);
      return;
    }
    try {
      await createExpense({ cropCycleId, category, amount: parsedAmount, expenseDate, notes: notes || null });
      setAmount('');
      setNotes('');
      onClose();
      onCreated();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Something went wrong. Please try again.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <Text style={styles.sheetTitle}>{t.addExpenseBtn}</Text>

        <Text style={styles.label}>{t.categoryLabel}</Text>
        <View style={styles.chipRow}>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => setCategory(cat)}
              style={[styles.chip, category === cat && styles.chipSelected]}
            >
              <Text style={[styles.chipText, category === cat && styles.chipTextSelected]}>{categoryLabel(cat)}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>{t.amountLabel}</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={amount} onChangeText={setAmount} />

        <Text style={styles.label}>{t.dateLabel}</Text>
        <DateField value={expenseDate} onChange={setExpenseDate} />

        <Text style={styles.label}>{t.notesLabel}</Text>
        <TextInput style={styles.input} value={notes} onChangeText={setNotes} />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable style={styles.button} onPress={submit}>
          <Text style={styles.buttonText}>{t.saveBtn}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingTop: 4 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.dashedBorder,
    borderStyle: 'dashed',
  },
  category: { fontSize: 15, color: colors.ink, flex: 1 },
  date: { fontSize: 13, color: colors.mutedInk, flex: 1 },
  amount: { fontSize: 15, color: colors.ink, fontWeight: '600' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 2, borderTopColor: colors.border, paddingTop: 10, marginTop: 4 },
  totalLabel: { fontSize: 18, color: colors.ink, fontWeight: '600' },
  totalAmount: { fontSize: 18, color: colors.ink, fontWeight: '600' },
  activityCostNote: { fontSize: 12, color: colors.mutedInk, marginTop: 4 },
  addButton: { margin: 20, borderWidth: 1.5, borderColor: colors.border, borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  addButtonText: { fontSize: 16, color: colors.ink, fontWeight: '500' },
  backdrop: { flex: 1, backgroundColor: 'rgba(51,64,47,0.35)' },
  sheet: { backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 22, gap: 8, maxHeight: '85%' },
  sheetTitle: { fontSize: 20, fontWeight: '600', color: colors.ink, marginBottom: 4 },
  label: { fontSize: 13, color: colors.mutedInk, marginTop: 4 },
  errorText: { color: colors.danger, fontSize: 13 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.card },
  chipSelected: { backgroundColor: colors.ink },
  chipText: { fontSize: 13, color: colors.ink },
  chipTextSelected: { color: colors.background },
  input: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, backgroundColor: colors.card },
  button: { backgroundColor: colors.accent, borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  buttonText: { color: colors.background, fontSize: 16, fontWeight: '600' },
});
