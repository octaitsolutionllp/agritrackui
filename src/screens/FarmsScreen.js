import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { createFarm, createField, listFarms } from '../api/farms';
import { parseOptionalNumber } from '../utils/numbers';
import EmptyState from '../components/EmptyState';
import HelpTooltip from '../components/HelpTooltip';
import LoadingSpinner from '../components/LoadingSpinner';
import Screen from '../components/Screen';
import ScreenHeader from '../components/ScreenHeader';
import { useLanguage } from '../context/LanguageContext';
import { colors } from '../theme/colors';

export default function FarmsScreen() {
  const { strings } = useLanguage();
  const t = strings.farms;

  const [loading, setLoading] = useState(true);
  const [farms, setFarms] = useState([]);
  const [addFarmVisible, setAddFarmVisible] = useState(false);
  const [addFieldFarmId, setAddFieldFarmId] = useState(null);

  const load = useCallback(async () => {
    const data = await listFarms();
    setFarms(data);
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
        title={t.title}
        right={
          <>
            <HelpTooltip title={strings.help.farmsTooltipTitle} body={strings.help.farmsTooltipBody} />
            <Pressable style={styles.addChip} onPress={() => setAddFarmVisible(true)}>
              <Text style={styles.addChipText}>{t.addBtn}</Text>
            </Pressable>
          </>
        }
      />

      <FlatList
        contentContainerStyle={styles.content}
        data={farms}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<EmptyState message={t.noFarms} />}
        renderItem={({ item }) => (
          <View style={styles.farmCard}>
            <View style={styles.farmHeaderRow}>
              <Text style={styles.farmName}>{item.name}</Text>
              {item.totalAreaAcres ? (
                <Text style={styles.farmArea}>
                  {item.totalAreaAcres} {t.acres}
                </Text>
              ) : null}
            </View>
            {item.fields.map((field) => (
              <View key={field.id} style={styles.fieldRow}>
                <Text style={styles.fieldName}>{field.name}</Text>
                <Text style={styles.fieldMeta}>
                  {field.areaAcres ? `${field.areaAcres} ${t.acres}` : t.empty}
                  {field.soilType ? ` · ${field.soilType}` : ''}
                </Text>
              </View>
            ))}
            <Pressable style={styles.addFieldLink} onPress={() => setAddFieldFarmId(item.id)}>
              <Text style={styles.addFieldLinkText}>{t.addPlotBtn}</Text>
            </Pressable>
          </View>
        )}
      />

      <AddFarmModal
        visible={addFarmVisible}
        onClose={() => setAddFarmVisible(false)}
        onCreated={load}
        strings={t}
      />
      <AddFieldModal
        farmId={addFieldFarmId}
        onClose={() => setAddFieldFarmId(null)}
        onCreated={load}
        strings={t}
      />
    </Screen>
  );
}

function AddFarmModal({ visible, onClose, onCreated, strings: t }) {
  const [name, setName] = useState('');
  const [area, setArea] = useState('');
  const [error, setError] = useState(null);

  const submit = async () => {
    setError(null);
    if (!name.trim()) return;
    let parsedArea;
    try {
      parsedArea = parseOptionalNumber(area);
    } catch (err) {
      setError(err.message);
      return;
    }
    try {
      await createFarm({ name: name.trim(), totalAreaAcres: parsedArea });
      setName('');
      setArea('');
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
        <Text style={styles.sheetTitle}>{t.addFarmTitle}</Text>
        <TextInput style={styles.input} placeholder={t.farmNamePlaceholder} value={name} onChangeText={setName} />
        <TextInput
          style={styles.input}
          placeholder={t.totalAreaPlaceholder}
          keyboardType="numeric"
          value={area}
          onChangeText={setArea}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Pressable style={styles.button} onPress={submit}>
          <Text style={styles.buttonText}>Save</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

function AddFieldModal({ farmId, onClose, onCreated, strings: t }) {
  const [name, setName] = useState('');
  const [area, setArea] = useState('');
  const [soilType, setSoilType] = useState('');
  const [error, setError] = useState(null);

  const submit = async () => {
    setError(null);
    if (!name.trim() || !farmId) return;
    let parsedArea;
    try {
      parsedArea = parseOptionalNumber(area);
    } catch (err) {
      setError(err.message);
      return;
    }
    try {
      await createField({ farmId, name: name.trim(), areaAcres: parsedArea, soilType: soilType || null });
      setName('');
      setArea('');
      setSoilType('');
      onClose();
      onCreated();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Something went wrong. Please try again.');
    }
  };

  return (
    <Modal visible={!!farmId} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <Text style={styles.sheetTitle}>{t.addPlotTitle}</Text>
        <TextInput style={styles.input} placeholder={t.plotNamePlaceholder} value={name} onChangeText={setName} />
        <TextInput
          style={styles.input}
          placeholder={t.plotAreaPlaceholder}
          keyboardType="numeric"
          value={area}
          onChangeText={setArea}
        />
        <TextInput style={styles.input} placeholder={t.soilTypePlaceholder} value={soilType} onChangeText={setSoilType} />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Pressable style={styles.button} onPress={submit}>
          <Text style={styles.buttonText}>Save</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingTop: 4 },
  addChip: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  addChipText: { color: colors.ink, fontSize: 14 },
  farmCard: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.card,
    padding: 14,
    marginBottom: 14,
  },
  farmHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  farmName: { fontSize: 18, fontWeight: '600', color: colors.ink },
  farmArea: { fontSize: 13, color: colors.mutedInk },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.dashedBorder,
    borderStyle: 'dashed',
  },
  fieldName: { fontSize: 15, color: colors.ink },
  fieldMeta: { fontSize: 13, color: colors.mutedInk },
  addFieldLink: { marginTop: 8 },
  addFieldLinkText: { color: colors.accentDark, fontSize: 14, fontWeight: '500' },
  backdrop: { flex: 1, backgroundColor: 'rgba(51,64,47,0.35)' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 22,
    gap: 12,
  },
  sheetTitle: { fontSize: 20, fontWeight: '600', color: colors.ink },
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
  errorText: { color: colors.danger, fontSize: 13 },
  buttonText: { color: colors.background, fontSize: 16, fontWeight: '600' },
});
