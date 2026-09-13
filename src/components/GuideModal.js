import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { colors } from '../theme/colors';

// Multi-step walkthrough covering the core data model (farm → plot → crop cycle) and the main
// tabs. Shown once automatically on first login (see DashboardScreen), and reachable again
// anytime from Profile → "How to use AgriTrack".
export default function GuideModal({ visible, onClose }) {
  const { strings } = useLanguage();
  const t = strings.help;
  const [step, setStep] = useState(0);

  const isLast = step === t.steps.length - 1;
  const current = t.steps[step];

  const close = () => {
    setStep(0);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close} />
      <View style={styles.sheet}>
        <Text style={styles.guideTitle}>{t.guideTitle}</Text>

        <View style={styles.dots}>
          {t.steps.map((_, i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>

        <Text style={styles.stepTitle}>{current.title}</Text>
        <Text style={styles.stepBody}>{current.body}</Text>

        <View style={styles.footer}>
          {step > 0 ? (
            <Pressable style={styles.secondaryButton} onPress={() => setStep((s) => s - 1)}>
              <Text style={styles.secondaryButtonText}>{t.backBtn}</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.secondaryButton} onPress={close}>
              <Text style={styles.secondaryButtonText}>{t.skipBtn}</Text>
            </Pressable>
          )}
          <Pressable
            style={styles.primaryButton}
            onPress={() => (isLast ? close() : setStep((s) => s + 1))}
          >
            <Text style={styles.primaryButtonText}>{isLast ? t.doneBtn : t.nextBtn}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(30,58,41,0.45)' },
  sheet: {
    position: 'absolute',
    left: 20,
    right: 20,
    top: '25%',
    borderRadius: 16,
    backgroundColor: colors.background,
    padding: 24,
    gap: 12,
  },
  guideTitle: { fontSize: 18, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 4 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.accent, width: 18 },
  stepTitle: { fontSize: 17, fontWeight: '600', color: colors.ink, textAlign: 'center' },
  stepBody: { fontSize: 14, color: colors.mutedInk, lineHeight: 21, textAlign: 'center' },
  footer: { flexDirection: 'row', gap: 10, marginTop: 10 },
  primaryButton: { flex: 1, backgroundColor: colors.accent, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  primaryButtonText: { color: colors.background, fontSize: 15, fontWeight: '600' },
  secondaryButton: { flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  secondaryButtonText: { color: colors.ink, fontSize: 15, fontWeight: '600' },
});
