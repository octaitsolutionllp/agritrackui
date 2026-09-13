import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

export default function ScreenHeader({ title, subtitle, onBack, right }) {
  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={12} style={styles.backButton}>
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>
        ) : null}
        <Text style={styles.title}>{title}</Text>
        <View style={styles.right}>{right}</View>
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 8 },
  backArrow: { fontSize: 28, color: colors.ink, lineHeight: 28 },
  title: { fontSize: 22, fontWeight: '600', color: colors.ink, flex: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  subtitle: { fontSize: 14, color: colors.mutedInk, marginTop: 4 },
});
