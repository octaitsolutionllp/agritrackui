import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

// Inline confirm instead of Alert.alert — Alert has inconsistent/no support on web (react-native-web),
// and this app's web build is the active release target, so a native-only confirm dialog isn't safe to rely on.
export default function DeleteButton({ onConfirm, confirmLabel = 'Delete?', cancelLabel = 'Cancel' }) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <View style={styles.row}>
        <Pressable onPress={onConfirm} style={styles.confirmChip} hitSlop={8}>
          <Text style={styles.confirmText}>{confirmLabel}</Text>
        </Pressable>
        <Pressable onPress={() => setConfirming(false)} style={styles.cancelChip} hitSlop={8}>
          <Text style={styles.cancelText}>{cancelLabel}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable onPress={() => setConfirming(true)} hitSlop={10}>
      <Ionicons name="trash-outline" size={18} color={colors.mutedInk} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  confirmChip: { backgroundColor: colors.danger, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  confirmText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  cancelChip: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  cancelText: { color: colors.ink, fontSize: 12 },
});
