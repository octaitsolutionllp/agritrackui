import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { listMyCropTypes } from '../api/cropTypes';
import { createCropCycle, listCropCycles } from '../api/cropCycles';
import { listFarms } from '../api/farms';
import DateField from '../components/DateField';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import Screen from '../components/Screen';
import ScreenHeader from '../components/ScreenHeader';
import { useLanguage } from '../context/LanguageContext';
import { colors } from '../theme/colors';
import { translateCropName } from '../utils/cropNames';

export default function CropCyclesScreen({ navigation }) {
  const { strings } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [cycles, setCycles] = useState([]);
  const [startVisible, setStartVisible] = useState(false);

  const load = useCallback(async () => {
    const data = await listCropCycles();
    setCycles(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().finally(() => setLoading(false));
    }, [load])
  );

  if (loading) return <LoadingSpinner />;

  return (
    <Screen>
      <ScreenHeader
        title={strings.common.navCycles}
        right={
          <Pressable style={styles.addChip} onPress={() => setStartVisible(true)}>
            <Text style={styles.addChipText}>+</Text>
          </Pressable>
        }
      />
      <FlatList
        contentContainerStyle={styles.content}
        data={cycles}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<EmptyState message={strings.dashboard.noCycles} />}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => navigation.navigate('CropCycle', { cropCycleId: item.id })}
          >
            <View>
              <Text style={styles.crop}>
                {translateCropName(item.cropTypeName, strings.common)}
                {item.cycleLabel ? ` · ${item.cycleLabel}` : ''}
              </Text>
              <Text style={styles.field}>{item.fieldName}</Text>
            </View>
            <View style={styles.stagePill}>
              <Text style={styles.stagePillText}>{item.currentStage}</Text>
            </View>
          </Pressable>
        )}
      />

      <StartCropCycleModal visible={startVisible} onClose={() => setStartVisible(false)} onCreated={load} />
    </Screen>
  );
}

function StartCropCycleModal({ visible, onClose, onCreated }) {
  const { strings } = useLanguage();
  const [fields, setFields] = useState([]);
  const [cropTypes, setCropTypes] = useState([]);
  const [fieldId, setFieldId] = useState(null);
  const [cropTypeId, setCropTypeId] = useState(null);
  const [sownDate, setSownDate] = useState(new Date().toISOString().slice(0, 10));
  const [cycleLabel, setCycleLabel] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (!visible) return;
      (async () => {
        const [farms, types] = await Promise.all([listFarms(), listMyCropTypes()]);
        setFields(farms.flatMap((f) => f.fields.map((field) => ({ ...field, farmName: f.name }))));
        setCropTypes(types);
      })();
    }, [visible])
  );

  const [validationMessage, setValidationMessage] = useState(null);

  const submit = async () => {
    if (fields.length === 0) {
      setValidationMessage('Add a farm and field first, from the Farms tab.');
      return;
    }
    if (!fieldId || !cropTypeId) {
      setValidationMessage('Please select a field and a crop.');
      return;
    }
    setValidationMessage(null);
    await createCropCycle({ fieldId, cropTypeId, sownDate, expectedHarvestDate: null, cycleLabel: cycleLabel || null });
    setCycleLabel('');
    onClose();
    onCreated();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <Text style={styles.sheetTitle}>Start Crop Cycle</Text>

        <Text style={styles.pickerLabel}>Field</Text>
        {fields.length === 0 ? (
          <Text style={styles.emptyHint}>No fields yet — add a farm and field from the Farms tab first.</Text>
        ) : null}
        <View style={styles.pickerRow}>
          {fields.map((field) => (
            <Pressable
              key={field.id}
              onPress={() => setFieldId(field.id)}
              style={[styles.chip, fieldId === field.id && styles.chipSelected]}
            >
              <Text style={[styles.chipText, fieldId === field.id && styles.chipTextSelected]}>
                {field.farmName} · {field.name}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.pickerLabel}>Crop</Text>
        <View style={styles.pickerRow}>
          {cropTypes.map((cropType) => (
            <Pressable
              key={cropType.id}
              onPress={() => setCropTypeId(cropType.id)}
              style={[styles.chip, cropTypeId === cropType.id && styles.chipSelected]}
            >
              <Text style={[styles.chipText, cropTypeId === cropType.id && styles.chipTextSelected]}>
                {translateCropName(cropType.name, strings.common)}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.pickerLabel}>Sown date</Text>
        <DateField value={sownDate} onChange={setSownDate} />

        <Text style={styles.pickerLabel}>{strings.cropCycle.cycleLabelLabel} (optional)</Text>
        <TextInput
          style={styles.input}
          value={cycleLabel}
          onChangeText={setCycleLabel}
          placeholder={strings.cropCycle.cycleLabelPlaceholder}
          placeholderTextColor={colors.mutedInk}
        />

        {validationMessage ? <Text style={styles.validationText}>{validationMessage}</Text> : null}

        <Pressable style={styles.button} onPress={submit}>
          <Text style={styles.buttonText}>Save</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingTop: 4 },
  addChip: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 4 },
  addChipText: { color: colors.ink, fontSize: 18 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.card,
    padding: 14,
    marginBottom: 10,
  },
  crop: { fontSize: 16, fontWeight: '600', color: colors.ink },
  field: { fontSize: 13, color: colors.mutedInk },
  stagePill: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  stagePillText: { fontSize: 12, color: colors.ink },
  backdrop: { flex: 1, backgroundColor: 'rgba(51,64,47,0.35)' },
  sheet: { backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 22, gap: 10, maxHeight: '85%' },
  sheetTitle: { fontSize: 20, fontWeight: '600', color: colors.ink, marginBottom: 4 },
  pickerLabel: { fontSize: 13, color: colors.mutedInk },
  emptyHint: { fontSize: 13, color: colors.danger, marginBottom: 4 },
  validationText: { fontSize: 13, color: colors.danger },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.card },
  chipSelected: { backgroundColor: colors.ink },
  chipText: { fontSize: 13, color: colors.ink },
  chipTextSelected: { color: colors.background },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: colors.card,
  },
  button: { backgroundColor: colors.accent, borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 6 },
  buttonText: { color: colors.background, fontSize: 16, fontWeight: '600' },
});
