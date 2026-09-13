import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { createHarvest, deleteHarvest, listHarvests } from '../api/harvests';
import { parseOptionalNumber } from '../utils/numbers';
import DateField from '../components/DateField';
import DeleteButton from '../components/DeleteButton';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import Screen from '../components/Screen';
import ScreenHeader from '../components/ScreenHeader';
import { useLanguage } from '../context/LanguageContext';
import { colors } from '../theme/colors';

export default function HarvestScreen({ route, navigation }) {
  const { cropCycleId } = route.params;
  const { strings } = useLanguage();
  const t = strings.harvest;

  const [loading, setLoading] = useState(true);
  const [harvests, setHarvests] = useState([]);
  const [addVisible, setAddVisible] = useState(false);

  const load = useCallback(async () => {
    const data = await listHarvests(cropCycleId);
    setHarvests(data);
  }, [cropCycleId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().finally(() => setLoading(false));
    }, [load])
  );

  if (loading) return <LoadingSpinner />;

  const handleDelete = async (id) => {
    await deleteHarvest(id);
    await load();
  };

  return (
    <Screen>
      <ScreenHeader title={t.title} onBack={() => navigation.goBack()} />

      <FlatList
        contentContainerStyle={styles.content}
        data={harvests}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<EmptyState message={t.noHarvests} />}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.rowMain}>
              <Text style={styles.date}>{item.harvestDate}</Text>
              {item.yieldQuantity ? (
                <Text style={styles.meta}>
                  {item.yieldQuantity} {item.yieldUnit ?? ''}
                </Text>
              ) : null}
            </View>
            {item.saleIncome ? (
              <Text style={styles.income}>₹{item.saleIncome.toLocaleString('en-IN')}</Text>
            ) : null}
            <DeleteButton onConfirm={() => handleDelete(item.id)} />
          </View>
        )}
      />

      <Pressable style={styles.addButton} onPress={() => setAddVisible(true)}>
        <Text style={styles.addButtonText}>{strings.cropCycle.recordHarvestBtn}</Text>
      </Pressable>

      <AddHarvestModal
        visible={addVisible}
        onClose={() => setAddVisible(false)}
        cropCycleId={cropCycleId}
        onCreated={load}
        strings={t}
      />
    </Screen>
  );
}

function AddHarvestModal({ visible, onClose, cropCycleId, onCreated, strings: t }) {
  const [harvestDate, setHarvestDate] = useState(new Date().toISOString().slice(0, 10));
  const [yieldQuantity, setYieldQuantity] = useState('');
  const [yieldUnit, setYieldUnit] = useState('');
  const [saleIncome, setSaleIncome] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);

  const submit = async () => {
    setError(null);
    let parsedYield, parsedIncome;
    try {
      parsedYield = parseOptionalNumber(yieldQuantity);
      parsedIncome = parseOptionalNumber(saleIncome);
    } catch (err) {
      setError(err.message);
      return;
    }
    try {
      await createHarvest({
        cropCycleId,
        harvestDate,
        yieldQuantity: parsedYield,
        yieldUnit: yieldUnit || null,
        saleIncome: parsedIncome,
        notes: notes || null,
      });
      setYieldQuantity('');
      setYieldUnit('');
      setSaleIncome('');
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
        <Text style={styles.sheetTitle}>{t.title}</Text>

        <Text style={styles.label}>{t.harvestDateLabel}</Text>
        <DateField value={harvestDate} onChange={setHarvestDate} />

        <View style={styles.row2}>
          <View style={styles.field}>
            <Text style={styles.label}>{t.yieldQuantityLabel}</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={yieldQuantity} onChangeText={setYieldQuantity} />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>{t.yieldUnitLabel}</Text>
            <TextInput style={styles.input} value={yieldUnit} onChangeText={setYieldUnit} />
          </View>
        </View>

        <Text style={styles.label}>{t.saleIncomeLabel}</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={saleIncome} onChangeText={setSaleIncome} />

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
  rowMain: { flex: 1 },
  date: { fontSize: 15, color: colors.ink },
  meta: { fontSize: 13, color: colors.mutedInk, marginTop: 2 },
  income: { fontSize: 15, color: colors.accentDark, fontWeight: '600' },
  addButton: { margin: 20, borderWidth: 1.5, borderColor: colors.border, borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  addButtonText: { fontSize: 16, color: colors.ink, fontWeight: '500' },
  backdrop: { flex: 1, backgroundColor: 'rgba(30,58,41,0.35)' },
  sheet: { backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 22, gap: 8, maxHeight: '85%' },
  sheetTitle: { fontSize: 20, fontWeight: '600', color: colors.ink, marginBottom: 4 },
  label: { fontSize: 13, color: colors.mutedInk, marginTop: 4 },
  errorText: { color: colors.danger, fontSize: 13 },
  row2: { flexDirection: 'row', gap: 12 },
  field: { flex: 1 },
  input: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, backgroundColor: colors.card },
  button: { backgroundColor: colors.accent, borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  buttonText: { color: colors.background, fontSize: 16, fontWeight: '600' },
});
