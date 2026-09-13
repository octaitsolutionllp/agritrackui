import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

const STAGES = ['LandPreparation', 'Sowing', 'Germination', 'Vegetative', 'Flowering', 'Fruiting'];

export default function StageProgressBar({ currentStage, labels }) {
  const currentIndex = STAGES.indexOf(currentStage);

  return (
    <View>
      <View style={styles.row}>
        {STAGES.map((stage, index) => (
          <React.Fragment key={stage}>
            <View style={[styles.dot, index <= currentIndex && styles.dotFilled]} />
            {index < STAGES.length - 1 ? (
              <View style={[styles.line, index < currentIndex && styles.lineFilled]} />
            ) : null}
          </React.Fragment>
        ))}
      </View>
      <View style={styles.labelRow}>
        {labels.map((label) => (
          <Text key={label} style={styles.label}>
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.dashedBorder,
    backgroundColor: colors.background,
  },
  dotFilled: { borderColor: colors.border, backgroundColor: colors.accent },
  line: { flex: 1, height: 2, backgroundColor: colors.dashedBorder },
  lineFilled: { backgroundColor: colors.border },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  label: { fontSize: 11, color: colors.mutedInk },
});
