import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

// Small "?" button that toggles a short inline explanation below it — for the one or two
// screens where the data model (farm vs field, what a crop cycle needs) isn't obvious from
// the UI alone. Keep this rare: most screens should be self-explanatory without one.
export default function HelpTooltip({ title, body }) {
  const [open, setOpen] = useState(false);

  return (
    <View>
      <Pressable style={styles.button} onPress={() => setOpen((v) => !v)} hitSlop={8}>
        <Ionicons name="help-circle-outline" size={22} color={colors.mutedInk} />
      </Pressable>
      {open ? (
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  button: { padding: 2 },
  card: {
    position: 'absolute',
    top: 30,
    right: 0,
    width: 260,
    zIndex: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.card,
    padding: 12,
    gap: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  title: { fontSize: 14, fontWeight: '600', color: colors.ink },
  body: { fontSize: 13, color: colors.mutedInk, lineHeight: 18 },
});
