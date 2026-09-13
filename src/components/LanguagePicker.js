import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SUPPORTED_LANGUAGES } from '../i18n/strings';
import { colors } from '../theme/colors';

export default function LanguagePicker({ value, onChange }) {
  return (
    <View style={styles.row}>
      {SUPPORTED_LANGUAGES.map(({ code, label }) => {
        const selected = code === value;
        return (
          <Pressable
            key={code}
            onPress={() => onChange(code)}
            style={[styles.pill, selected && styles.pillSelected]}
          >
            <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  pill: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: colors.card,
  },
  pillSelected: { backgroundColor: colors.ink },
  pillText: { fontSize: 14, color: colors.ink },
  pillTextSelected: { color: colors.background },
});
