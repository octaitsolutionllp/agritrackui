import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

// Small "?" button that opens a short explanation — for the one or two screens where the data
// model (farm vs plot, what a crop cycle needs) isn't obvious from the UI alone. Uses a Modal
// rather than an absolutely-positioned popover: React Native Web's scrollable lists (FlatList)
// establish their own stacking context and paint over a plain absolute-positioned sibling
// regardless of zIndex, which hid the popover behind the farm cards below it. A Modal always
// renders in its own top-level layer, so this can't happen. Keep this rare: most screens should
// be self-explanatory without one.
export default function HelpTooltip({ title, body }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable style={styles.button} onPress={() => setOpen(true)} hitSlop={8}>
        <Ionicons name="help-circle-outline" size={22} color={colors.mutedInk} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
          <Pressable style={styles.closeButton} onPress={() => setOpen(false)}>
            <Text style={styles.closeButtonText}>OK</Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: { padding: 2 },
  backdrop: { flex: 1, backgroundColor: 'rgba(30,58,41,0.35)' },
  card: {
    position: 'absolute',
    left: 20,
    right: 20,
    top: '30%',
    borderRadius: 14,
    backgroundColor: colors.card,
    padding: 18,
    gap: 8,
  },
  title: { fontSize: 16, fontWeight: '700', color: colors.ink },
  body: { fontSize: 14, color: colors.mutedInk, lineHeight: 20 },
  closeButton: { backgroundColor: colors.accent, borderRadius: 8, paddingVertical: 10, alignItems: 'center', marginTop: 6 },
  closeButtonText: { color: colors.background, fontSize: 15, fontWeight: '600' },
});
