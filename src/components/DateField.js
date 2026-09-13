import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

// Cross-platform date picker: a real browser <input type="date"> on web (native picker UI,
// keyboard-typeable, no extra library), and @react-native-community/datetimepicker's native
// modal on iOS/Android. `value`/`onChange` both use plain "YYYY-MM-DD" strings throughout the
// app, matching what the API expects — this component is the only place that touches Date objects.
export default function DateField({ value, onChange, style }) {
  if (Platform.OS === 'web') {
    // The browser draws its own native calendar-picker icon inside <input type="date"> —
    // some browsers' CSS resets hide it (hence the overlay this used to add), but where it's
    // visible an added Ionicons overlay next to it just doubles up. Give the native icon room
    // via paddingRight and don't draw a second one on top of it.
    return (
      <View style={[styles.webWrapper, style]}>
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            border: `1.5px solid ${colors.border}`,
            borderRadius: 8,
            paddingTop: 10,
            paddingBottom: 10,
            paddingLeft: 12,
            paddingRight: 12,
            fontSize: 15,
            fontFamily: 'inherit',
            color: colors.ink,
            backgroundColor: colors.card,
            width: '100%',
            boxSizing: 'border-box',
          }}
        />
      </View>
    );
  }

  return <NativeDateField value={value} onChange={onChange} style={style} />;
}

function NativeDateField({ value, onChange, style }) {
  // Native module — only imported/used off the web bundle, since it has no web implementation.
  const DateTimePicker = require('@react-native-community/datetimepicker').default;
  const [showPicker, setShowPicker] = useState(false);

  const dateValue = value ? new Date(`${value}T00:00:00`) : new Date();

  return (
    <>
      <Pressable style={[styles.input, style]} onPress={() => setShowPicker(true)}>
        <Text style={styles.text}>{value || 'Select date'}</Text>
        <Ionicons name="calendar-outline" size={18} color={colors.mutedInk} />
      </Pressable>
      {showPicker ? (
        <DateTimePicker
          value={dateValue}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(event, selectedDate) => {
            setShowPicker(false);
            if (event.type !== 'dismissed' && selectedDate) {
              onChange(selectedDate.toISOString().slice(0, 10));
            }
          }}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  webWrapper: { position: 'relative', justifyContent: 'center' },
  input: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.card,
  },
  text: { fontSize: 15, color: colors.ink },
});
